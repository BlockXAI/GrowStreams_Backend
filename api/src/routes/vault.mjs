import { Router } from 'express';
import { query, command, decode, encode, getTokenVaultId } from '../gear.mjs';

const router = Router();
const SERVICE = 'VaultService';

function getProgramId() {
  return getTokenVaultId();
}

// GET /vault/config
router.get('/config', async (req, res, next) => {
  try {
    const hex = await query(getProgramId(), SERVICE, 'GetConfig');
    const raw = decode.skipStrings(hex, 2);
    const admin = decode.actorId(raw, 0);
    const streamCore = decode.actorId(raw, 32);
    const paused = decode.bool(raw, 64);
    res.json({ admin, streamCore, paused });
  } catch (err) { next(err); }
});

// GET /vault/paused
router.get('/paused', async (req, res, next) => {
  try {
    const hex = await query(getProgramId(), SERVICE, 'IsPaused');
    const raw = decode.skipStrings(hex, 2);
    const paused = decode.bool(raw, 0);
    res.json({ paused });
  } catch (err) { next(err); }
});

// GET /vault/balance/:owner/:token
router.get('/balance/:owner/:token', async (req, res, next) => {
  try {
    const hex = await query(
      getProgramId(), SERVICE, 'GetBalance',
      encode.actorId(req.params.owner),
      encode.actorId(req.params.token),
    );
    const raw = decode.skipStrings(hex, 2);
    const balance = {
      owner: decode.actorId(raw, 0),
      token: decode.actorId(raw, 32),
      totalDeposited: decode.u128(raw, 64).toString(),
      totalAllocated: decode.u128(raw, 80).toString(),
      available: decode.u128(raw, 96).toString(),
    };
    res.json(balance);
  } catch (err) { next(err); }
});

// GET /vault/allocation/:streamId
router.get('/allocation/:streamId', async (req, res, next) => {
  try {
    const streamId = parseInt(req.params.streamId);
    const hex = await query(getProgramId(), SERVICE, 'GetStreamAllocation', encode.u64(streamId));
    const raw = decode.skipStrings(hex, 2);
    const allocated = decode.u128(raw, 0);
    res.json({ streamId: streamId.toString(), allocated: allocated.toString() });
  } catch (err) { next(err); }
});

// POST /vault/deposit
router.post('/deposit', async (req, res, next) => {
  try {
    const { token, amount } = req.body;
    if (!token || !amount) {
      return res.status(400).json({ error: 'Missing required fields: token, amount' });
    }
    const result = await command(
      getProgramId(), SERVICE, 'DepositTokens',
      encode.actorId(token),
      encode.u128(amount),
    );
    res.status(201).json({ token, amount, blockHash: result.blockHash });
  } catch (err) { next(err); }
});

// POST /vault/withdraw
router.post('/withdraw', async (req, res, next) => {
  try {
    const { token, amount } = req.body;
    if (!token || !amount) {
      return res.status(400).json({ error: 'Missing required fields: token, amount' });
    }
    const result = await command(
      getProgramId(), SERVICE, 'WithdrawTokens',
      encode.actorId(token),
      encode.u128(amount),
    );
    res.json({ token, amount, blockHash: result.blockHash });
  } catch (err) { next(err); }
});

// POST /vault/allocate
router.post('/allocate', async (req, res, next) => {
  try {
    const { owner, token, amount, streamId } = req.body;
    if (!owner || !token || !amount || !streamId) {
      return res.status(400).json({ error: 'Missing required fields: owner, token, amount, streamId' });
    }
    const result = await command(
      getProgramId(), SERVICE, 'AllocateToStream',
      encode.actorId(owner),
      encode.actorId(token),
      encode.u128(amount),
      encode.u64(parseInt(streamId)),
    );
    res.json({ streamId, amount, blockHash: result.blockHash });
  } catch (err) { next(err); }
});

// POST /vault/release
router.post('/release', async (req, res, next) => {
  try {
    const { owner, token, amount, streamId } = req.body;
    if (!owner || !token || !amount || !streamId) {
      return res.status(400).json({ error: 'Missing required fields: owner, token, amount, streamId' });
    }
    const result = await command(
      getProgramId(), SERVICE, 'ReleaseFromStream',
      encode.actorId(owner),
      encode.actorId(token),
      encode.u128(amount),
      encode.u64(parseInt(streamId)),
    );
    res.json({ streamId, amount, blockHash: result.blockHash });
  } catch (err) { next(err); }
});

// POST /vault/transfer
router.post('/transfer', async (req, res, next) => {
  try {
    const { token, receiver, amount, streamId } = req.body;
    if (!token || !receiver || !amount || !streamId) {
      return res.status(400).json({ error: 'Missing required fields: token, receiver, amount, streamId' });
    }
    const result = await command(
      getProgramId(), SERVICE, 'TransferToReceiver',
      encode.actorId(token),
      encode.actorId(receiver),
      encode.u128(amount),
      encode.u64(parseInt(streamId)),
    );
    res.json({ streamId, receiver, amount, blockHash: result.blockHash });
  } catch (err) { next(err); }
});

// POST /vault/pause
router.post('/pause', async (req, res, next) => {
  try {
    const result = await command(getProgramId(), SERVICE, 'EmergencyPause');
    res.json({ paused: true, blockHash: result.blockHash });
  } catch (err) { next(err); }
});

// POST /vault/unpause
router.post('/unpause', async (req, res, next) => {
  try {
    const result = await command(getProgramId(), SERVICE, 'EmergencyUnpause');
    res.json({ paused: false, blockHash: result.blockHash });
  } catch (err) { next(err); }
});

// POST /vault/set-stream-core
router.post('/set-stream-core', async (req, res, next) => {
  try {
    const { streamCore } = req.body;
    if (!streamCore) {
      return res.status(400).json({ error: 'Missing required field: streamCore' });
    }
    const result = await command(
      getProgramId(), SERVICE, 'SetStreamCore',
      encode.actorId(streamCore),
    );
    res.json({ streamCore, blockHash: result.blockHash });
  } catch (err) { next(err); }
});

export default router;
