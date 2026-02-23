import { Router } from 'express';
import { query, command, encodePayload } from '../sails-client.mjs';

const router = Router();
const C = 'identityRegistry';

router.get('/config', async (req, res, next) => {
  try {
    const result = await query(C, 'GetConfig');
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/oracle', async (req, res, next) => {
  try {
    const result = await query(C, 'OracleAddress');
    res.json({ oracle: result });
  } catch (err) { next(err); }
});

router.get('/total', async (req, res, next) => {
  try {
    const result = await query(C, 'TotalBindings');
    res.json({ total: String(result) });
  } catch (err) { next(err); }
});

router.get('/binding/:actorId', async (req, res, next) => {
  try {
    const result = await query(C, 'GetBinding', req.params.actorId);
    if (!result) return res.status(404).json({ error: 'Binding not found' });
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/github/:username', async (req, res, next) => {
  try {
    const result = await query(C, 'GetActorByGithub', req.params.username);
    if (!result) return res.status(404).json({ error: 'No binding for this GitHub user' });
    res.json({ github: req.params.username, actorId: result });
  } catch (err) { next(err); }
});

router.post('/bind', async (req, res, next) => {
  try {
    const { actorId, githubUsername, proofHash, score, mode } = req.body;
    if (!actorId || !githubUsername || !proofHash || score == null) {
      return res.status(400).json({ error: 'Missing: actorId, githubUsername, proofHash, score' });
    }
    const proofBytes = Array.from(Buffer.from(proofHash.replace(/^0x/, ''), 'hex'));
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'CreateBinding', actorId, githubUsername, proofBytes, Number(score)) });
    }
    const { result, blockHash } = await command(C, 'CreateBinding', actorId, githubUsername, proofBytes, Number(score));
    res.status(201).json({ actorId, githubUsername, blockHash });
  } catch (err) { next(err); }
});

router.post('/revoke', async (req, res, next) => {
  try {
    const { actorId, mode } = req.body;
    if (!actorId) return res.status(400).json({ error: 'Missing: actorId' });
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'RevokeBinding', actorId) });
    }
    const { result, blockHash } = await command(C, 'RevokeBinding', actorId);
    res.json({ actorId, revoked: true, blockHash });
  } catch (err) { next(err); }
});

router.post('/update-score', async (req, res, next) => {
  try {
    const { actorId, newScore, mode } = req.body;
    if (!actorId || newScore == null) return res.status(400).json({ error: 'Missing: actorId, newScore' });
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'UpdateScore', actorId, Number(newScore)) });
    }
    const { result, blockHash } = await command(C, 'UpdateScore', actorId, Number(newScore));
    res.json({ actorId, newScore, blockHash });
  } catch (err) { next(err); }
});

export default router;
