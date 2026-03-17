import { GearApi, GearKeyring } from '@gear-js/api';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../..');

config({ path: resolve(PROJECT_ROOT, '.env') });

const VARA_SEED = process.env.VARA_SEED;
const VARA_NODE = process.env.VARA_NODE || 'wss://testnet.vara.network';

if (!VARA_SEED || VARA_SEED.includes('your_seed_phrase_here')) {
  console.error('Error: VARA_SEED not set in .env');
  process.exit(1);
}

const DEPLOY_STATE_PATH = resolve(PROJECT_ROOT, 'deploy-state.json');

function loadDeployState() {
  if (existsSync(DEPLOY_STATE_PATH)) {
    return JSON.parse(readFileSync(DEPLOY_STATE_PATH, 'utf-8'));
  }
  return {};
}

function saveDeployState(state) {
  writeFileSync(DEPLOY_STATE_PATH, JSON.stringify(state, null, 2));
}

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

function encodeActorId(hex) {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  return Buffer.from(clean.padStart(64, '0'), 'hex');
}

function encodeU128LE(value) {
  const buf = Buffer.alloc(16);
  const big = BigInt(value);
  buf.writeBigUInt64LE(big & 0xFFFFFFFFFFFFFFFFn, 0);
  buf.writeBigUInt64LE(big >> 64n, 8);
  return buf;
}

function encodeSailsInitPayload(constructorName, argsHex) {
  const nameBytes = Buffer.from(constructorName, 'utf-8');
  const lenPrefix = encodeCompactU32(nameBytes.length);
  const payload = Buffer.concat([lenPrefix, nameBytes, Buffer.from(argsHex, 'hex')]);
  return '0x' + payload.toString('hex');
}

function buildPayload(serviceName, methodName, ...argBuffers) {
  const parts = [encodeString(serviceName), encodeString(methodName)];
  for (const buf of argBuffers) parts.push(buf);
  return '0x' + Buffer.concat(parts).toString('hex');
}

async function deployContract(api, account, name, wasmPath, initPayload) {
  console.log(`\nDeploying ${name}...`);
  console.log(`  WASM: ${wasmPath}`);

  if (!existsSync(wasmPath)) {
    console.error(`  Error: ${wasmPath} not found.`);
    return null;
  }

  const code = readFileSync(wasmPath);
  console.log(`  Code size: ${(code.length / 1024).toFixed(1)} KB`);

  let gasLimit;
  try {
    const gasInfo = await api.program.calculateGas.initUpload(
      account.addressRaw, code, initPayload, 0, true,
    );
    gasLimit = gasInfo.min_limit;
    console.log(`  Gas limit: ${gasLimit.toString()}`);
  } catch (gasErr) {
    console.log(`  Gas calc failed: ${gasErr.message}`);
    gasLimit = 500_000_000_000n;
  }

  const { programId, codeId, extrinsic } = api.program.upload({
    code, gasLimit, value: 0, initPayload,
  });

  console.log(`  Program ID: ${programId}`);

  return new Promise((res, rej) => {
    let done = false;
    const timeout = setTimeout(() => { if (!done) { done = true; rej(new Error('Deploy timeout 120s')); } }, 120_000);

    extrinsic.signAndSend(account, ({ events = [], status }) => {
      if (status.isInBlock) console.log(`  In block: ${status.asInBlock.toHex()}`);
      if (status.isFinalized) {
        clearTimeout(timeout);
        let failed = false;
        events.forEach(({ event }) => {
          if (api.events.system.ExtrinsicFailed.is(event)) {
            const [err] = event.data;
            const info = err.isModule ? api.registry.findMetaError(err.asModule).name : err.toString();
            failed = true;
            if (!done) { done = true; rej(new Error(info)); }
          }
        });
        if (!failed && !done) { done = true; res({ programId, codeId }); }
      }
    }).catch(err => { clearTimeout(timeout); if (!done) { done = true; rej(err); } });
  });
}

async function sendMessage(api, keyring, programId, payload, value = 0) {
  const gasInfo = await api.program.calculateGas.handle(
    keyring.addressRaw, programId, payload, value, true,
  );
  const tx = api.message.send({ destination: programId, payload, gasLimit: gasInfo.min_limit, value });

  return new Promise((res, rej) => {
    let done = false;
    const timeout = setTimeout(() => { if (!done) { done = true; rej(new Error('Tx timeout 90s')); } }, 90_000);
    tx.signAndSend(keyring, ({ events = [], status }) => {
      if (status.isFinalized) {
        clearTimeout(timeout);
        if (done) return;
        done = true;
        for (const { event } of events) {
          if (api.events.system.ExtrinsicFailed.is(event)) {
            const [err] = event.data;
            const info = err.isModule ? api.registry.findMetaError(err.asModule).name : err.toString();
            return rej(new Error('ExtrinsicFailed: ' + info));
          }
        }
        res(status.asFinalized.toHex());
      }
    }).catch(err => { clearTimeout(timeout); if (!done) { done = true; rej(err); } });
  });
}

