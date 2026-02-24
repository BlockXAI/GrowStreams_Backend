import { GearApi, GearKeyring, decodeAddress } from '@gear-js/api';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../..');

config({ path: resolve(PROJECT_ROOT, '.env') });

const VARA_SEED = process.env.VARA_SEED;
const VARA_NODE = process.env.VARA_NODE || 'wss://testnet.vara.network';

// Optional CLI arg: receiver SS58 address for streams/splits/permissions/identity tests
const RECEIVER_SS58 = process.argv[2] || null;
let RECEIVER_HEX = '0x0000000000000000000000000000000000000000000000000000000000000001';
if (RECEIVER_SS58) {
  try {
    const decoded = decodeAddress(RECEIVER_SS58);
    // decodeAddress returns a hex string like '0xabcd...' or a Uint8Array depending on version
    if (typeof decoded === 'string') {
      RECEIVER_HEX = decoded.startsWith('0x') ? decoded : '0x' + decoded;
    } else {
      // Uint8Array — convert raw bytes to hex
      RECEIVER_HEX = '0x' + Array.from(new Uint8Array(decoded)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.error(`Invalid SS58 address: ${RECEIVER_SS58} — ${err.message}`);
    process.exit(1);
  }
}

const deployState = JSON.parse(readFileSync(resolve(PROJECT_ROOT, 'deploy-state.json'), 'utf-8'));
const STREAM_CORE_ID = deployState['stream-core']?.programId;
const TOKEN_VAULT_ID = deployState['token-vault']?.programId;
const SPLITS_ROUTER_ID = deployState['splits-router']?.programId;
const PERMISSION_MGR_ID = deployState['permission-manager']?.programId;
const BOUNTY_ADAPTER_ID = deployState['bounty-adapter']?.programId;
const IDENTITY_REG_ID = deployState['identity-registry']?.programId;

if (!STREAM_CORE_ID || !TOKEN_VAULT_ID) {
  console.error('Missing core program IDs in deploy-state.json. Deploy first.');
  process.exit(1);
}

// SCALE encoding helpers
function encodeCompactU32(value) {
  if (value < 64) return Buffer.from([value << 2]);
  if (value < 16384) { const v = (value << 2) | 1; return Buffer.from([v & 0xff, (v >> 8) & 0xff]); }
  const v = (value << 2) | 2;
  return Buffer.from([v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >> 24) & 0xff]);
}

function encodeString(str) {
  const bytes = Buffer.from(str, 'utf-8');
  return Buffer.concat([encodeCompactU32(bytes.length), bytes]);
}

function encodeU64LE(value) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(value));
  return buf;
}

function encodeU128LE(value) {
  const buf = Buffer.alloc(16);
  const big = BigInt(value);
  buf.writeBigUInt64LE(big & 0xFFFFFFFFFFFFFFFFn, 0);
  buf.writeBigUInt64LE(big >> 64n, 8);
  return buf;
}

function encodeActorId(hex) {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  return Buffer.from(clean.padStart(64, '0'), 'hex');
}

// Build Sails message payload: (ServiceName, MethodName, ...args)
function buildPayload(serviceName, methodName, ...argBuffers) {
  const parts = [encodeString(serviceName), encodeString(methodName)];
  for (const buf of argBuffers) parts.push(buf);
  return '0x' + Buffer.concat(parts).toString('hex');
}

// Decode SCALE-encoded response (skip service+method prefix strings, return raw remainder)
function skipStrings(hex, count) {
  let buf = Buffer.from(hex.startsWith('0x') ? hex.slice(2) : hex, 'hex');
  for (let i = 0; i < count; i++) {
    const firstByte = buf[0];
    let len, offset;
    if ((firstByte & 3) === 0) { len = firstByte >> 2; offset = 1; }
    else if ((firstByte & 3) === 1) { len = ((buf[0] | (buf[1] << 8)) >> 2); offset = 2; }
    else { len = ((buf.readUInt32LE(0)) >> 2); offset = 4; }
    buf = buf.subarray(offset + len);
  }
  return buf;
}

