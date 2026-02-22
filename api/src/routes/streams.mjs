import { Router } from 'express';
import { query, command, decode, encode, getStreamCoreId } from '../gear.mjs';

const router = Router();
const SERVICE = 'StreamService';

function getProgramId() {
  return getStreamCoreId();
}

// GET /streams/config
router.get('/config', async (req, res, next) => {
  try {
    const hex = await query(getProgramId(), SERVICE, 'GetConfig');
    const raw = decode.skipStrings(hex, 2);
    const admin = decode.actorId(raw, 0);
    const minBufferSeconds = decode.u64(raw, 32);
    res.json({ admin, minBufferSeconds: minBufferSeconds.toString() });
  } catch (err) { next(err); }
});

// GET /streams/total
router.get('/total', async (req, res, next) => {
  try {
    const hex = await query(getProgramId(), SERVICE, 'TotalStreams');
    const raw = decode.skipStrings(hex, 2);
    const total = decode.u64(raw, 0);
    res.json({ total: total.toString() });
  } catch (err) { next(err); }
});

// GET /streams/active
router.get('/active', async (req, res, next) => {
  try {
    const hex = await query(getProgramId(), SERVICE, 'ActiveStreams');
    const raw = decode.skipStrings(hex, 2);
    const active = decode.u64(raw, 0);
    res.json({ active: active.toString() });
  } catch (err) { next(err); }
});

// GET /streams/:id
router.get('/:id', async (req, res, next) => {
  try {
    const streamId = parseInt(req.params.id);
    const hex = await query(getProgramId(), SERVICE, 'GetStream', encode.u64(streamId));
    const raw = decode.skipStrings(hex, 2);
    // Option<Stream>: first byte 0x01 = Some, 0x00 = None
    if (raw[0] === 0) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    const data = raw.subarray(1);
    const stream = {
      id: decode.u64(data, 0).toString(),
      sender: decode.actorId(data, 8),
      receiver: decode.actorId(data, 40),
      token: decode.actorId(data, 72),
      flowRate: decode.u128(data, 104).toString(),
      startTime: decode.u64(data, 120).toString(),
      lastUpdate: decode.u64(data, 128).toString(),
      deposited: decode.u128(data, 136).toString(),
      withdrawn: decode.u128(data, 152).toString(),
      status: data[168], // 0=Active, 1=Paused, 2=Stopped
      statusLabel: ['Active', 'Paused', 'Stopped'][data[168]] || 'Unknown',
    };
    res.json(stream);
  } catch (err) { next(err); }
});

// GET /streams/:id/balance
router.get('/:id/balance', async (req, res, next) => {
  try {
    const streamId = parseInt(req.params.id);
    const hex = await query(getProgramId(), SERVICE, 'GetWithdrawableBalance', encode.u64(streamId));
    const raw = decode.skipStrings(hex, 2);
    const balance = decode.u128(raw, 0);
    res.json({ streamId: streamId.toString(), withdrawable: balance.toString() });
  } catch (err) { next(err); }
});

// GET /streams/:id/buffer
router.get('/:id/buffer', async (req, res, next) => {
  try {
    const streamId = parseInt(req.params.id);
    const hex = await query(getProgramId(), SERVICE, 'GetRemainingBuffer', encode.u64(streamId));
    const raw = decode.skipStrings(hex, 2);
    const buffer = decode.u128(raw, 0);
    res.json({ streamId: streamId.toString(), remainingBuffer: buffer.toString() });
  } catch (err) { next(err); }
});

// GET /streams/sender/:address
router.get('/sender/:address', async (req, res, next) => {
  try {
    const hex = await query(getProgramId(), SERVICE, 'GetSenderStreams', encode.actorId(req.params.address));
    const raw = decode.skipStrings(hex, 2);
    const ids = decodeVecU64(raw);
    res.json({ sender: req.params.address, streamIds: ids.map(String) });
  } catch (err) { next(err); }
});

// GET /streams/receiver/:address
router.get('/receiver/:address', async (req, res, next) => {
  try {
    const hex = await query(getProgramId(), SERVICE, 'GetReceiverStreams', encode.actorId(req.params.address));
    const raw = decode.skipStrings(hex, 2);
    const ids = decodeVecU64(raw);
    res.json({ receiver: req.params.address, streamIds: ids.map(String) });
  } catch (err) { next(err); }
});

