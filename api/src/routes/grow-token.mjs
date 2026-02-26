import { Router } from 'express';
import { query, command, encodePayload, getProgramIds } from '../sails-client.mjs';

const router = Router();
const C = 'growToken';

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

router.get('/meta', async (req, res, next) => {
  try {
    const result = await query(C, 'GetMeta');
    const ids = getProgramIds();
    res.json({ ...serializeDeep(result), programId: ids['grow-token'] || null });
  } catch (err) { next(err); }
});

router.get('/balance/:account', async (req, res, next) => {
  try {
    const result = await query(C, 'BalanceOf', req.params.account);
    res.json({ account: req.params.account, balance: toBigIntStr(result) });
  } catch (err) { next(err); }
});

router.get('/allowance/:owner/:spender', async (req, res, next) => {
  try {
    const result = await query(C, 'Allowance', req.params.owner, req.params.spender);
    res.json({ owner: req.params.owner, spender: req.params.spender, allowance: toBigIntStr(result) });
  } catch (err) { next(err); }
});

router.get('/total-supply', async (req, res, next) => {
  try {
    const result = await query(C, 'TotalSupply');
    res.json({ totalSupply: toBigIntStr(result) });
  } catch (err) { next(err); }
});

router.post('/transfer', async (req, res, next) => {
  try {
    const { to, amount, mode } = req.body;
    if (!to || !amount) return res.status(400).json({ error: 'Missing: to, amount' });
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'Transfer', to, BigInt(amount)) });
    }
    const { result, blockHash } = await command(C, 'Transfer', to, BigInt(amount));
    res.json({ to, amount, success: result, blockHash });
  } catch (err) { next(err); }
});

router.post('/approve', async (req, res, next) => {
  try {
    const { spender, amount, mode } = req.body;
    if (!spender || !amount) return res.status(400).json({ error: 'Missing: spender, amount' });
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'Approve', spender, BigInt(amount)) });
    }
    const { result, blockHash } = await command(C, 'Approve', spender, BigInt(amount));
    res.json({ spender, amount, success: result, blockHash });
  } catch (err) { next(err); }
});

router.post('/transfer-from', async (req, res, next) => {
  try {
    const { from, to, amount, mode } = req.body;
    if (!from || !to || !amount) return res.status(400).json({ error: 'Missing: from, to, amount' });
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'TransferFrom', from, to, BigInt(amount)) });
    }
    const { result, blockHash } = await command(C, 'TransferFrom', from, to, BigInt(amount));
    res.json({ from, to, amount, success: result, blockHash });
  } catch (err) { next(err); }
});

router.post('/mint', async (req, res, next) => {
  try {
    const { to, amount, mode } = req.body;
    if (!to || !amount) return res.status(400).json({ error: 'Missing: to, amount' });
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'Mint', to, BigInt(amount)) });
    }
    const { result, blockHash } = await command(C, 'Mint', to, BigInt(amount));
    res.json({ to, amount, blockHash });
  } catch (err) { next(err); }
});

router.post('/burn', async (req, res, next) => {
  try {
    const { amount, mode } = req.body;
    if (!amount) return res.status(400).json({ error: 'Missing: amount' });
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'Burn', BigInt(amount)) });
    }
    const { result, blockHash } = await command(C, 'Burn', BigInt(amount));
    res.json({ amount, blockHash });
  } catch (err) { next(err); }
});

export default router;
