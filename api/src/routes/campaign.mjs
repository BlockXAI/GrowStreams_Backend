import { Router } from 'express';
import { getSupabase } from '../services/supabase.mjs';
import {
  getLeaderboard,
  getParticipantStats,
  calculateAllPayouts,
} from '../services/xp-service.mjs';

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/campaign/register
// ---------------------------------------------------------------------------
router.post('/register', async (req, res, next) => {
  try {
    const { wallet, github_handle, x_handle, track } = req.body;

    if (!wallet) {
      return res.status(400).json({ error: 'Missing required field: wallet' });
    }
    if (!track || !['OSS', 'CONTENT', 'BOTH'].includes(track)) {
      return res.status(400).json({ error: 'Invalid track. Must be OSS, CONTENT, or BOTH' });
    }
    if (track === 'OSS' && !github_handle) {
      return res.status(400).json({ error: 'github_handle is required for OSS track' });
    }
    if (track === 'CONTENT' && !x_handle) {
      return res.status(400).json({ error: 'x_handle is required for CONTENT track' });
    }
    if (track === 'BOTH' && !github_handle && !x_handle) {
      return res.status(400).json({ error: 'At least one handle (github or x) is required for BOTH track' });
    }

    const display_name = github_handle || x_handle || wallet.slice(0, 12);

    const db = getSupabase();
    const { data, error } = await db
      .from('participants')
      .insert({
        wallet,
        github_handle: github_handle || null,
        x_handle: x_handle || null,
        display_name,
        track,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Participant already registered or handle already taken' });
      }
      throw new Error(`Registration failed: ${error.message}`);
    }

    console.log(`[campaign] Registered ${wallet} (${track})`);
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// GET /api/campaign/participant/:wallet
// ---------------------------------------------------------------------------
router.get('/participant/:wallet', async (req, res, next) => {
  try {
    const { wallet } = req.params;
    const stats = await getParticipantStats(wallet);
    res.json(stats);
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// GET /api/campaign/config
// ---------------------------------------------------------------------------
router.get('/config', (req, res) => {
  res.json({
    campaignStartDate: process.env.CAMPAIGN_START_DATE || null,
    campaignEndDate: process.env.CAMPAIGN_END_DATE || null,
    poolUSDC: parseFloat(process.env.CAMPAIGN_POOL_USDC || '500'),
    scoreThreshold: parseInt(process.env.SCORE_THRESHOLD || '70', 10),
    xpTiers: {
      oss: {
        initial: {
          '70-79': parseInt(process.env.OSS_XP_70 || '700', 10),
          '80-89': parseInt(process.env.OSS_XP_80 || '1200', 10),
          '90-100': parseInt(process.env.OSS_XP_90 || '2000', 10),
        },
        daily: {
          '70-79': parseInt(process.env.OSS_DAILY_70 || '100', 10),
          '80-89': parseInt(process.env.OSS_DAILY_80 || '150', 10),
          '90-100': parseInt(process.env.OSS_DAILY_90 || '200', 10),
        },
        mergeBonus: parseInt(process.env.MERGE_BONUS_XP || '500', 10),
      },
      content: {
        initial: {
          '70-79': parseInt(process.env.CONTENT_XP_70 || '500', 10),
          '80-89': parseInt(process.env.CONTENT_XP_80 || '800', 10),
          '90-100': parseInt(process.env.CONTENT_XP_90 || '1200', 10),
        },
        threadBonus: '30%',
        viralBonus: 800,
        reshareBonus: 500,
      },
    },
    payoutFormula: '(userXP / totalXP) * poolUSDC',
    minimumPayout: 1.0,
  });
});

// ---------------------------------------------------------------------------
// POST /api/campaign/payout-snapshot (admin only)
// ---------------------------------------------------------------------------
router.post('/payout-snapshot', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret) {
      return res.status(500).json({ error: 'ADMIN_SECRET not configured on server' });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization header: Bearer <ADMIN_SECRET>' });
    }

    const token = authHeader.slice(7);
    if (token !== adminSecret) {
      return res.status(401).json({ error: 'Invalid admin secret' });
    }

    const payouts = await calculateAllPayouts();
    console.log(`[campaign] Payout snapshot generated: ${payouts.totalParticipants} participants, ${payouts.totalXP} total XP`);
    res.json(payouts);
  } catch (err) { next(err); }
});

export default router;
