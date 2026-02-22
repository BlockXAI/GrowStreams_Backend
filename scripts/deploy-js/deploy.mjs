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
const MIN_BUFFER_SECONDS = parseInt(process.env.MIN_BUFFER_SECONDS || '3600', 10);

// Encode a Sails constructor init payload.
// Sails format: SCALE-encoded String (constructor name) + SCALE-encoded args
function encodeSailsInitPayload(constructorName, argsHex) {
  // SCALE compact-encode the string length, then UTF-8 bytes
  const nameBytes = Buffer.from(constructorName, 'utf-8');
  const lenPrefix = encodeCompactU32(nameBytes.length);
  const payload = Buffer.concat([lenPrefix, nameBytes, Buffer.from(argsHex, 'hex')]);
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

function encodeActorIdFromPublicKey(publicKey) {
  return Buffer.from(publicKey).toString('hex');
}

function encodeU64LE(value) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(value));
  return buf.toString('hex');
}

if (!VARA_SEED || VARA_SEED.includes('word1 word2')) {
  console.error('Error: VARA_SEED not set in .env');
  process.exit(1);
}

const ARTIFACTS = {
  'stream-core': resolve(PROJECT_ROOT, 'artifacts/stream_core.opt.wasm'),
  'token-vault': resolve(PROJECT_ROOT, 'artifacts/token_vault.opt.wasm'),
};

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

async function deployContract(api, account, name, wasmPath, initPayload) {
  console.log(`\nDeploying ${name}...`);
  console.log(`  WASM: ${wasmPath}`);
  console.log(`  Init payload: ${initPayload.slice(0, 40)}...`);

  if (!existsSync(wasmPath)) {
    console.error(`  Error: ${wasmPath} not found. Run ./scripts/build.sh first.`);
    return null;
  }

  const code = readFileSync(wasmPath);
  console.log(`  Code size: ${(code.length / 1024).toFixed(1)} KB`);

  try {
    // Calculate gas for init
    console.log(`  Calculating gas...`);
    let gasLimit;
    try {
      const gasInfo = await api.program.calculateGas.initUpload(
        account.addressRaw,
        code,
        initPayload,
        0,
        true,
      );
      gasLimit = gasInfo.min_limit;
      console.log(`  Gas limit: ${gasLimit.toString()}`);
    } catch (gasErr) {
      console.log(`  Gas calc failed: ${gasErr.message}`);
      console.log(`  Using fallback gas limit`);
      gasLimit = 500_000_000_000n;
    }

    const programUpload = {
      code,
      gasLimit,
      value: 0,
      initPayload,
    };

    const { programId, codeId, salt, extrinsic } = api.program.upload(programUpload);

    console.log(`  Program ID: ${programId}`);
    console.log(`  Code ID: ${codeId}`);

    return new Promise((resolvePromise, rejectPromise) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          rejectPromise(new Error('Deployment timed out after 120 seconds'));
        }
      }, 120_000);

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
            resolvePromise({ programId, codeId });
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
    console.error(`  Deploy error: ${error.message}`);
    return null;
  }
}

async function main() {
  const target = process.argv[2] || 'all';
  const validTargets = ['all', 'stream-core', 'token-vault'];

  if (!validTargets.includes(target)) {
    console.error(`Unknown target: ${target}`);
    console.error(`Usage: node deploy.mjs [${validTargets.join('|')}]`);
    process.exit(1);
  }

  console.log('=== GrowStreams V2 — Deploy to Vara Testnet ===');
  console.log(`Node: ${VARA_NODE}`);
  console.log(`Target: ${target}`);

  console.log('\nConnecting to Vara testnet...');
  const api = await GearApi.create({ providerAddress: VARA_NODE });
  const chain = await api.chain();
  console.log(`  Connected: ${chain}`);

  let keyring;
  try {
    keyring = await GearKeyring.fromMnemonic(VARA_SEED);
  } catch {
    console.log('  Mnemonic failed, trying fromSuri...');
    keyring = await GearKeyring.fromSuri(VARA_SEED);
  }
  const address = keyring.address;
  console.log(`  Account: ${address}`);

  const accountInfo = await api.query.system.account(address);
  const free = accountInfo.data.free;
  const balanceNum = Number(BigInt(free.toString())) / 1e12;
  console.log(`  Balance: ${balanceNum.toFixed(4)} VARA`);

  if (balanceNum < 0.01) {
    console.error('\n  Low balance. Get testnet tokens from faucet:');
    console.error('  https://idea.gear-tech.io/programs?node=wss://testnet.vara.network');
  }

  const state = loadDeployState();
  const contracts = target === 'all' ? Object.keys(ARTIFACTS) : [target];

  // Constructors take no args — admin is set from msg::source()
  const initPayload = encodeSailsInitPayload('New', '');

  for (const name of contracts) {
    try {
      const result = await deployContract(api, keyring, name, ARTIFACTS[name], initPayload);
      if (result) {
        state[name] = {
          programId: result.programId,
          codeId: result.codeId,
          deployedAt: new Date().toISOString(),
          network: 'vara-testnet',
          node: VARA_NODE,
        };
        saveDeployState(state);
        console.log(`  Saved to deploy-state.json`);
      }
    } catch (err) {
      console.error(`  Failed to deploy ${name}: ${err.message}`);
    }
  }

  console.log('\n=== Deployment complete ===');
  console.log(`State: ${DEPLOY_STATE_PATH}`);

  if (state['stream-core']) {
    console.log(`\nStreamCore:  ${state['stream-core'].programId}`);
  }
  if (state['token-vault']) {
    console.log(`TokenVault:  ${state['token-vault'].programId}`);
  }

  console.log('\nNext steps:');
  console.log('  1. Verify on: https://idea.gear-tech.io/programs');
  console.log('  2. Update docs/contracts-api.md with program IDs');

  await api.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