// POST /streams — create a new stream
router.post('/', async (req, res, next) => {
  try {
    const { receiver, token, flowRate, initialDeposit } = req.body;
    if (!receiver || !token || !flowRate || !initialDeposit) {
      return res.status(400).json({ error: 'Missing required fields: receiver, token, flowRate, initialDeposit' });
    }
    const result = await command(
      getProgramId(), SERVICE, 'CreateStream',
      encode.actorId(receiver),
      encode.actorId(token),
      encode.u128(flowRate),
      encode.u128(initialDeposit),
    );
    // Read new total to get the stream ID
    const hex = await query(getProgramId(), SERVICE, 'TotalStreams');
    const raw = decode.skipStrings(hex, 2);
    const streamId = decode.u64(raw, 0);
    res.status(201).json({
      streamId: streamId.toString(),
      blockHash: result.blockHash,
    });
  } catch (err) { next(err); }
});

// PUT /streams/:id — update stream flow rate
router.put('/:id', async (req, res, next) => {
  try {
    const streamId = parseInt(req.params.id);
    const { flowRate } = req.body;
    if (!flowRate) {
      return res.status(400).json({ error: 'Missing required field: flowRate' });
    }
    const result = await command(
      getProgramId(), SERVICE, 'UpdateStream',
      encode.u64(streamId),
      encode.u128(flowRate),
    );
    res.json({ streamId: streamId.toString(), newFlowRate: flowRate, blockHash: result.blockHash });
  } catch (err) { next(err); }
});

// POST /streams/:id/pause
router.post('/:id/pause', async (req, res, next) => {
  try {
    const streamId = parseInt(req.params.id);
    const result = await command(getProgramId(), SERVICE, 'PauseStream', encode.u64(streamId));
    res.json({ streamId: streamId.toString(), status: 'paused', blockHash: result.blockHash });
  } catch (err) { next(err); }
});

// POST /streams/:id/resume
router.post('/:id/resume', async (req, res, next) => {
  try {
    const streamId = parseInt(req.params.id);
    const result = await command(getProgramId(), SERVICE, 'ResumeStream', encode.u64(streamId));
    res.json({ streamId: streamId.toString(), status: 'active', blockHash: result.blockHash });
  } catch (err) { next(err); }
});

// POST /streams/:id/deposit
router.post('/:id/deposit', async (req, res, next) => {
  try {
    const streamId = parseInt(req.params.id);
    const { amount } = req.body;
    if (!amount) {
      return res.status(400).json({ error: 'Missing required field: amount' });
    }
    const result = await command(
      getProgramId(), SERVICE, 'Deposit',
      encode.u64(streamId),
      encode.u128(amount),
    );
    res.json({ streamId: streamId.toString(), deposited: amount, blockHash: result.blockHash });
  } catch (err) { next(err); }
});

// POST /streams/:id/withdraw
router.post('/:id/withdraw', async (req, res, next) => {
  try {
    const streamId = parseInt(req.params.id);
    const result = await command(getProgramId(), SERVICE, 'Withdraw', encode.u64(streamId));
    res.json({ streamId: streamId.toString(), blockHash: result.blockHash });
  } catch (err) { next(err); }
});

// POST /streams/:id/stop
router.post('/:id/stop', async (req, res, next) => {
  try {
    const streamId = parseInt(req.params.id);
    const result = await command(getProgramId(), SERVICE, 'StopStream', encode.u64(streamId));
    res.json({ streamId: streamId.toString(), status: 'stopped', blockHash: result.blockHash });
  } catch (err) { next(err); }
});

// Decode a SCALE Vec<u64>
function decodeVecU64(buf) {
  const firstByte = buf[0];
  let count, offset;
  if ((firstByte & 3) === 0) { count = firstByte >> 2; offset = 1; }
  else if ((firstByte & 3) === 1) { count = ((buf[0] | (buf[1] << 8)) >> 2); offset = 2; }
  else { count = ((buf.readUInt32LE(0)) >> 2); offset = 4; }
  const ids = [];
  for (let i = 0; i < count; i++) {
    ids.push(buf.readBigUInt64LE(offset + i * 8));
  }
  return ids;
}

export default router;
