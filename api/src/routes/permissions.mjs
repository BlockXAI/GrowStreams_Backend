import { Router } from 'express';
import { query, command, encodePayload } from '../sails-client.mjs';

const router = Router();
const C = 'permissionManager';

router.get('/config', async (req, res, next) => {
  try {
    const result = await query(C, 'GetConfig');
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/total', async (req, res, next) => {
  try {
    const result = await query(C, 'TotalPermissions');
    res.json({ total: String(result) });
  } catch (err) { next(err); }
});

router.get('/check/:granter/:grantee/:scope', async (req, res, next) => {
  try {
    const { granter, grantee, scope } = req.params;
    const result = await query(C, 'HasPermission', granter, grantee, scope);
    res.json({ granter, grantee, scope, hasPermission: result });
  } catch (err) { next(err); }
});

router.get('/granter/:address', async (req, res, next) => {
  try {
    const result = await query(C, 'GetPermissions', req.params.address);
    res.json({ granter: req.params.address, permissions: result || [] });
  } catch (err) { next(err); }
});

router.get('/grantee/:address', async (req, res, next) => {
  try {
    const result = await query(C, 'GetGrantedPermissions', req.params.address);
    res.json({ grantee: req.params.address, permissions: result || [] });
  } catch (err) { next(err); }
});

router.post('/grant', async (req, res, next) => {
  try {
    const { grantee, scope, expiresAt, mode } = req.body;
    if (!grantee || !scope) return res.status(400).json({ error: 'Missing: grantee, scope' });
    const expiry = expiresAt ? Number(expiresAt) : null;
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'GrantPermission', grantee, scope, expiry) });
    }
    const { result, blockHash } = await command(C, 'GrantPermission', grantee, scope, expiry);
    res.status(201).json({ grantee, scope, blockHash });
  } catch (err) { next(err); }
});

router.post('/revoke', async (req, res, next) => {
  try {
    const { grantee, scope, mode } = req.body;
    if (!grantee || !scope) return res.status(400).json({ error: 'Missing: grantee, scope' });
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'RevokePermission', grantee, scope) });
    }
    const { result, blockHash } = await command(C, 'RevokePermission', grantee, scope);
    res.json({ grantee, scope, revoked: true, blockHash });
  } catch (err) { next(err); }
});

router.post('/revoke-all', async (req, res, next) => {
  try {
    const { grantee, mode } = req.body;
    if (!grantee) return res.status(400).json({ error: 'Missing: grantee' });
    if (mode === 'payload') {
      return res.json({ payload: encodePayload(C, 'RevokeAll', grantee) });
    }
    const { result, blockHash } = await command(C, 'RevokeAll', grantee);
    res.json({ grantee, revokedAll: true, blockHash });
  } catch (err) { next(err); }
});

export default router;
