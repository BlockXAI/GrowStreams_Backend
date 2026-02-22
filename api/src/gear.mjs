import { GearApi, GearKeyring } from '@gear-js/api';

let api = null;
let keyring = null;

const VARA_NODE = process.env.VARA_NODE || 'wss://testnet.vara.network';
const VARA_SEED = process.env.VARA_SEED;

const STREAM_CORE_ID = process.env.STREAM_CORE_ID;
const TOKEN_VAULT_ID = process.env.TOKEN_VAULT_ID;

// SCALE encoding helpers
function encodeCompactU32(value) {
  if (value < 64) return Buffer.from([value << 2]);
  if (value < 16384) {
    const v = (value << 2) | 1;
    return Buffer.from([v & 0xff, (v >> 8) & 0xff]);
  }
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

function buildPayload(serviceName, methodName, ...argBuffers) {
  const parts = [encodeString(serviceName), encodeString(methodName)];
  for (const buf of argBuffers) parts.push(buf);
  return '0x' + Buffer.concat(parts).toString('hex');
}

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

function decodeU64(buf, offset = 0) {
  return buf.readBigUInt64LE(offset);
}

function decodeU128(buf, offset = 0) {
  const lo = buf.readBigUInt64LE(offset);
  const hi = buf.readBigUInt64LE(offset + 8);
  return (hi << 64n) | lo;
}

function decodeActorIdHex(buf, offset = 0) {
  return '0x' + buf.subarray(offset, offset + 32).toString('hex');
}

function decodeBool(buf, offset = 0) {
  return buf[offset] === 1;
}

export async function connect() {
  if (api && api.isConnected) return;
  console.log('[gear] Connecting to', VARA_NODE);
  api = await GearApi.create({ providerAddress: VARA_NODE });
  console.log('[gear] Connected:', api.runtimeChain.toString());

  if (!VARA_SEED) throw new Error('VARA_SEED not set');
  try {
    keyring = await GearKeyring.fromMnemonic(VARA_SEED);
  } catch {
    keyring = await GearKeyring.fromSuri(VARA_SEED);
  }
  console.log('[gear] Account:', keyring.address);
}

export function getApi() { return api; }
export function getKeyring() { return keyring; }
export function getStreamCoreId() { return STREAM_CORE_ID; }
export function getTokenVaultId() { return TOKEN_VAULT_ID; }

// Query: off-chain simulation, no gas cost
export async function query(programId, serviceName, methodName, ...argBuffers) {
  const payload = buildPayload(serviceName, methodName, ...argBuffers);
  const result = await api.message.calculateReply({
    origin: keyring.addressRaw,
    destination: programId,
    payload,
    value: 0,
    gasLimit: 100_000_000_000n,
  });
  return result.payload.toHex();
}

// Command: real on-chain transaction
export async function command(programId, serviceName, methodName, ...argBuffers) {
  const payload = buildPayload(serviceName, methodName, ...argBuffers);

  const gasInfo = await api.program.calculateGas.handle(
    keyring.addressRaw,
    programId,
    payload,
    0,
    true,
  );

  const tx = api.message.send({
    destination: programId,
    payload,
    gasLimit: gasInfo.min_limit,
    value: 0,
  });

  return new Promise((resolve, reject) => {
    let done = false;
    const timeout = setTimeout(() => {
      if (!done) { done = true; reject(new Error('Transaction timeout (90s)')); }
    }, 90_000);

    tx.signAndSend(keyring, ({ events = [], status }) => {
      if (status.isFinalized) {
        clearTimeout(timeout);
        if (done) return;
        done = true;

        let replyHex = null;
        for (const { event } of events) {
          if (api.events.system.ExtrinsicFailed.is(event)) {
            const [err] = event.data;
            const info = err.isModule
              ? api.registry.findMetaError(err.asModule).name
              : err.toString();
            return reject(new Error(info));
          }
          if (event.section === 'gear' && event.method === 'UserMessageSent') {
            try { replyHex = event.data[0].payload.toHex(); } catch {}
          }
        }
        resolve({
          blockHash: status.asFinalized.toHex(),
          replyHex,
        });
      }
    }).catch(err => {
      clearTimeout(timeout);
      if (!done) { done = true; reject(err); }
    });
  });
}

// Decode helpers exported for routes
export const decode = {
  skipStrings,
  u64: decodeU64,
  u128: decodeU128,
  actorId: decodeActorIdHex,
  bool: decodeBool,
};

export const encode = {
  u64: encodeU64LE,
  u128: encodeU128LE,
  actorId: encodeActorId,
};