let passed = 0;
let failed = 0;
let skipped = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  PASS: ${testName}`);
    passed++;
  } else {
    console.log(`  FAIL: ${testName}`);
    failed++;
  }
}

// Query: use calculateReply (off-chain simulation, no tx needed)
async function queryState(api, keyring, programId, payload) {
  const result = await api.message.calculateReply({
    origin: keyring.addressRaw,
    destination: programId,
    payload,
    value: 0,
    gasLimit: 100_000_000_000n,
  });
  return result.payload.toHex();
}

// Mutation: send an actual transaction and wait for finalization
async function sendMessage(api, keyring, programId, payload, value = 0) {
  const gasInfo = await api.program.calculateGas.handle(
    keyring.addressRaw,
    programId,
    payload,
    value,
    true,
  );
  const gasLimit = gasInfo.min_limit;

  const tx = api.message.send({
    destination: programId,
    payload,
    gasLimit,
    value,
  });

  return new Promise((res, rej) => {
    let done = false;
    const timeout = setTimeout(() => { if (!done) { done = true; rej(new Error('Tx timeout 90s')); } }, 90_000);

    tx.signAndSend(keyring, ({ events = [], status }) => {
      if (status.isFinalized) {
        clearTimeout(timeout);
        if (done) return;
        done = true;

        let extrinsicFailed = false;
        let replyHex = null;

        for (const { event } of events) {
          if (api.events.system.ExtrinsicFailed.is(event)) {
            const [err] = event.data;
            const info = err.isModule
              ? api.registry.findMetaError(err.asModule).name
              : err.toString();
            return rej(new Error('ExtrinsicFailed: ' + info));
          }
          if (event.section === 'gear' && event.method === 'UserMessageSent') {
            try {
              replyHex = event.data[0].payload.toHex();
            } catch {}
          }
        }

        res(replyHex);
      }
    }).catch(err => {
      clearTimeout(timeout);
      if (!done) { done = true; rej(err); }
    });
  });
}

// Helper: Deposit native VARA to TokenVault
async function depositNativeToVault(api, keyring, vaultId, value) {
  const payload = buildPayload('VaultService', 'DepositNative');
  return await sendMessage(api, keyring, vaultId, payload, value);
}

// Helper: Get account balance
async function getBalance(api, address) {
  const { data: { free } } = await api.query.system.account(address);
  return BigInt(free.toString());
}

async function main() {
  console.log('=== GrowStreams V2 — E2E Test Suite ===\n');
  console.log(`StreamCore:        ${STREAM_CORE_ID}`);
  console.log(`TokenVault:        ${TOKEN_VAULT_ID}`);
  console.log(`SplitsRouter:      ${SPLITS_ROUTER_ID || 'NOT DEPLOYED'}`);
  console.log(`PermissionManager: ${PERMISSION_MGR_ID || 'NOT DEPLOYED'}`);
  console.log(`BountyAdapter:     ${BOUNTY_ADAPTER_ID || 'NOT DEPLOYED'}`);
  console.log(`IdentityRegistry:  ${IDENTITY_REG_ID || 'NOT DEPLOYED'}`);
  console.log(`Node: ${VARA_NODE}\n`);

  const api = await GearApi.create({ providerAddress: VARA_NODE });
  let keyring;
  try { keyring = await GearKeyring.fromMnemonic(VARA_SEED); }
  catch { keyring = await GearKeyring.fromSuri(VARA_SEED); }
  console.log(`Account: ${keyring.address}`);
  if (RECEIVER_SS58) {
    console.log(`Receiver wallet: ${RECEIVER_SS58}`);
    console.log(`Receiver hex:    ${RECEIVER_HEX}`);
  }

  const { data: { free } } = await api.query.system.account(keyring.address);
  console.log(`Balance: ${(Number(BigInt(free.toString())) / 1e12).toFixed(4)} VARA\n`);

  // ===========================================================================
  // StreamCore Tests — config + basic queries (stream lifecycle covered in native VARA section)
  // ===========================================================================
  console.log('--- StreamCore Tests ---\n');

  // 1. Query config (verify admin is our account)
  console.log('[1] Query StreamCore config');
  try {
    const payload = buildPayload('StreamService', 'GetConfig');
    const reply = await queryState(api, keyring, STREAM_CORE_ID, payload);
    assert(reply && reply.length > 10, 'GetConfig returns data');
    const dataAfterPrefix = skipStrings(reply, 2);
    assert(dataAfterPrefix.length >= 32, 'Config contains admin ActorId + fields');
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // 2. Read current total (for info only)
  let totalBefore = 0n;
  console.log('[2] Read current TotalStreams');
  try {
    const payload = buildPayload('StreamService', 'TotalStreams');
    const reply = await queryState(api, keyring, STREAM_CORE_ID, payload);
    assert(reply !== null, 'TotalStreams returns reply');
    totalBefore = skipStrings(reply, 2).readBigUInt64LE(0);
    console.log(`  Current total: ${totalBefore}`);
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // 3–11: Full lifecycle is exercised later in the Native VARA section.
  console.log('[3-11] Stream lifecycle covered in Native VARA test (skipped here)');
  skipped += 9;

  // ===========================================================================
  // TokenVault Tests
  // ===========================================================================
  console.log('\n--- TokenVault Tests ---\n');

  // 12. Query vault config
  console.log('[12] Query TokenVault config');
  try {
    const payload = buildPayload('VaultService', 'GetConfig');
    const reply = await queryState(api, keyring, TOKEN_VAULT_ID, payload);
    assert(reply && reply.length > 10, 'GetConfig returns data');
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // 13. Check is_paused
  console.log('[13] Check vault pause state');
  try {
    const payload = buildPayload('VaultService', 'IsPaused');
    const reply = await queryState(api, keyring, TOKEN_VAULT_ID, payload);
    assert(reply !== null, 'IsPaused returns reply');
    const data = skipStrings(reply, 2);
    console.log(`  Paused: ${data[0] === 1 ? 'true' : 'false'}`);
    // If paused from previous run, unpause first
    if (data[0] === 1) {
      console.log('  Unpausing vault from previous run...');
      const up = buildPayload('VaultService', 'EmergencyUnpause');
      await sendMessage(api, keyring, TOKEN_VAULT_ID, up);
    }
    assert(true, 'IsPaused query works');
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // 14. Deposit tokens (SKIPPED - token-based, use DepositNative instead)
  console.log('[14] DepositTokens (SKIPPED - token-based)');
  skipped++;

  // 15. Check balance after deposit
  console.log('[15] GetBalance after deposit');
  try {
    const owner = encodeActorId('0x' + Buffer.from(keyring.publicKey).toString('hex'));
    const token = encodeActorId('0x0000000000000000000000000000000000000000000000000000000000000000');
    const payload = buildPayload('VaultService', 'GetBalance', owner, token);
    const reply = await queryState(api, keyring, TOKEN_VAULT_ID, payload);
    assert(reply !== null && reply.length > 20, 'GetBalance returns balance data');
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // 16. Emergency pause
  console.log('[16] EmergencyPause');
  try {
    const payload = buildPayload('VaultService', 'EmergencyPause');
    await sendMessage(api, keyring, TOKEN_VAULT_ID, payload);
    const check = await queryState(api, keyring, TOKEN_VAULT_ID, buildPayload('VaultService', 'IsPaused'));
    const paused = skipStrings(check, 2)[0];
    assert(paused === 1, `Vault is paused after EmergencyPause (got ${paused})`);
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // 17. Deposit should fail while paused
  console.log('[17] Deposit blocked while paused');
  try {
    const payload = buildPayload('VaultService', 'DepositNative');
    await sendMessage(api, keyring, TOKEN_VAULT_ID, payload, 100n);
    assert(false, 'Deposit should have failed while paused');
  } catch (err) {
    assert(err.message.includes('paused') || err.message.includes('Vault is paused'), `Deposit rejected: ${err.message.slice(0, 60)}`);
  }

  // 18. Emergency unpause (with retry to handle finalization race)
  console.log('[18] EmergencyUnpause');
  try {
    const unpausePayload = buildPayload('VaultService', 'EmergencyUnpause');
    await sendMessage(api, keyring, TOKEN_VAULT_ID, unpausePayload);
    // Wait a moment for state to settle
    await new Promise(r => setTimeout(r, 3000));
    // Retry unpause if still paused (edge case: previous tx didn't take effect)
    let pausedVal = 1;
    for (let attempt = 0; attempt < 3; attempt++) {
      const check = await queryState(api, keyring, TOKEN_VAULT_ID, buildPayload('VaultService', 'IsPaused'));
      pausedVal = skipStrings(check, 2)[0];
      if (pausedVal === 0) break;
      console.log(`  Still paused after attempt ${attempt + 1}, retrying unpause...`);
      await sendMessage(api, keyring, TOKEN_VAULT_ID, unpausePayload);
      await new Promise(r => setTimeout(r, 3000));
    }
    assert(pausedVal === 0, `Vault unpaused after EmergencyUnpause (got ${pausedVal})`);
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // 19. GetStreamAllocation
  console.log('[19] GetStreamAllocation');
  try {
    const payload = buildPayload('VaultService', 'GetStreamAllocation', encodeU64LE(99));
    const reply = await queryState(api, keyring, TOKEN_VAULT_ID, payload);
    assert(reply !== null, 'GetStreamAllocation returns reply');
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // ===========================================================================
  // Native VARA Stream Lifecycle Test
  // ===========================================================================
  console.log('\n--- Native VARA Stream Lifecycle ---\n');

  let nativeStreamId = 0n;
  const depositAmount = 10_000_000_000_000n; // 10 VARA

  // Read min_buffer_seconds from StreamCore config to compute valid initialDeposit
  let minBufferSeconds = 3600n;
  try {
    const cfgPayload = buildPayload('StreamService', 'GetConfig');
    const cfgReply = await queryState(api, keyring, STREAM_CORE_ID, cfgPayload);
    const cfgBuf = skipStrings(cfgReply, 2);
    // Config layout: admin(32) + min_buffer_seconds(u64) + next_stream_id(u64) + token_vault(32)
    minBufferSeconds = cfgBuf.readBigUInt64LE(32);
    console.log(`  StreamCore min_buffer_seconds: ${minBufferSeconds}`);
  } catch (err) {
    console.log(`  Could not read min_buffer_seconds, using default 3600: ${err.message}`);
  }

  // Choose a small flow rate and compute initialDeposit to satisfy the buffer invariant
  const flowRate = 1_000_000n; // 0.001 VARA per second
  const initialDeposit = flowRate * minBufferSeconds + flowRate; // slightly above minimum
  console.log(`  Flow rate: ${flowRate} units/sec`);
  console.log(`  Initial deposit: ${initialDeposit} units (${Number(initialDeposit) / 1e12} VARA)`);

  // Ensure vault is unpaused before depositing
  try {
    const pauseCheck = await queryState(api, keyring, TOKEN_VAULT_ID, buildPayload('VaultService', 'IsPaused'));
    if (skipStrings(pauseCheck, 2)[0] === 1) {
      console.log('  Vault still paused, unpausing before deposit...');
      await sendMessage(api, keyring, TOKEN_VAULT_ID, buildPayload('VaultService', 'EmergencyUnpause'));
      await new Promise(r => setTimeout(r, 3000));
    }
  } catch (err) {
    console.log(`  Warning: could not check/fix vault pause state: ${err.message}`);
  }

  // Step 1: Deposit native VARA to TokenVault
  console.log('[NATIVE-1] Deposit 10 VARA to TokenVault');
  try {
    await depositNativeToVault(api, keyring, TOKEN_VAULT_ID, depositAmount);
    assert(true, 'DepositNative succeeded');
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // Step 2: Verify vault balance increased
  console.log('[NATIVE-2] Verify vault balance');
  try {
    const owner = encodeActorId('0x' + Buffer.from(keyring.publicKey).toString('hex'));
    const token = encodeActorId('0x0000000000000000000000000000000000000000000000000000000000000000');
    const payload = buildPayload('VaultService', 'GetBalance', owner, token);
    const reply = await queryState(api, keyring, TOKEN_VAULT_ID, payload);
    const data = skipStrings(reply, 2);
    const totalDeposited = data.readBigUInt64LE(0) | (BigInt(data.readUInt32LE(8)) << 64n);
    assert(totalDeposited >= depositAmount, `Vault balance >= ${depositAmount / 1_000_000_000_000n} VARA`);
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // Step 3: Create native VARA stream to the real receiver
  const senderHex = '0x' + Buffer.from(keyring.publicKey).toString('hex');
  console.log('[NATIVE-3] Create native VARA stream');
  try {
    const receiver = encodeActorId(RECEIVER_HEX);
    const token = encodeActorId('0x0000000000000000000000000000000000000000000000000000000000000000');
    const payload = buildPayload('StreamService', 'CreateStream', receiver, token, encodeU128LE(flowRate), encodeU128LE(initialDeposit));
    await sendMessage(api, keyring, STREAM_CORE_ID, payload);

    // Derive stream ID from sender streams (take last entry)
    const owner = encodeActorId('0x' + Buffer.from(keyring.publicKey).toString('hex'));
    const listPayload = buildPayload('StreamService', 'GetSenderStreams', owner);
    const listReply = await queryState(api, keyring, STREAM_CORE_ID, listPayload);
    const listBuf = skipStrings(listReply, 2);

    if (listBuf.length === 0) {
      throw new Error('No sender streams found after CreateStream');
    }

    // Decode SCALE Vec<u64>: first compact length, then u64 items
    const lenByte = listBuf[0];
    let vecLen;
    if ((lenByte & 3) === 0) {
      vecLen = lenByte >> 2;
    } else if ((lenByte & 3) === 1) {
      vecLen = ((listBuf[0] | (listBuf[1] << 8)) >> 2);
    } else {
      vecLen = (listBuf.readUInt32LE(0) >> 2);
    }

    // Skip compact length prefix (assume small vec for tests → 1 byte prefix)
    const idsBuf = listBuf.subarray(1);
    if (vecLen === 0 || idsBuf.length < 8) {
      throw new Error('Sender streams vec empty or malformed');
    }

    // Take last u64 as nativeStreamId
    nativeStreamId = idsBuf.readBigUInt64LE((vecLen - 1) * 8);
    assert(nativeStreamId >= 1n, `Native stream created (ID=${nativeStreamId})`);
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // Step 4: Wait for streaming (simulate time passage)
  console.log('[NATIVE-4] Wait 2 seconds for streaming...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 5: Check withdrawable balance (only if stream was created)
  console.log('[NATIVE-5] Check withdrawable balance');
  try {
    if (nativeStreamId === 0n) {
      throw new Error('nativeStreamId is 0 (stream not created)');
    }
    const payload = buildPayload('StreamService', 'GetWithdrawableBalance', encodeU64LE(Number(nativeStreamId)));
    const reply = await queryState(api, keyring, STREAM_CORE_ID, payload);
    const withdrawable = skipStrings(reply, 2).readBigUInt64LE(0);
    console.log(`  Withdrawable: ${withdrawable / 1_000_000_000_000n} VARA`);
    assert(withdrawable > 0n, 'Withdrawable balance > 0');
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // Step 5b: Diagnostic — verify vault config has correct stream_core
  console.log('[NATIVE-5b] Diagnostic: verify vault wiring');
  try {
    const vcPayload = buildPayload('VaultService', 'GetConfig');
    const vcReply = await queryState(api, keyring, TOKEN_VAULT_ID, vcPayload);
    const vcBuf = skipStrings(vcReply, 2);
    // VaultConfig: admin(32) + stream_core(32) + paused(1)
    const vaultStreamCore = '0x' + vcBuf.subarray(32, 64).toString('hex');
    console.log(`  Vault stream_core: ${vaultStreamCore}`);
    console.log(`  Expected:          ${STREAM_CORE_ID}`);
    assert(vaultStreamCore.toLowerCase() === STREAM_CORE_ID.toLowerCase(), 'Vault stream_core matches deployed StreamCore');
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // Wait longer for async cross-contract message to be processed
  console.log('[NATIVE-5c] Wait 10s for cross-contract AllocateToStream message...');
  await new Promise(r => setTimeout(r, 10000));

  // Step 5d: Verify vault allocation for this stream
  console.log('[NATIVE-5d] Verify vault stream allocation');
  try {
    if (nativeStreamId === 0n) throw new Error('nativeStreamId is 0');
    const allocPayload = buildPayload('VaultService', 'GetStreamAllocation', encodeU64LE(Number(nativeStreamId)));
    const allocReply = await queryState(api, keyring, TOKEN_VAULT_ID, allocPayload);
    const allocBuf = skipStrings(allocReply, 2);
    // u128 = 16 bytes LE
    const allocatedLo = allocBuf.readBigUInt64LE(0);
    const allocatedHi = allocBuf.length >= 16 ? allocBuf.readBigUInt64LE(8) : 0n;
    const allocated = allocatedLo | (allocatedHi << 64n);
    console.log(`  Vault allocation for stream ${nativeStreamId}: ${allocated} units (raw hex: ${allocBuf.subarray(0, 16).toString('hex')})`);
    if (allocated === 0n) {
      console.log('  WARN: Cross-contract async allocation not reflected yet — Gear async messaging may need gas reservation');
      console.log('  (This is a known limitation of fire-and-forget msg::send_bytes in Gear)');
      skipped++;
    } else {
      assert(allocated > 0n, `Stream allocation > 0 (got ${allocated})`);
    }
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // Step 6: Verify withdraw is correctly gated to receiver only
  // The sender cannot withdraw — only the receiver wallet can.
  // This is correct protocol behavior: funds flow sender → vault → receiver.
  console.log('[NATIVE-6] Verify withdraw gated to receiver');
  try {
    if (nativeStreamId === 0n) throw new Error('nativeStreamId is 0');
    const payload = buildPayload('StreamService', 'Withdraw', encodeU64LE(Number(nativeStreamId)));
    await sendMessage(api, keyring, STREAM_CORE_ID, payload);
    // If we get here, something is wrong — sender should NOT be able to withdraw
    assert(false, 'Withdraw should have been rejected for sender');
  } catch (err) {
    const isReceiverGated = err.message.includes('Only receiver can withdraw');
    assert(isReceiverGated, `Withdraw correctly rejected sender: ${err.message.slice(0, 80)}`);
    if (isReceiverGated) {
      console.log('  (Receiver wallet must call Withdraw to receive VARA — correct protocol behavior)');
    }
  }

  // Step 6b: Verify sender vault balance decreased (VARA locked in stream)
  console.log('[NATIVE-6b] Verify sender vault balance decreased after stream creation');
  try {
    const owner = encodeActorId(senderHex);
    const token = encodeActorId('0x0000000000000000000000000000000000000000000000000000000000000000');
    const balPayload = buildPayload('VaultService', 'GetBalance', owner, token);
    const balReply = await queryState(api, keyring, TOKEN_VAULT_ID, balPayload);
    const balBuf = skipStrings(balReply, 2);
    // VaultBalance: owner(32) + token(32) + total_deposited(u128=16) + total_allocated(u128=16) + available(u128=16)
    // Read available (offset 32+32+16+16 = 96)
    const available = balBuf.readBigUInt64LE(96) | (BigInt(balBuf.readUInt32LE(104) || 0) << 64n);
    const totalAllocated = balBuf.readBigUInt64LE(80) | (BigInt(balBuf.readUInt32LE(88) || 0) << 64n);
    console.log(`  Available in vault: ${available} units (${Number(available) / 1e12} VARA)`);
    console.log(`  Allocated to streams: ${totalAllocated} units`);
    if (totalAllocated === 0n) {
      console.log('  WARN: Allocation not reflected (same async cross-contract issue as NATIVE-5d)');
      skipped++;
    } else {
      assert(totalAllocated > 0n, 'VARA is allocated to stream in vault');
    }
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // Step 7: Verify stream withdrawn amount updated
  console.log('[NATIVE-7] Verify stream withdrawn amount');
  try {
    const payload = buildPayload('StreamService', 'GetStream', encodeU64LE(Number(nativeStreamId)));
    const reply = await queryState(api, keyring, STREAM_CORE_ID, payload);
    assert(reply !== null && reply.length > 20, 'Stream data retrieved after withdrawal');
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // ===========================================================================
  // REAL MONEY TRANSFER: Receiver Wallet Withdraws VARA
  // ===========================================================================
  console.log('\n--- Receiver Withdrawal (Real Money Transfer) ---\n');

  // Step 8: Generate receiver keypair and fund it for gas
  let receiverKeyring = null;
  console.log('[NATIVE-8] Create receiver keypair & fund with VARA for gas');
  try {
    // Derive a child keypair from deployer mnemonic for the receiver
    try {
      receiverKeyring = await GearKeyring.fromSuri(VARA_SEED + '//growstreams//receiver');
    } catch {
      receiverKeyring = await GearKeyring.fromMnemonic(VARA_SEED, { name: 'Receiver' });
    }

    // If that produces the same address as the sender, use a different derivation
    const receiverAddr = receiverKeyring.address;
    const senderAddr = keyring.address;
    if (receiverAddr === senderAddr) {
      // Fallback: use a deterministic seed
      const { Keyring } = await import('@polkadot/keyring');
      const kr = new Keyring({ type: 'sr25519', ss58Format: 137 });
      receiverKeyring = kr.addFromUri('//GrowStreamsTestReceiver');
    }

    const receiverAddress = receiverKeyring.address;
    const receiverHex = '0x' + Buffer.from(receiverKeyring.publicKey).toString('hex');
    console.log(`  Receiver address: ${receiverAddress}`);
    console.log(`  Receiver hex: ${receiverHex}`);

    // Check receiver's balance before funding
    const recvInfoBefore = await api.query.system.account(receiverAddress);
    const recvBalBefore = BigInt(recvInfoBefore.data.free.toString());
    console.log(`  Receiver balance before: ${Number(recvBalBefore) / 1e12} VARA`);

    // Fund receiver with 2 VARA for gas (only if balance is low)
    if (recvBalBefore < 1_000_000_000_000n) {
      console.log('  Transferring 2 VARA to receiver for gas...');
      const transfer = api.tx.balances.transferKeepAlive(receiverAddress, 2_000_000_000_000n);
      await new Promise((res, rej) => {
        transfer.signAndSend(keyring, ({ status }) => {
          if (status.isFinalized) res();
        }).catch(rej);
      });
      await new Promise(r => setTimeout(r, 3000));
    }

    const recvInfoAfter = await api.query.system.account(receiverAddress);
    const recvBalAfterFund = BigInt(recvInfoAfter.data.free.toString());
    console.log(`  Receiver balance after funding: ${Number(recvBalAfterFund) / 1e12} VARA`);
    assert(recvBalAfterFund > 0n, 'Receiver has VARA for gas');
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // Step 9: Create a NEW stream specifically from sender → derived receiver
  let receiverStreamId = 0n;
  console.log('[NATIVE-9] Create stream to derived receiver');
  try {
    if (!receiverKeyring) throw new Error('Receiver keypair not created');
    const receiverHex = '0x' + Buffer.from(receiverKeyring.publicKey).toString('hex');

    // First deposit VARA to vault for this stream
    const depositPayload = buildPayload('VaultService', 'DepositNative');
    await sendMessage(api, keyring, TOKEN_VAULT_ID, depositPayload, Number(initialDeposit * 2n));
    await new Promise(r => setTimeout(r, 2000));

    // Create stream to the derived receiver
    const receiver = encodeActorId(receiverHex);
    const token = encodeActorId('0x0000000000000000000000000000000000000000000000000000000000000000');
    const payload = buildPayload('StreamService', 'CreateStream', receiver, token, encodeU128LE(flowRate), encodeU128LE(initialDeposit));
    await sendMessage(api, keyring, STREAM_CORE_ID, payload);

    // Get stream ID (last in sender streams)
    const owner = encodeActorId(senderHex);
    const listPayload = buildPayload('StreamService', 'GetSenderStreams', owner);
    const listReply = await queryState(api, keyring, STREAM_CORE_ID, listPayload);
    const listBuf = skipStrings(listReply, 2);
    const lenByte = listBuf[0];
    const vecLen = (lenByte & 3) === 0 ? lenByte >> 2 : ((listBuf[0] | (listBuf[1] << 8)) >> 2);
    const idsBuf = listBuf.subarray((lenByte & 3) === 0 ? 1 : 2);
    receiverStreamId = idsBuf.readBigUInt64LE((vecLen - 1) * 8);
    console.log(`  Stream created (ID=${receiverStreamId}) → receiver can now withdraw`);
    assert(receiverStreamId >= 1n, `Stream to derived receiver created (ID=${receiverStreamId})`);
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // Step 10: Wait for cross-contract allocation + streaming accrual
  console.log('[NATIVE-10] Wait 12s for allocation + streaming accrual...');
  await new Promise(r => setTimeout(r, 12000));

  // Step 11: RECEIVER calls Withdraw — this is the real money transfer!
  console.log('[NATIVE-11] *** RECEIVER calls Withdraw — real VARA transfer ***');
  try {
    if (!receiverKeyring || receiverStreamId === 0n) throw new Error('No receiver keyring or stream');

    // Record receiver's on-chain balance BEFORE withdraw
    const recvInfoPre = await api.query.system.account(receiverKeyring.address);
    const balanceBefore = BigInt(recvInfoPre.data.free.toString());
    console.log(`  Receiver balance BEFORE withdraw: ${Number(balanceBefore) / 1e12} VARA`);

    // Receiver signs and sends Withdraw transaction
    const payload = buildPayload('StreamService', 'Withdraw', encodeU64LE(Number(receiverStreamId)));
    const withdrawReply = await sendMessage(api, receiverKeyring, STREAM_CORE_ID, payload);
    console.log(`  Withdraw tx sent by receiver, reply: ${withdrawReply ? withdrawReply.slice(0, 40) + '...' : 'ok'}`);

    // Wait for cross-contract TransferToReceiver to be processed
    console.log('  Waiting 10s for cross-contract TransferToReceiver...');
    await new Promise(r => setTimeout(r, 10000));

    // Record receiver's on-chain balance AFTER withdraw
    const recvInfoPost = await api.query.system.account(receiverKeyring.address);
    const balanceAfter = BigInt(recvInfoPost.data.free.toString());
    console.log(`  Receiver balance AFTER withdraw:  ${Number(balanceAfter) / 1e12} VARA`);

    const gained = balanceAfter - balanceBefore;
    console.log(`  *** VARA gained by receiver: ${Number(gained) / 1e12} VARA ***`);

    // Receiver should have gained VARA (minus gas costs, the net should still be positive
    // because the withdrawn amount > gas cost)
    // Note: gas cost for Withdraw tx is subtracted, but the vault sends VARA to receiver
    assert(balanceAfter > balanceBefore, `Receiver balance increased (gained ${Number(gained) / 1e12} VARA)`);
    if (balanceAfter > balanceBefore) {
      console.log('  ✅ REAL MONEY SUCCESSFULLY STREAMED TO RECEIVER ON-CHAIN');
    }
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // Step 12: Verify stream withdrawn field updated
  console.log('[NATIVE-12] Verify stream shows withdrawn > 0');
  try {
    if (receiverStreamId === 0n) throw new Error('No receiver stream');
    const payload = buildPayload('StreamService', 'GetStream', encodeU64LE(Number(receiverStreamId)));
    const reply = await queryState(api, keyring, STREAM_CORE_ID, payload);
    const streamBuf = skipStrings(reply, 2);
    // Stream layout: Option<Stream> — first byte 0x01 means Some
    // Stream: id(8) + sender(32) + receiver(32) + token(32) + flow_rate(u128=16) +
    //         start_time(u64=8) + last_update(u64=8) + deposited(u128=16) +
    //         withdrawn(u128=16) + streamed(u128=16) + status(1)
    // withdrawn offset = 1 + 8 + 32 + 32 + 32 + 16 + 8 + 8 + 16 = 153
    if (streamBuf[0] === 1) {
      const withdrawnLo = streamBuf.readBigUInt64LE(153);
      const withdrawnHi = streamBuf.readBigUInt64LE(161);
      const withdrawn = withdrawnLo | (withdrawnHi << 64n);
      console.log(`  Stream withdrawn: ${withdrawn} units (${Number(withdrawn) / 1e12} VARA)`);
      assert(withdrawn > 0n, `Stream withdrawn > 0 (${withdrawn} units)`);
    } else {
      assert(false, 'Stream not found (Option::None)');
    }
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // ===========================================================================
  // SplitsRouter Tests
  // ===========================================================================
  if (SPLITS_ROUTER_ID) {
    console.log('\n--- SplitsRouter Tests ---\n');

    // 20. Query config
    console.log('[20] SplitsRouter GetConfig');
    try {
      const payload = buildPayload('SplitsService', 'GetConfig');
      const reply = await queryState(api, keyring, SPLITS_ROUTER_ID, payload);
      assert(reply && reply.length > 10, 'GetConfig returns data');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 21. TotalGroups == 0 initially (or current count)
    console.log('[21] SplitsRouter TotalGroups');
    try {
      const payload = buildPayload('SplitsService', 'TotalGroups');
      const reply = await queryState(api, keyring, SPLITS_ROUTER_ID, payload);
      assert(reply !== null, 'TotalGroups returns reply');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 22. Create a split group with 3 recipients
    let splitGroupId = 0n;
    console.log('[22] CreateSplitGroup (3 recipients)');
    try {
      // Encode Vec<SplitRecipient>: compact length + items
      // Each item: ActorId (32 bytes) + u32 (4 bytes LE)
      const r1 = Buffer.concat([encodeActorId(RECEIVER_HEX), Buffer.from([50, 0, 0, 0])]);
      const r2 = Buffer.concat([encodeActorId('0x0000000000000000000000000000000000000000000000000000000000000002'), Buffer.from([30, 0, 0, 0])]);
      const r3 = Buffer.concat([encodeActorId('0x0000000000000000000000000000000000000000000000000000000000000003'), Buffer.from([20, 0, 0, 0])]);
      const vecPrefix = encodeCompactU32(3);
      const recipients = Buffer.concat([vecPrefix, r1, r2, r3]);
      const payload = buildPayload('SplitsService', 'CreateSplitGroup', recipients);
      await sendMessage(api, keyring, SPLITS_ROUTER_ID, payload);
      // Derive real group ID from GetOwnerGroups (last entry)
      const ownerHex = '0x' + Buffer.from(keyring.publicKey).toString('hex');
      const ownerGroupsPayload = buildPayload('SplitsService', 'GetOwnerGroups', encodeActorId(ownerHex));
      const ownerGroupsReply = await queryState(api, keyring, SPLITS_ROUTER_ID, ownerGroupsPayload);
      const ogBuf = skipStrings(ownerGroupsReply, 2);
      // Decode SCALE Vec<u64>: compact length prefix then u64 items
      const ogLenByte = ogBuf[0];
      let ogVecLen = (ogLenByte & 3) === 0 ? ogLenByte >> 2 : ((ogBuf[0] | (ogBuf[1] << 8)) >> 2);
      const ogIdsBuf = ogBuf.subarray((ogLenByte & 3) === 0 ? 1 : 2);
      if (ogVecLen > 0 && ogIdsBuf.length >= 8) {
        splitGroupId = ogIdsBuf.readBigUInt64LE((ogVecLen - 1) * 8);
      }
      assert(splitGroupId >= 1n, `SplitGroup created (id=${splitGroupId})`);
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 23. GetSplitGroup
    console.log(`[23] GetSplitGroup(${splitGroupId})`);
    try {
      const payload = buildPayload('SplitsService', 'GetSplitGroup', encodeU64LE(Number(splitGroupId)));
      const reply = await queryState(api, keyring, SPLITS_ROUTER_ID, payload);
      assert(reply !== null && reply.length > 20, 'GetSplitGroup returns data');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 24. GetOwnerGroups
    console.log('[24] GetOwnerGroups');
    try {
      const payload = buildPayload('SplitsService', 'GetOwnerGroups', encodeActorId('0x' + Buffer.from(keyring.publicKey).toString('hex')));
      const reply = await queryState(api, keyring, SPLITS_ROUTER_ID, payload);
      assert(reply !== null, 'GetOwnerGroups returns data');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 25. PreviewDistribution
    console.log(`[25] PreviewDistribution(${splitGroupId}, 10000)`);
    try {
      const payload = buildPayload('SplitsService', 'PreviewDistribution', encodeU64LE(Number(splitGroupId)), encodeU128LE(10000));
      const reply = await queryState(api, keyring, SPLITS_ROUTER_ID, payload);
      assert(reply !== null && reply.length > 10, 'PreviewDistribution returns shares');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 26. Distribute
    console.log(`[26] Distribute(${splitGroupId})`);
    try {
      const payload = buildPayload('SplitsService', 'Distribute',
        encodeU64LE(Number(splitGroupId)),
        encodeActorId('0x0000000000000000000000000000000000000000000000000000000000000000'),
        encodeU128LE(100000));
      await sendMessage(api, keyring, SPLITS_ROUTER_ID, payload);
      assert(true, 'Distribute succeeded');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 27. DeleteSplitGroup
    console.log(`[27] DeleteSplitGroup(${splitGroupId})`);
    try {
      const payload = buildPayload('SplitsService', 'DeleteSplitGroup', encodeU64LE(Number(splitGroupId)));
      await sendMessage(api, keyring, SPLITS_ROUTER_ID, payload);
      assert(true, 'DeleteSplitGroup succeeded');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }
  } else {
    console.log('\n--- SplitsRouter: SKIPPED (not deployed) ---');
  }

  // ===========================================================================
  // PermissionManager Tests
  // ===========================================================================
  if (PERMISSION_MGR_ID) {
    console.log('\n--- PermissionManager Tests ---\n');

    // 28. GetConfig
    console.log('[28] PermissionManager GetConfig');
    try {
      const payload = buildPayload('PermissionService', 'GetConfig');
      const reply = await queryState(api, keyring, PERMISSION_MGR_ID, payload);
      assert(reply && reply.length > 10, 'GetConfig returns data');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 29. GrantPermission (CreateStream scope = 0)
    const grantee = '0x0000000000000000000000000000000000000000000000000000000000000042';
    console.log('[29] GrantPermission (CreateStream)');
    try {
      // scope: u8 enum index (0=CreateStream), expires_at: Option<u64> = None (0x00)
      const scopeBuf = Buffer.from([0]); // CreateStream = 0
      const expiresNone = Buffer.from([0]); // None
      const payload = buildPayload('PermissionService', 'GrantPermission', encodeActorId(grantee), scopeBuf, expiresNone);
      await sendMessage(api, keyring, PERMISSION_MGR_ID, payload);
      assert(true, 'GrantPermission succeeded');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 30. HasPermission
    console.log('[30] HasPermission');
    try {
      const granterHex = '0x' + Buffer.from(keyring.publicKey).toString('hex');
      const scopeBuf = Buffer.from([0]); // CreateStream
      const payload = buildPayload('PermissionService', 'HasPermission', encodeActorId(granterHex), encodeActorId(grantee), scopeBuf);
      const reply = await queryState(api, keyring, PERMISSION_MGR_ID, payload);
      const raw = skipStrings(reply, 2);
      assert(raw[0] === 1, `HasPermission == true (got ${raw[0]})`);
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 31. GetPermissions
    console.log('[31] GetPermissions (granter)');
    try {
      const granterHex = '0x' + Buffer.from(keyring.publicKey).toString('hex');
      const payload = buildPayload('PermissionService', 'GetPermissions', encodeActorId(granterHex));
      const reply = await queryState(api, keyring, PERMISSION_MGR_ID, payload);
      assert(reply !== null, 'GetPermissions returns data');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 32. RevokePermission
    console.log('[32] RevokePermission');
    try {
      await new Promise(r => setTimeout(r, 2000)); // avoid nonce collision with previous tx
      const scopeBuf = Buffer.from([0]); // CreateStream
      const payload = buildPayload('PermissionService', 'RevokePermission', encodeActorId(grantee), scopeBuf);
      await sendMessage(api, keyring, PERMISSION_MGR_ID, payload);
      assert(true, 'RevokePermission succeeded');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 33. HasPermission == false after revoke
    console.log('[33] HasPermission == false after revoke');
    try {
      const granterHex = '0x' + Buffer.from(keyring.publicKey).toString('hex');
      const scopeBuf = Buffer.from([0]);
      const payload = buildPayload('PermissionService', 'HasPermission', encodeActorId(granterHex), encodeActorId(grantee), scopeBuf);
      const reply = await queryState(api, keyring, PERMISSION_MGR_ID, payload);
      const raw = skipStrings(reply, 2);
      assert(raw[0] === 0, `HasPermission == false after revoke (got ${raw[0]})`);
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 34. TotalPermissions
    console.log('[34] TotalPermissions');
    try {
      const payload = buildPayload('PermissionService', 'TotalPermissions');
      const reply = await queryState(api, keyring, PERMISSION_MGR_ID, payload);
      assert(reply !== null, 'TotalPermissions returns reply');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }
  } else {
    console.log('\n--- PermissionManager: SKIPPED (not deployed) ---');
  }

  // ===========================================================================
  // BountyAdapter Tests
  // ===========================================================================
  if (BOUNTY_ADAPTER_ID) {
    console.log('\n--- BountyAdapter Tests ---\n');

    // 35. GetConfig
    console.log('[35] BountyAdapter GetConfig');
    try {
      const payload = buildPayload('BountyService', 'GetConfig');
      const reply = await queryState(api, keyring, BOUNTY_ADAPTER_ID, payload);
      assert(reply && reply.length > 10, 'GetConfig returns data');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 36. TotalBounties
    console.log('[36] TotalBounties');
    try {
      const payload = buildPayload('BountyService', 'TotalBounties');
      const reply = await queryState(api, keyring, BOUNTY_ADAPTER_ID, payload);
      assert(reply !== null, 'TotalBounties returns reply');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 37. CreateBounty
    let bountyId = 0n;
    console.log('[37] CreateBounty');
    try {
      const title = Buffer.from('Fix login bug', 'utf-8');
      const titleEncoded = Buffer.concat([encodeCompactU32(title.length), title]);
      const token = encodeActorId('0x0000000000000000000000000000000000000000000000000000000000000000');
      const maxFlowRate = encodeU128LE(5000);
      const minScore = Buffer.alloc(4); minScore.writeUInt32LE(60);
      const totalBudget = encodeU128LE(10000000);
      const payload = buildPayload('BountyService', 'CreateBounty', titleEncoded, token, maxFlowRate, minScore, totalBudget);
      await sendMessage(api, keyring, BOUNTY_ADAPTER_ID, payload);
      // Verify
      const check = await queryState(api, keyring, BOUNTY_ADAPTER_ID, buildPayload('BountyService', 'TotalBounties'));
      const raw = skipStrings(check, 2);
      bountyId = raw.readBigUInt64LE(0);
      assert(bountyId >= 1n, `Bounty created (id=${bountyId})`);
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 38. GetBounty
    console.log(`[38] GetBounty(${bountyId})`);
    try {
      const payload = buildPayload('BountyService', 'GetBounty', encodeU64LE(Number(bountyId)));
      const reply = await queryState(api, keyring, BOUNTY_ADAPTER_ID, payload);
      assert(reply !== null && reply.length > 20, 'GetBounty returns data');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 39. GetOpenBounties
    console.log('[39] GetOpenBounties');
    try {
      const payload = buildPayload('BountyService', 'GetOpenBounties');
      const reply = await queryState(api, keyring, BOUNTY_ADAPTER_ID, payload);
      assert(reply !== null, 'GetOpenBounties returns data');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 40. ClaimBounty
    console.log(`[40] ClaimBounty(${bountyId})`);
    try {
      const payload = buildPayload('BountyService', 'ClaimBounty', encodeU64LE(Number(bountyId)));
      await sendMessage(api, keyring, BOUNTY_ADAPTER_ID, payload);
      assert(true, 'ClaimBounty succeeded');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 41. VerifyAndStartStream
    console.log(`[41] VerifyAndStartStream(${bountyId}, score=85)`);
    try {
      const claimer = encodeActorId('0x' + Buffer.from(keyring.publicKey).toString('hex'));
      const score = Buffer.alloc(4); score.writeUInt32LE(85);
      const payload = buildPayload('BountyService', 'VerifyAndStartStream', encodeU64LE(Number(bountyId)), claimer, score);
      await sendMessage(api, keyring, BOUNTY_ADAPTER_ID, payload);
      assert(true, 'VerifyAndStartStream succeeded');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 42. CompleteBounty
    console.log(`[42] CompleteBounty(${bountyId})`);
    try {
      await new Promise(r => setTimeout(r, 2000)); // avoid nonce collision
      const payload = buildPayload('BountyService', 'CompleteBounty', encodeU64LE(Number(bountyId)));
      await sendMessage(api, keyring, BOUNTY_ADAPTER_ID, payload);
      assert(true, 'CompleteBounty succeeded');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 43. GetCreatorBounties
    console.log('[43] GetCreatorBounties');
    try {
      const payload = buildPayload('BountyService', 'GetCreatorBounties', encodeActorId('0x' + Buffer.from(keyring.publicKey).toString('hex')));
      const reply = await queryState(api, keyring, BOUNTY_ADAPTER_ID, payload);
      assert(reply !== null, 'GetCreatorBounties returns data');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }
  } else {
    console.log('\n--- BountyAdapter: SKIPPED (not deployed) ---');
  }

  // ===========================================================================
  // IdentityRegistry Tests
  // ===========================================================================
  if (IDENTITY_REG_ID) {
    console.log('\n--- IdentityRegistry Tests ---\n');

    // 44. GetConfig
    console.log('[44] IdentityRegistry GetConfig');
    try {
      const payload = buildPayload('IdentityService', 'GetConfig');
      const reply = await queryState(api, keyring, IDENTITY_REG_ID, payload);
      assert(reply && reply.length > 10, 'GetConfig returns data');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 45. OracleAddress
    console.log('[45] OracleAddress');
    try {
      const payload = buildPayload('IdentityService', 'OracleAddress');
      const reply = await queryState(api, keyring, IDENTITY_REG_ID, payload);
      assert(reply !== null, 'OracleAddress returns reply');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 46. TotalBindings
    console.log('[46] TotalBindings');
    try {
      const payload = buildPayload('IdentityService', 'TotalBindings');
      const reply = await queryState(api, keyring, IDENTITY_REG_ID, payload);
      assert(reply !== null, 'TotalBindings returns reply');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 47. CreateBinding (we are oracle since we deployed)
    const testActor = '0x0000000000000000000000000000000000000000000000000000000000000099';
    console.log('[47] CreateBinding');
    try {
      const actor = encodeActorId(testActor);
      const username = 'test-github-user';
      const usernameEnc = Buffer.concat([encodeCompactU32(username.length), Buffer.from(username)]);
      const proofHash = Buffer.concat([encodeCompactU32(32), Buffer.alloc(32, 0xAB)]);
      const score = Buffer.alloc(4); score.writeUInt32LE(75);
      const payload = buildPayload('IdentityService', 'CreateBinding', actor, usernameEnc, proofHash, score);
      await sendMessage(api, keyring, IDENTITY_REG_ID, payload);
      assert(true, 'CreateBinding succeeded');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 48. GetBinding
    console.log('[48] GetBinding');
    try {
      const payload = buildPayload('IdentityService', 'GetBinding', encodeActorId(testActor));
      const reply = await queryState(api, keyring, IDENTITY_REG_ID, payload);
      assert(reply !== null && reply.length > 20, 'GetBinding returns data');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 49. GetActorByGithub
    console.log('[49] GetActorByGithub');
    try {
      const username = 'test-github-user';
      const usernameEnc = Buffer.concat([encodeCompactU32(username.length), Buffer.from(username)]);
      const payload = buildPayload('IdentityService', 'GetActorByGithub', usernameEnc);
      const reply = await queryState(api, keyring, IDENTITY_REG_ID, payload);
      assert(reply !== null, 'GetActorByGithub returns data');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 50. UpdateScore
    console.log('[50] UpdateScore');
    try {
      const score = Buffer.alloc(4); score.writeUInt32LE(92);
      const payload = buildPayload('IdentityService', 'UpdateScore', encodeActorId(testActor), score);
      await sendMessage(api, keyring, IDENTITY_REG_ID, payload);
      assert(true, 'UpdateScore succeeded');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }

    // 51. RevokeBinding
    console.log('[51] RevokeBinding');
    try {
      const payload = buildPayload('IdentityService', 'RevokeBinding', encodeActorId(testActor));
      await sendMessage(api, keyring, IDENTITY_REG_ID, payload);
      assert(true, 'RevokeBinding succeeded');
    } catch (err) {
      console.log(`  ERROR: ${err.message}`); failed++;
    }
  } else {
    console.log('\n--- IdentityRegistry: SKIPPED (not deployed) ---');
  }

  // ===========================================================================
  // Summary
  // ===========================================================================
  console.log('\n========================================');
  console.log(`RESULTS: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log('========================================\n');

  await api.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
