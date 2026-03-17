import { GearApi, GearKeyring } from '@gear-js/api';
import { readFileSync, existsSync } from 'fs';
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

// Encode a Sails service call
function encodeSailsCall(serviceName, methodName, argsHex) {
  const serviceBytes = Buffer.from(serviceName, 'utf-8');
  const methodBytes = Buffer.from(methodName, 'utf-8');
  
  const serviceLenPrefix = encodeCompactU32(serviceBytes.length);
  const methodLenPrefix = encodeCompactU32(methodBytes.length);
  
  const payload = Buffer.concat([
    serviceLenPrefix,
    serviceBytes,
    methodLenPrefix,
    methodBytes,
    Buffer.from(argsHex, 'hex')
  ]);
  
  return '0x' + payload.toString('hex');
}

function encodeCompactU32(value) {
  if (value < 64) {
    return Buffer.from([value << 2]);
  } else if (value < 16384) {
    const v = (value << 2) | 1;
    return Buffer.from([v & 0xff, (v >> 8) & 0xff]);
  } else if (value < 1073741824) {
    const v = (value << 2) | 2;
    return Buffer.from([v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >> 24) & 0xff]);
  }
  throw new Error('Value too large for compact encoding');
}

// Encode ActorId (32 bytes hex)
function encodeActorId(actorId) {
  // Remove 0x prefix if present
  const hex = actorId.startsWith('0x') ? actorId.slice(2) : actorId;
  return hex;
}

async function sendMessage(api, account, programId, payload, gasLimit) {
  console.log(`  Sending message to ${programId}...`);
  console.log(`  Payload: ${payload.slice(0, 60)}...`);
  
  try {
    const gas = gasLimit || 50_000_000_000n;
    
    const message = {
      destination: programId,
      payload,
      gasLimit: gas,
      value: 0,
    };
    
    const extrinsic = api.message.send(message);
    
    return new Promise((resolvePromise, rejectPromise) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          rejectPromise(new Error('Transaction timed out after 60 seconds'));
        }
      }, 60_000);
      
      extrinsic.signAndSend(account, ({ events = [], status }) => {
        if (status.isInBlock) {
          console.log(`  In block: ${status.asInBlock.toHex()}`);
        }
        
        if (status.isFinalized) {
          console.log(`  Finalized: ${status.asFinalized.toHex()}`);
          clearTimeout(timeout);
          
          let failed = false;
          events.forEach(({ event }) => {
            if (api.events.system.ExtrinsicFailed.is(event)) {
              const [dispatchError] = event.data;
              let errorInfo;
              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                errorInfo = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
              } else {
                errorInfo = dispatchError.toString();
              }
              console.error(`  Extrinsic failed: ${errorInfo}`);
              failed = true;
              if (!resolved) {
                resolved = true;
                rejectPromise(new Error(errorInfo));
              }
            }
          });
          
          if (!failed && !resolved) {
            resolved = true;
            resolvePromise({ blockHash: status.asFinalized.toHex() });
          }
        }
      }).catch((err) => {
        clearTimeout(timeout);
        if (!resolved) {
          resolved = true;
          rejectPromise(err);
        }
      });
    });
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    throw error;
  }
}

async function main() {
  console.log('=== GrowStreams V2 — Wire Contracts ===');
  console.log(`Node: ${VARA_NODE}\n`);
  
  const state = loadDeployState();
  
  const streamCoreId = state['stream-core']?.programId;
  const tokenVaultId = state['token-vault']?.programId;
  
  if (!streamCoreId || !tokenVaultId) {
    console.error('Error: Missing program IDs in deploy-state.json');
    console.error(`  StreamCore: ${streamCoreId || 'NOT FOUND'}`);
    console.error(`  TokenVault: ${tokenVaultId || 'NOT FOUND'}`);
    console.error('\nRun deployment script first: node scripts/deploy-js/deploy.mjs');
    process.exit(1);
  }
  
  console.log(`StreamCore: ${streamCoreId}`);
  console.log(`TokenVault: ${tokenVaultId}\n`);
  
  console.log('Connecting to Vara...');
  const api = await GearApi.create({ providerAddress: VARA_NODE });
  
  let keyring;
  try {
    keyring = await GearKeyring.fromMnemonic(VARA_SEED);
  } catch {
    keyring = await GearKeyring.fromSuri(VARA_SEED);
  }
  
  console.log(`Account: ${keyring.address}\n`);
  
  // Step 1: TokenVault.set_stream_core(streamCoreId)
  console.log('1. Setting StreamCore address in TokenVault...');
  const vaultPayload = encodeSailsCall(
    'VaultService',
    'SetStreamCore',
    encodeActorId(streamCoreId)
  );
  
  try {
    const result1 = await sendMessage(api, keyring, tokenVaultId, vaultPayload);
    console.log(`  ✅ Success! Block: ${result1.blockHash}\n`);
  } catch (err) {
    console.error(`  ❌ Failed: ${err.message}\n`);
  }
  
  // Step 2: StreamCore.set_token_vault(tokenVaultId)
  console.log('2. Setting TokenVault address in StreamCore...');
  const corePayload = encodeSailsCall(
    'StreamService',
    'SetTokenVault',
    encodeActorId(tokenVaultId)
  );
  
  try {
    const result2 = await sendMessage(api, keyring, streamCoreId, corePayload);
    console.log(`  ✅ Success! Block: ${result2.blockHash}\n`);
  } catch (err) {
    console.error(`  ❌ Failed: ${err.message}\n`);
  }
  
  console.log('=== Wiring Complete ===');
  console.log('\nVerify on Gear IDEA:');
  console.log(`  https://idea.gear-tech.io/programs?node=${encodeURIComponent(VARA_NODE)}`);
  
  await api.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
