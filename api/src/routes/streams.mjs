import { Router } from 'express';
import { query, command, encodePayload } from '../sails-client.mjs';

const router = Router();
const C = 'streamCore';

function toBigIntStr(v) {
  if (v == null) return '0';
  return typeof v === 'bigint' ? v.toString() : String(v);
}

function serializeDeep(obj) {
  if (obj == null) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeDeep);
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = serializeDeep(v);
    }
    return out;
  }
  return obj;
}

router.get('/config', async (req, res, next) => {
  try {
    const result = await query(C, 'GetConfig');
    res.json(serializeDeep(result));
  } catch (err) { next(err); }
});

router.get('/total', async (req, res, next) => {
  try {
    const result = await query(C, 'TotalStreams');
    res.json({ total: toBigIntStr(result) });
  } catch (err) { next(err); }
});

router.get('/active', async (req, res, next) => {
  try {
    const result = await query(C, 'ActiveStreams');
    res.json({ active: toBigIntStr(result) });
  } catch (err) { next(err); }
});

router.get('/sender/:address', async (req, res, next) => {
  try {
    const result = await query(C, 'GetSenderStreams', req.params.address);
    res.json({ sender: req.params.address, streamIds: (result || []).map(toBigIntStr) });
  } catch (err) { next(err); }
});

router.get('/receiver/:address', async (req, res, next) => {
  try {
    const result = await query(C, 'GetReceiverStreams', req.params.address);
    res.json({ receiver: req.params.address, streamIds: (result || []).map(toBigIntStr) });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const result = await query(C, 'GetStream', id);
    if (!result) return res.status(404).json({ error: 'Stream not found' });
    res.json(serializeDeep(result));
  } catch (err) { next(err); }
});

router.get('/:id/balance', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const result = await query(C, 'GetWithdrawableBalance', id);
    res.json({ streamId: Number(id), withdrawable: toBigIntStr(result) });
  } catch (err) { next(err); }
});

router.get('/:id/buffer', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const result = await query(C, 'GetRemainingBuffer', id);
    res.json({ streamId: Number(id), remainingBuffer: toBigIntStr(result) });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { receiver, token, flowRate, initialDeposit, mode } = req.body;
    if (!receiver || !token || !flowRate || !initialDeposit) {
      return res.status(400).json({ error: 'Missing: receiver, token, flowRate, initialDeposit' });
    }
    if (mode === 'payload') {
      const payload = encodePayload(C, 'CreateStream', receiver, token, BigInt(flowRate), BigInt(initialDeposit));
      return res.json({ payload });
    }
    const { result, blockHash } = await command(C, 'CreateStream', receiver, token, BigInt(flowRate), BigInt(initialDeposit));
    res.status(201).json({ result, blockHash });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const { flowRate, mode } = req.body;
    if (!flowRate) return res.status(400).json({ error: 'Missing: flowRate' });
    if (mode === 'payload') {
      const payload = encodePayload(C, 'UpdateStream', id, BigInt(flowRate));
      return res.json({ payload });
    }
    const { result, blockHash } = await command(C, 'UpdateStream', id, BigInt(flowRate));
    res.json({ streamId: Number(id), blockHash });
  } catch (err) { next(err); }
});

router.post('/:id/pause', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    if (req.body?.mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'PauseStream', id) });
    }
    const { result, blockHash } = await command(C, 'PauseStream', id);
    res.json({ streamId: Number(id), status: 'paused', blockHash });
  } catch (err) { next(err); }
});

router.post('/:id/resume', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    if (req.body?.mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'ResumeStream', id) });
    }
    const { result, blockHash } = await command(C, 'ResumeStream', id);
    res.json({ streamId: Number(id), status: 'active', blockHash });
  } catch (err) { next(err); }
});

router.post('/:id/deposit', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const { amount, mode } = req.body;
    if (!amount) return res.status(400).json({ error: 'Missing: amount' });
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'Deposit', id, BigInt(amount)) });
    }
    const { result, blockHash } = await command(C, 'Deposit', id, BigInt(amount));
    res.json({ streamId: Number(id), deposited: amount, blockHash });
  } catch (err) { next(err); }
});

router.post('/:id/withdraw', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    if (req.body?.mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'Withdraw', id) });
    }
    const { result, blockHash } = await command(C, 'Withdraw', id);
    res.json({ streamId: Number(id), withdrawn: toBigIntStr(result), blockHash });
  } catch (err) { next(err); }
});

router.post('/:id/stop', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    if (req.body?.mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'StopStream', id) });
    }
    const { result, blockHash } = await command(C, 'StopStream', id);
    res.json({ streamId: Number(id), status: 'stopped', blockHash });
  } catch (err) { next(err); }
});

router.post('/:id/liquidate', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    if (req.body?.mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'Liquidate', id) });
    }
    const { result, blockHash } = await command(C, 'Liquidate', id);
    res.json({ streamId: Number(id), status: 'liquidated', blockHash });
  } catch (err) { next(err); }
});

export default router;
