import { Router } from 'express';
import { query, command, encodePayload } from '../sails-client.mjs';

const router = Router();
const C = 'bountyAdapter';

router.get('/config', async (req, res, next) => {
  try {
    const result = await query(C, 'GetConfig');
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/total', async (req, res, next) => {
  try {
    const result = await query(C, 'TotalBounties');
    res.json({ total: String(result) });
  } catch (err) { next(err); }
});

router.get('/open', async (req, res, next) => {
  try {
    const result = await query(C, 'GetOpenBounties');
    res.json({ bountyIds: (result || []).map(String) });
  } catch (err) { next(err); }
});

router.get('/creator/:address', async (req, res, next) => {
  try {
    const result = await query(C, 'GetCreatorBounties', req.params.address);
    res.json({ creator: req.params.address, bountyIds: (result || []).map(String) });
  } catch (err) { next(err); }
});

router.get('/claimer/:address', async (req, res, next) => {
  try {
    const result = await query(C, 'GetClaimerBounties', req.params.address);
    res.json({ claimer: req.params.address, bountyIds: (result || []).map(String) });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const result = await query(C, 'GetBounty', id);
    if (!result) return res.status(404).json({ error: 'Bounty not found' });
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, token, maxFlowRate, minScore, totalBudget, mode } = req.body;
    if (!title || !token || !maxFlowRate || !minScore || !totalBudget) {
      return res.status(400).json({ error: 'Missing: title, token, maxFlowRate, minScore, totalBudget' });
    }
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'CreateBounty', title, token, BigInt(maxFlowRate), Number(minScore), BigInt(totalBudget)) });
    }
    const { result, blockHash } = await command(C, 'CreateBounty', title, token, BigInt(maxFlowRate), Number(minScore), BigInt(totalBudget));
    res.status(201).json({ result, blockHash });
  } catch (err) { next(err); }
});

router.post('/:id/claim', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    if (req.body?.mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'ClaimBounty', id) });
    }
    const { result, blockHash } = await command(C, 'ClaimBounty', id);
    res.json({ bountyId: Number(id), claimed: true, blockHash });
  } catch (err) { next(err); }
});

router.post('/:id/verify', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const { claimer, score, mode } = req.body;
    if (!claimer || score == null) return res.status(400).json({ error: 'Missing: claimer, score' });
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'VerifyAndStartStream', id, claimer, Number(score)) });
    }
    const { result, blockHash } = await command(C, 'VerifyAndStartStream', id, claimer, Number(score));
    res.json({ bountyId: Number(id), result, blockHash });
  } catch (err) { next(err); }
});

router.post('/:id/adjust', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const { newFlowRate, mode } = req.body;
    if (!newFlowRate) return res.status(400).json({ error: 'Missing: newFlowRate' });
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'AdjustStream', id, BigInt(newFlowRate)) });
    }
    const { result, blockHash } = await command(C, 'AdjustStream', id, BigInt(newFlowRate));
    res.json({ bountyId: Number(id), blockHash });
  } catch (err) { next(err); }
});

router.post('/:id/complete', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    if (req.body?.mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'CompleteBounty', id) });
    }
    const { result, blockHash } = await command(C, 'CompleteBounty', id);
    res.json({ bountyId: Number(id), completed: true, blockHash });
  } catch (err) { next(err); }
});

router.post('/:id/cancel', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    if (req.body?.mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'CancelBounty', id) });
    }
    const { result, blockHash } = await command(C, 'CancelBounty', id);
    res.json({ bountyId: Number(id), cancelled: true, blockHash });
  } catch (err) { next(err); }
});

export default router;