async function main() {
  const mode = process.argv[2] || 'all'; // 'grow-token', 'token-vault', 'wire', 'mint', 'all'

  console.log('=== GrowStreams — Deploy GROW Token + Updated TokenVault ===');
  console.log(`Node: ${VARA_NODE}`);
  console.log(`Mode: ${mode}\n`);

  const api = await GearApi.create({ providerAddress: VARA_NODE });
  const chain = await api.chain();
  console.log(`Connected: ${chain}`);

  let keyring;
  try { keyring = await GearKeyring.fromMnemonic(VARA_SEED); }
  catch { keyring = await GearKeyring.fromSuri(VARA_SEED); }
  console.log(`Account: ${keyring.address}`);

  const accountInfo = await api.query.system.account(keyring.address);
  const free = accountInfo.data.free;
  console.log(`Balance: ${(Number(BigInt(free.toString())) / 1e12).toFixed(4)} VARA`);

  const state = loadDeployState();
  const initPayload = encodeSailsInitPayload('New', '');

  // Step 1: Deploy GROW token
  if (mode === 'all' || mode === 'grow-token') {
    console.log('\n--- Step 1: Deploy GROW Token ---');
    try {
      const result = await deployContract(
        api, keyring, 'grow-token',
        resolve(PROJECT_ROOT, 'artifacts/grow_token.opt.wasm'),
        initPayload,
      );
      if (result) {
        state['grow-token'] = {
          programId: result.programId,
          codeId: result.codeId,
          deployedAt: new Date().toISOString(),
          network: 'vara-testnet',
          node: VARA_NODE,
        };
        saveDeployState(state);
        console.log(`  Saved grow-token to deploy-state.json`);
      }
    } catch (err) {
      console.error(`  Failed: ${err.message}`);
    }
  }

  // Step 2: Deploy updated TokenVault
  if (mode === 'all' || mode === 'token-vault') {
    console.log('\n--- Step 2: Deploy Updated TokenVault ---');
    try {
      const result = await deployContract(
        api, keyring, 'token-vault',
        resolve(PROJECT_ROOT, 'artifacts/token_vault.opt.wasm'),
        initPayload,
      );
      if (result) {
        state['token-vault'] = {
          programId: result.programId,
          codeId: result.codeId,
          deployedAt: new Date().toISOString(),
          network: 'vara-testnet',
          node: VARA_NODE,
        };
        saveDeployState(state);
        console.log(`  Saved token-vault to deploy-state.json`);
      }
    } catch (err) {
      console.error(`  Failed: ${err.message}`);
    }
  }

  const streamCoreId = state['stream-core']?.programId;
  const tokenVaultId = state['token-vault']?.programId;
  const growTokenId = state['grow-token']?.programId;

  // Step 3: Wire contracts (TokenVault <-> StreamCore)
  if (mode === 'all' || mode === 'wire') {
    console.log('\n--- Step 3: Wire Contracts ---');
    if (!streamCoreId || !tokenVaultId) {
      console.error('Missing StreamCore or TokenVault in deploy-state.json');
    } else {
      // TokenVault.set_stream_core(streamCoreId)
      console.log('  Setting StreamCore in TokenVault...');
      try {
        const payload = buildPayload('VaultService', 'SetStreamCore', encodeActorId(streamCoreId));
        await sendMessage(api, keyring, tokenVaultId, payload);
        console.log('  Done');
      } catch (err) { console.error(`  Failed: ${err.message}`); }

      await new Promise(r => setTimeout(r, 2000));

      // StreamCore.set_token_vault(tokenVaultId)
      console.log('  Setting TokenVault in StreamCore...');
      try {
        const payload = buildPayload('StreamService', 'SetTokenVault', encodeActorId(tokenVaultId));
        await sendMessage(api, keyring, streamCoreId, payload);
        console.log('  Done');
      } catch (err) { console.error(`  Failed: ${err.message}`); }
    }
  }

  // Step 4: Mint GROW tokens to deployer
  if (mode === 'all' || mode === 'mint') {
    console.log('\n--- Step 4: Mint GROW tokens to deployer ---');
    if (!growTokenId) {
      console.error('Missing grow-token in deploy-state.json');
    } else {
      // Mint 10,000 GROW (12 decimals = 10_000 * 1e12)
      const mintAmount = 10_000n * 1_000_000_000_000n;
      const deployerHex = '0x' + Buffer.from(keyring.publicKey).toString('hex');
      console.log(`  Minting ${mintAmount} units to ${deployerHex.slice(0, 16)}...`);

      const payload = buildPayload(
        'VftService', 'Mint',
        encodeActorId(deployerHex),
        encodeU128LE(mintAmount),
      );

      try {
        await sendMessage(api, keyring, growTokenId, payload);
        console.log('  Mint successful');
      } catch (err) { console.error(`  Mint failed: ${err.message}`); }
    }
  }

  console.log('\n=== Deploy Complete ===');
  console.log('Contract addresses:');
  if (state['grow-token']) console.log(`  GROW Token:  ${state['grow-token'].programId}`);
  if (state['token-vault']) console.log(`  TokenVault:  ${state['token-vault'].programId}`);
  if (state['stream-core']) console.log(`  StreamCore:  ${state['stream-core'].programId}`);

  await api.disconnect();
  process.exit(0);
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
