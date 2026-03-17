import { GearApi, GearKeyring } from '@gear-js/api';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { config as loadEnv } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../..');

loadEnv({ path: resolve(PROJECT_ROOT, '.env') });

const VARA_SEED = process.env.VARA_SEED;
const VARA_NODE = process.env.VARA_NODE || 'wss://testnet.vara.network';

if (!VARA_SEED || VARA_SEED.includes('word1 word2')) {
  console.error('Error: VARA_SEED not set in .env');
  process.exit(1);
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

function buildPayload(serviceName, methodName, ...argBuffers) {
  const parts = [encodeString(serviceName), encodeString(methodName), ...argBuffers];
  return '0x' + Buffer.concat(parts).toString('hex');
}

async function main() {
  const deployState = JSON.parse(readFileSync(resolve(PROJECT_ROOT, 'deploy-state.json'), 'utf-8'));
  const STREAM_CORE_ID = deployState['stream-core']?.programId;
  const TOKEN_VAULT_ID = deployState['token-vault']?.programId;

  if (!STREAM_CORE_ID || !TOKEN_VAULT_ID) {
    console.error('Missing stream-core or token-vault in deploy-state.json');
    process.exit(1);
  }

  console.log('=== Set StreamCore.token_vault ===');
  console.log(`Node: ${VARA_NODE}`);
  console.log(`StreamCore:  ${STREAM_CORE_ID}`);
  console.log(`TokenVault:  ${TOKEN_VAULT_ID}`);

  const api = await GearApi.create({ providerAddress: VARA_NODE });
  let keyring;
  try { keyring = await GearKeyring.fromMnemonic(VARA_SEED); }
  catch { keyring = await GearKeyring.fromSuri(VARA_SEED); }

  console.log(`Admin account: ${keyring.address}`);

  const payload = buildPayload(
    'StreamService',
    'SetTokenVault',
    encodeActorId(TOKEN_VAULT_ID),
  );

  const gasInfo = await api.program.calculateGas.handle(
    keyring.addressRaw,
    STREAM_CORE_ID,
    payload,
    0,
    true,
  );

  const tx = api.message.send({
    destination: STREAM_CORE_ID,
    payload,
    gasLimit: gasInfo.min_limit,
    value: 0,
  });

  await new Promise((resolve, reject) => {
    let done = false;
    const timeout = setTimeout(() => {
      if (!done) { done = true; reject(new Error('Tx timeout 90s')); }
    }, 90_000);

    tx.signAndSend(keyring, ({ status, events = [] }) => {
      if (status.isFinalized) {
        clearTimeout(timeout);
        if (done) return;
        done = true;

        for (const { event } of events) {
          if (api.events.system.ExtrinsicFailed.is(event)) {
            const [err] = event.data;
            const info = err.isModule
              ? api.registry.findMetaError(err.asModule).name
              : err.toString();
            return reject(new Error('ExtrinsicFailed: ' + info));
          }
        }

        console.log('SetTokenVault finalized');
        resolve();
      }
    }).catch(err => {
      clearTimeout(timeout);
      if (!done) { done = true; reject(err); }
    });
  });

  await api.disconnect();
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
