import { Sails } from 'sails-js';
import { SailsIdlParser } from 'sails-js-parser';
import { GearApi, GearKeyring } from '@gear-js/api';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_ROOT = resolve(__dirname, '..');
const PROJECT_ROOT = resolve(__dirname, '../..');

function findIdl(filename) {
  const bundled = resolve(API_ROOT, 'idl', filename);
  if (existsSync(bundled)) return bundled;
  const contractMap = {
    'stream-core.idl': 'contracts/stream-core/stream-core.idl',
    'token-vault.idl': 'contracts/token-vault/token-vault.idl',
    'splits-router.idl': 'contracts/splits-router/splits-router.idl',
    'permission-manager.idl': 'contracts/permission-manager/permission-manager.idl',
    'bounty-adapter.idl': 'contracts/adapters/bounty-adapter/bounty-adapter.idl',
    'identity-registry.idl': 'contracts/identity-registry/identity-registry.idl',
  };
  return resolve(PROJECT_ROOT, contractMap[filename] || filename);
}

const IDL_PATHS = {
  streamCore: findIdl('stream-core.idl'),
  tokenVault: findIdl('token-vault.idl'),
  splitsRouter: findIdl('splits-router.idl'),
  permissionManager: findIdl('permission-manager.idl'),
  bountyAdapter: findIdl('bounty-adapter.idl'),
  identityRegistry: findIdl('identity-registry.idl'),
};

let gearApi = null;
let keyring = null;
let parser = null;

const contracts = {
  streamCore: null,
  tokenVault: null,
  splitsRouter: null,
  permissionManager: null,
  bountyAdapter: null,
  identityRegistry: null,
};

const SERVICE_NAMES = {
  streamCore: 'StreamService',
  tokenVault: 'VaultService',
  splitsRouter: 'SplitsService',
  permissionManager: 'PermissionService',
  bountyAdapter: 'BountyService',
  identityRegistry: 'IdentityService',
};

function loadDeployState() {
  const statePath = resolve(PROJECT_ROOT, 'deploy-state.json');
  try {
    return JSON.parse(readFileSync(statePath, 'utf-8'));
  } catch {
    return {};
  }
}

const DEPLOY_KEY_MAP = {
  streamCore: 'stream-core',
  tokenVault: 'token-vault',
  splitsRouter: 'splits-router',
  permissionManager: 'permission-manager',
  bountyAdapter: 'bounty-adapter',
  identityRegistry: 'identity-registry',
};

async function initSailsInstance(name, idlPath, programId) {
  const idl = readFileSync(idlPath, 'utf-8');
  const sails = new Sails(parser);
  sails.parseIdl(idl);
  sails.setApi(gearApi);
  if (programId) {
    sails.setProgramId(programId);
  }
  return sails;
}

export async function connect() {
  const nodeUrl = process.env.VARA_NODE || 'wss://testnet.vara.network';
  const seed = process.env.VARA_SEED;

  console.log(`[sails] Connecting to ${nodeUrl}...`);
  gearApi = await GearApi.create({ providerAddress: nodeUrl });
  const chain = await gearApi.chain();
  console.log(`[sails] Connected: ${chain}`);

  gearApi.on('disconnected', () => {
    console.warn('[sails] WebSocket disconnected — reconnecting...');
    gearApi.connect().catch(err => console.error('[sails] Reconnect failed:', err.message));
  });

  if (seed) {
    try {
      keyring = await GearKeyring.fromMnemonic(seed);
    } catch {
      keyring = await GearKeyring.fromSuri(seed);
    }
    console.log(`[sails] Account: ${keyring.address}`);
  }

  parser = await SailsIdlParser.new();

  const deployState = loadDeployState();

  const envOverrides = {
    streamCore: process.env.STREAM_CORE_ID,
    tokenVault: process.env.TOKEN_VAULT_ID,
    splitsRouter: process.env.SPLITS_ROUTER_ID,
    permissionManager: process.env.PERMISSION_MANAGER_ID,
    bountyAdapter: process.env.BOUNTY_ADAPTER_ID,
    identityRegistry: process.env.IDENTITY_REGISTRY_ID,
  };

  for (const [name, idlPath] of Object.entries(IDL_PATHS)) {
    const programId =
      envOverrides[name] ||
      deployState[DEPLOY_KEY_MAP[name]]?.programId ||
      null;

    try {
      contracts[name] = await initSailsInstance(name, idlPath, programId);
      console.log(`[sails] ${name} loaded${programId ? ` @ ${programId.slice(0, 18)}...` : ' (no program ID)'}`);
    } catch (err) {
      console.warn(`[sails] Failed to load ${name}: ${err.message}`);
    }
  }

  return { gearApi, keyring, contracts };
}

export function getApi() {
  return gearApi;
}

export function getKeyring() {
  return keyring;
}

export function getContract(name) {
  return contracts[name];
}

export function getServiceName(name) {
  return SERVICE_NAMES[name];
}

export function getAllContracts() {
  return contracts;
}

export function getProgramIds() {
  const ids = {};
  for (const [name, sails] of Object.entries(contracts)) {
    try {
      ids[DEPLOY_KEY_MAP[name]] = sails?.programId || null;
    } catch {
      ids[DEPLOY_KEY_MAP[name]] = null;
    }
  }
  return ids;
}

export async function query(contractName, fnName, ...args) {
  const sails = contracts[contractName];
  if (!sails) throw new Error(`Contract ${contractName} not loaded`);

  const serviceName = SERVICE_NAMES[contractName];
  const service = sails.services[serviceName];
  if (!service) throw new Error(`Service ${serviceName} not found in ${contractName}`);

  const queryFn = service.queries[fnName];
  if (!queryFn) throw new Error(`Query ${fnName} not found in ${serviceName}`);

  const origin = keyring?.address || '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  const result = await queryFn(origin, null, null, ...args);
  return result;
}

export async function command(contractName, fnName, ...args) {
  const sails = contracts[contractName];
  if (!sails) throw new Error(`Contract ${contractName} not loaded`);
  if (!keyring) throw new Error('No keyring configured for signing');

  const serviceName = SERVICE_NAMES[contractName];
  const service = sails.services[serviceName];
  if (!service) throw new Error(`Service ${serviceName} not found in ${contractName}`);

  const fn = service.functions[fnName];
  if (!fn) throw new Error(`Function ${fnName} not found in ${serviceName}`);

  const tx = fn(...args);
  tx.withAccount(keyring);
  await tx.calculateGas();
  const { response, blockHash } = await tx.signAndSend();
  let result = null;
  try {
    result = await response();
  } catch (decodeErr) {
    console.warn(`[sails] Response decode warning for ${contractName}.${fnName}: ${decodeErr.message.slice(0, 80)}`);
  }
  return { result, blockHash };
}

export function encodePayload(contractName, fnName, ...args) {
  const sails = contracts[contractName];
  if (!sails) throw new Error(`Contract ${contractName} not loaded`);

  const serviceName = SERVICE_NAMES[contractName];
  const service = sails.services[serviceName];
  if (!service) throw new Error(`Service ${serviceName} not found`);

  const fn = service.functions[fnName];
  if (!fn) throw new Error(`Function ${fnName} not found`);

  const payload = fn.encodePayload(...args);
  return '0x' + Buffer.from(payload).toString('hex');
}
