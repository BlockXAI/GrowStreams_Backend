import { Router } from 'express';
import { query, command, encodePayload, getProgramIds, getKeyring } from '../sails-client.mjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();
const C = 'growToken';

const FAUCET_AMOUNT = BigInt('1000000000000000'); // 1,000 GROW
const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes between requests per address

const faucetState = {
  mode: 'public',       // 'public' | 'whitelist'
  whitelist: new Set(),
  lastMint: new Map(),  // address -> timestamp
};

const STATE_FILE = resolve(__dirname, '../../faucet-state.json');

function loadFaucetState() {
  try {
    if (existsSync(STATE_FILE)) {
      const data = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
      faucetState.mode = data.mode || 'public';
      faucetState.whitelist = new Set(data.whitelist || []);
    }
  } catch { /* start fresh */ }
}

function saveFaucetState() {
  try {
    writeFileSync(STATE_FILE, JSON.stringify({
      mode: faucetState.mode,
      whitelist: [...faucetState.whitelist],
    }, null, 2));
  } catch (err) {
    console.warn('[faucet] Failed to persist state:', err.message);
  }
}

loadFaucetState();

function getAdminAddress() {
  const kr = getKeyring();
  return kr?.address || null;
}

function isAdmin(address) {
  const admin = getAdminAddress();
  if (!admin) return false;
  return address?.toLowerCase() === admin.toLowerCase();
}

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

// --- Faucet: server-side minting (uses admin keyring) ---

router.post('/faucet', async (req, res, next) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: 'Missing: to (recipient address)' });

    const addrLower = to.toLowerCase();

    // Check whitelist mode
    if (faucetState.mode === 'whitelist' && !faucetState.whitelist.has(addrLower)) {
      return res.status(403).json({ error: 'Address not whitelisted. Contact admin to get access.' });
    }

    // Rate limit
    const lastTime = faucetState.lastMint.get(addrLower);
    if (lastTime && Date.now() - lastTime < RATE_LIMIT_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_MS - (Date.now() - lastTime)) / 1000);
      return res.status(429).json({ error: `Rate limited. Try again in ${waitSec}s.` });
    }

    // Mint using server-side admin keyring
    const { result, blockHash } = await command(C, 'Mint', to, FAUCET_AMOUNT);
    faucetState.lastMint.set(addrLower, Date.now());

    res.json({
      success: true,
      to,
      amount: FAUCET_AMOUNT.toString(),
      amountHuman: '1,000 GROW',
      blockHash,
    });
  } catch (err) { next(err); }
});

router.get('/faucet/config', async (req, res) => {
  res.json({
    mode: faucetState.mode,
    amountPerMint: FAUCET_AMOUNT.toString(),
    amountHuman: '1,000 GROW',
    rateLimitSeconds: RATE_LIMIT_MS / 1000,
  });
});

// --- Admin: whitelist management ---

router.get('/admin/info', async (req, res) => {
  const kr = getKeyring();
  res.json({
    adminAddress: kr?.address || null,
    faucetMode: faucetState.mode,
    whitelistCount: faucetState.whitelist.size,
  });
});

router.get('/admin/whitelist', async (req, res) => {
  res.json({
    mode: faucetState.mode,
    whitelist: [...faucetState.whitelist],
  });
});

router.post('/admin/whitelist', async (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: 'Missing: address' });
  faucetState.whitelist.add(address.toLowerCase());
  saveFaucetState();
  res.json({ added: address, total: faucetState.whitelist.size });
});

router.delete('/admin/whitelist/:address', async (req, res) => {
  const addr = req.params.address.toLowerCase();
  faucetState.whitelist.delete(addr);
  saveFaucetState();
  res.json({ removed: req.params.address, total: faucetState.whitelist.size });
});

router.post('/admin/faucet-mode', async (req, res) => {
  const { mode } = req.body;
  if (mode !== 'public' && mode !== 'whitelist') {
    return res.status(400).json({ error: 'mode must be "public" or "whitelist"' });
  }
  faucetState.mode = mode;
  saveFaucetState();
  res.json({ mode: faucetState.mode });
});

export default router;
