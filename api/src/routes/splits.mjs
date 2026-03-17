import { Router } from 'express';
import { query, command, encodePayload } from '../sails-client.mjs';

const router = Router();
const C = 'splitsRouter';

router.get('/config', async (req, res, next) => {
  try {
    const result = await query(C, 'GetConfig');
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/total', async (req, res, next) => {
  try {
    const result = await query(C, 'TotalGroups');
    res.json({ total: String(result) });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const result = await query(C, 'GetSplitGroup', id);
    if (!result) return res.status(404).json({ error: 'Split group not found' });
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/owner/:address', async (req, res, next) => {
  try {
    const result = await query(C, 'GetOwnerGroups', req.params.address);
    res.json({ owner: req.params.address, groupIds: (result || []).map(String) });
  } catch (err) { next(err); }
});

router.get('/:id/preview/:amount', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const amount = BigInt(req.params.amount);
    const result = await query(C, 'PreviewDistribution', id, amount);
    res.json({ groupId: Number(id), amount: req.params.amount, shares: result });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { recipients, mode } = req.body;
    if (!recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ error: 'Missing: recipients (array of {address, weight})' });
    }
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'CreateSplitGroup', recipients) });
    }
    const { result, blockHash } = await command(C, 'CreateSplitGroup', recipients);
    res.status(201).json({ result, blockHash });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const { recipients, mode } = req.body;
    if (!recipients) return res.status(400).json({ error: 'Missing: recipients' });
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'UpdateSplitGroup', id, recipients) });
    }
    const { result, blockHash } = await command(C, 'UpdateSplitGroup', id, recipients);
    res.json({ groupId: Number(id), blockHash });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    if (req.body?.mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'DeleteSplitGroup', id) });
    }
    const { result, blockHash } = await command(C, 'DeleteSplitGroup', id);
    res.json({ groupId: Number(id), deleted: true, blockHash });
  } catch (err) { next(err); }
});

router.post('/:id/distribute', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const { token, amount, mode } = req.body;
    if (!token || !amount) return res.status(400).json({ error: 'Missing: token, amount' });
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'Distribute', id, token, BigInt(amount)) });
    }
    const { result, blockHash } = await command(C, 'Distribute', id, token, BigInt(amount));
    res.json({ groupId: Number(id), blockHash });
  } catch (err) { next(err); }
});

export default router;
