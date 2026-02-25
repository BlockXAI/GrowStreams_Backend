import { Router } from 'express';
import { query, command, encodePayload } from '../sails-client.mjs';

const router = Router();
const C = 'tokenVault';

router.get('/config', async (req, res, next) => {
  try {
    const result = await query(C, 'GetConfig');
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/paused', async (req, res, next) => {
  try {
    const result = await query(C, 'IsPaused');
    res.json({ paused: result });
  } catch (err) { next(err); }
});

router.get('/balance/:owner/:token', async (req, res, next) => {
  try {
    const result = await query(C, 'GetBalance', req.params.owner, req.params.token);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/allocation/:streamId', async (req, res, next) => {
  try {
    const id = BigInt(req.params.streamId);
    const result = await query(C, 'GetStreamAllocation', id);
    res.json({ streamId: Number(id), allocated: String(result) });
  } catch (err) { next(err); }
});

router.post('/deposit', async (req, res, next) => {
  try {
    const { token, amount, mode } = req.body;
    if (!token || !amount) return res.status(400).json({ error: 'Missing: token, amount' });
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'DepositTokens', token, BigInt(amount)) });
    }
    const { result, blockHash } = await command(C, 'DepositTokens', token, BigInt(amount));
    res.status(201).json({ token, amount, blockHash });
  } catch (err) { next(err); }
});

router.post('/withdraw', async (req, res, next) => {
  try {
    const { token, amount, mode } = req.body;
    if (!token || !amount) return res.status(400).json({ error: 'Missing: token, amount' });
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'WithdrawTokens', token, BigInt(amount)) });
    }
    const { result, blockHash } = await command(C, 'WithdrawTokens', token, BigInt(amount));
    res.json({ token, amount, blockHash });
  } catch (err) { next(err); }
});

router.post('/allocate', async (req, res, next) => {
  try {
    const { owner, token, amount, streamId, mode } = req.body;
    if (!owner || !token || !amount || !streamId) {
      return res.status(400).json({ error: 'Missing: owner, token, amount, streamId' });
    }
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'AllocateToStream', owner, token, BigInt(amount), BigInt(streamId)) });
    }
    const { result, blockHash } = await command(C, 'AllocateToStream', owner, token, BigInt(amount), BigInt(streamId));
    res.json({ streamId, amount, blockHash });
  } catch (err) { next(err); }
});

router.post('/release', async (req, res, next) => {
  try {
    const { owner, token, amount, streamId, mode } = req.body;
    if (!owner || !token || !amount || !streamId) {
      return res.status(400).json({ error: 'Missing: owner, token, amount, streamId' });
    }
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'ReleaseFromStream', owner, token, BigInt(amount), BigInt(streamId)) });
    }
    const { result, blockHash } = await command(C, 'ReleaseFromStream', owner, token, BigInt(amount), BigInt(streamId));
    res.json({ streamId, amount, blockHash });
  } catch (err) { next(err); }
});

router.post('/transfer', async (req, res, next) => {
  try {
    const { token, receiver, amount, streamId, mode } = req.body;
    if (!token || !receiver || !amount || !streamId) {
      return res.status(400).json({ error: 'Missing: token, receiver, amount, streamId' });
    }
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'TransferToReceiver', token, receiver, BigInt(amount), BigInt(streamId)) });
    }
    const { result, blockHash } = await command(C, 'TransferToReceiver', token, receiver, BigInt(amount), BigInt(streamId));
    res.json({ streamId, receiver, amount, blockHash });
  } catch (err) { next(err); }
});

router.post('/deposit-native', async (req, res, next) => {
  try {
    const { amount, mode } = req.body;
    if (!amount) return res.status(400).json({ error: 'Missing: amount' });
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'DepositNative'), value: amount });
    }
    const { result, blockHash } = await command(C, 'DepositNative');
    res.status(201).json({ amount, blockHash });
  } catch (err) { next(err); }
});

router.post('/withdraw-native', async (req, res, next) => {
  try {
    const { amount, mode } = req.body;
    if (!amount) return res.status(400).json({ error: 'Missing: amount' });
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'WithdrawNative', BigInt(amount)) });
    }
    const { result, blockHash } = await command(C, 'WithdrawNative', BigInt(amount));
    res.json({ amount, blockHash });
  } catch (err) { next(err); }
});

router.post('/pause', async (req, res, next) => {
  try {
    if (req.body?.mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'EmergencyPause') });
    }
    const { result, blockHash } = await command(C, 'EmergencyPause');
    res.json({ paused: true, blockHash });
  } catch (err) { next(err); }
});

router.post('/unpause', async (req, res, next) => {
  try {
    if (req.body?.mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'EmergencyUnpause') });
    }
    const { result, blockHash } = await command(C, 'EmergencyUnpause');
    res.json({ paused: false, blockHash });
  } catch (err) { next(err); }
});

router.post('/set-stream-core', async (req, res, next) => {
  try {
    const { streamCore, mode } = req.body;
    if (!streamCore) return res.status(400).json({ error: 'Missing: streamCore' });
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'SetStreamCore', streamCore) });
    }
    const { result, blockHash } = await command(C, 'SetStreamCore', streamCore);
    res.json({ streamCore, blockHash });
  } catch (err) { next(err); }
});

export default router;
