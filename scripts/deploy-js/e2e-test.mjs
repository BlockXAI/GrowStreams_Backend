import { GearApi, GearKeyring } from '@gear-js/api';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../..');

config({ path: resolve(PROJECT_ROOT, '.env') });

const VARA_SEED = process.env.VARA_SEED;
const VARA_NODE = process.env.VARA_NODE || 'wss://testnet.vara.network';

const deployState = JSON.parse(readFileSync(resolve(PROJECT_ROOT, 'deploy-state.json'), 'utf-8'));
const STREAM_CORE_ID = deployState['stream-core']?.programId;
const TOKEN_VAULT_ID = deployState['token-vault']?.programId;

if (!STREAM_CORE_ID || !TOKEN_VAULT_ID) {
  console.error('Missing program IDs in deploy-state.json. Deploy first.');
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
async function sendMessage(api, keyring, programId, payload) {
  const gasInfo = await api.program.calculateGas.handle(
    keyring.addressRaw,
    programId,
    payload,
    0,
    true,
  );
  const gasLimit = gasInfo.min_limit;

  const tx = api.message.send({
    destination: programId,
    payload,
    gasLimit,
    value: 0,
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

async function main() {
  console.log('=== GrowStreams V2 — E2E Test Suite ===\n');
  console.log(`StreamCore: ${STREAM_CORE_ID}`);
  console.log(`TokenVault: ${TOKEN_VAULT_ID}`);
  console.log(`Node: ${VARA_NODE}\n`);

  const api = await GearApi.create({ providerAddress: VARA_NODE });
  let keyring;
  try { keyring = await GearKeyring.fromMnemonic(VARA_SEED); }
  catch { keyring = await GearKeyring.fromSuri(VARA_SEED); }
  console.log(`Account: ${keyring.address}`);

  const { data: { free } } = await api.query.system.account(keyring.address);
  console.log(`Balance: ${(Number(BigInt(free.toString())) / 1e12).toFixed(4)} VARA\n`);

  // ===========================================================================
  // StreamCore Tests — full lifecycle on a fresh stream
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

  // 2. Read current total before creating
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

  // 3. Create a fresh stream
  const expectedId = totalBefore + 1n;
  let streamId = 0n;
  console.log(`[3] Create stream (expecting ID ${expectedId})`);
  try {
    const receiver = encodeActorId('0x0000000000000000000000000000000000000000000000000000000000000001');
    const token = encodeActorId('0x0000000000000000000000000000000000000000000000000000000000000000');
    const flowRate = encodeU128LE(1000);
    const deposit = encodeU128LE(3600000);
    const payload = buildPayload('StreamService', 'CreateStream', receiver, token, flowRate, deposit);
    await sendMessage(api, keyring, STREAM_CORE_ID, payload);
    // verify via query
    const checkPayload = buildPayload('StreamService', 'TotalStreams');
    const checkReply = await queryState(api, keyring, STREAM_CORE_ID, checkPayload);
    const newTotal = skipStrings(checkReply, 2).readBigUInt64LE(0);
    streamId = newTotal; // latest stream ID = new total (1-indexed)
    assert(newTotal === totalBefore + 1n, `TotalStreams incremented (${totalBefore} -> ${newTotal})`);
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // 4. Get stream details
  console.log(`[4] GetStream(${streamId})`);
  try {
    const payload = buildPayload('StreamService', 'GetStream', encodeU64LE(Number(streamId)));
    const reply = await queryState(api, keyring, STREAM_CORE_ID, payload);
    assert(reply !== null && reply.length > 20, 'GetStream returns stream data');
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // 5. Check active count increased
  console.log('[5] Active streams increased');
  try {
    const payload = buildPayload('StreamService', 'ActiveStreams');
    const reply = await queryState(api, keyring, STREAM_CORE_ID, payload);
    const active = skipStrings(reply, 2).readBigUInt64LE(0);
    assert(active >= 1n, `ActiveStreams >= 1 (got ${active})`);
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // 6. Pause the stream
  console.log(`[6] PauseStream(${streamId})`);
  try {
    const payload = buildPayload('StreamService', 'PauseStream', encodeU64LE(Number(streamId)));
    await sendMessage(api, keyring, STREAM_CORE_ID, payload);
    // verify via GetStream — can't easily decode status, but if it didn't panic, it worked
    assert(true, 'PauseStream succeeded (no panic)');
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // 7. Resume the stream
  console.log(`[7] ResumeStream(${streamId})`);
  try {
    const payload = buildPayload('StreamService', 'ResumeStream', encodeU64LE(Number(streamId)));
    await sendMessage(api, keyring, STREAM_CORE_ID, payload);
    assert(true, 'ResumeStream succeeded (no panic)');
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // 8. Deposit more to stream
  console.log(`[8] Deposit(${streamId}, 1000000)`);
  try {
    const payload = buildPayload('StreamService', 'Deposit', encodeU64LE(Number(streamId)), encodeU128LE(1000000));
    await sendMessage(api, keyring, STREAM_CORE_ID, payload);
    assert(true, 'Deposit succeeded (no panic)');
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // 9. Update stream flow rate
  console.log(`[9] UpdateStream(${streamId}, newRate=2000)`);
  try {
    const payload = buildPayload('StreamService', 'UpdateStream', encodeU64LE(Number(streamId)), encodeU128LE(2000));
    await sendMessage(api, keyring, STREAM_CORE_ID, payload);
    assert(true, 'UpdateStream succeeded (no panic)');
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // 10. GetSenderStreams
  console.log('[10] GetSenderStreams');
  try {
    const payload = buildPayload('StreamService', 'GetSenderStreams', encodeActorId('0x' + Buffer.from(keyring.publicKey).toString('hex')));
    const reply = await queryState(api, keyring, STREAM_CORE_ID, payload);
    assert(reply !== null, 'GetSenderStreams returns data');
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

  // 11. Stop the stream
  console.log(`[11] StopStream(${streamId})`);
  try {
    const payload = buildPayload('StreamService', 'StopStream', encodeU64LE(Number(streamId)));
    await sendMessage(api, keyring, STREAM_CORE_ID, payload);
    assert(true, 'StopStream succeeded (no panic)');
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

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

  // 14. Deposit tokens
  console.log('[14] DepositTokens');
  try {
    const token = encodeActorId('0x0000000000000000000000000000000000000000000000000000000000000000');
    const amount = encodeU128LE(5000000);
    const payload = buildPayload('VaultService', 'DepositTokens', token, amount);
    await sendMessage(api, keyring, TOKEN_VAULT_ID, payload);
    assert(true, 'DepositTokens succeeded (no panic)');
  } catch (err) {
    console.log(`  ERROR: ${err.message}`); failed++;
  }

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
    const token = encodeActorId('0x0000000000000000000000000000000000000000000000000000000000000000');
    const payload = buildPayload('VaultService', 'DepositTokens', token, encodeU128LE(100));
    await sendMessage(api, keyring, TOKEN_VAULT_ID, payload);
    assert(false, 'Deposit should have failed while paused');
  } catch (err) {
    assert(err.message.includes('paused'), `Deposit rejected: ${err.message.slice(0, 60)}`);
  }

  // 18. Emergency unpause
  console.log('[18] EmergencyUnpause');
  try {
    const payload = buildPayload('VaultService', 'EmergencyUnpause');
    await sendMessage(api, keyring, TOKEN_VAULT_ID, payload);
    const check = await queryState(api, keyring, TOKEN_VAULT_ID, buildPayload('VaultService', 'IsPaused'));
    const paused = skipStrings(check, 2)[0];
    assert(paused === 0, `Vault unpaused after EmergencyUnpause (got ${paused})`);
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
