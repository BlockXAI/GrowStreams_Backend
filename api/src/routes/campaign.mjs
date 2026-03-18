import { Router } from 'express';
import { queryOne } from '../services/db.mjs';
import {
  awardXP,
  getLeaderboard,
  getParticipantStats,
  calculateAllPayouts,
} from '../services/xp-service.mjs';
import { createUser, getUserByWallet } from '../services/user-service.mjs';

const router = Router();

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter: max 5 registrations per IP per minute
// ---------------------------------------------------------------------------
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// Periodically clean stale entries (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW * 2) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// ---------------------------------------------------------------------------
// POST /api/campaign/register
// ---------------------------------------------------------------------------
router.post('/register', async (req, res, next) => {
  try {
    // Rate limit check
    const clientIP = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({ error: 'Too many registration attempts. Try again in 1 minute.' });
    }

    const { wallet, github_handle, x_handle, track, referral_code } = req.body;

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

    // Ensure the user exists (auto-create if needed)
    let user = await getUserByWallet(wallet);
    if (!user) {
      try {
        user = await createUser(wallet, github_handle, x_handle, referral_code || null);
      } catch (userErr) {
        if (userErr.status === 409) {
          user = userErr.user; // already exists, reuse
        } else if (userErr.status === 400) {
          return res.status(400).json({ error: userErr.message });
        } else {
          throw userErr;
        }
      }
    }

    const display_name = github_handle || x_handle || wallet.slice(0, 12);

    let data;
    try {
      data = await queryOne(
        `INSERT INTO participants (wallet, github_handle, x_handle, display_name, track, user_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [wallet, github_handle || null, x_handle || null, display_name, track, user ? user.id : null]
      );
    } catch (dbErr) {
      if (dbErr.code === '23505') {
        return res.status(409).json({ error: 'Participant already registered or handle already taken' });
      }
      throw dbErr;
    }

    // Award join bonus so new users appear on leaderboard immediately
    const JOIN_BONUS = parseInt(process.env.JOIN_BONUS_XP || '10', 10);
    if (JOIN_BONUS > 0) {
      try {
        await awardXP(wallet, JOIN_BONUS, 'JOIN_BONUS');
        console.log(`[campaign] Join bonus: +${JOIN_BONUS} XP to ${wallet}`);
      } catch (bonusErr) {
        console.warn(`[campaign] Join bonus failed for ${wallet}: ${bonusErr.message}`);
      }
    }

    console.log(`[campaign] Registered ${wallet} (${track}) -> user ${user?.id || 'none'}`);
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
// GET /api/campaign/leaderboard (convenience proxy to /api/leaderboard)
// ---------------------------------------------------------------------------
router.get('/leaderboard', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const track = req.query.track || null;

    if (track && !['OSS', 'CONTENT', 'BOTH'].includes(track)) {
      return res.status(400).json({ error: 'Invalid track. Must be OSS, CONTENT, or BOTH' });
    }

    const result = await getLeaderboard(page, limit, track);
    res.json(result);
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

// ---------------------------------------------------------------------------
// POST /api/campaign/award-xp (admin only — for testing)
// ---------------------------------------------------------------------------
router.post('/award-xp', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret) {
      return res.status(500).json({ error: 'ADMIN_SECRET not configured on server' });
    }
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization header: Bearer <ADMIN_SECRET>' });
    }
    if (authHeader.slice(7) !== adminSecret) {
      return res.status(401).json({ error: 'Invalid admin secret' });
    }

    const { wallet, xp, reason } = req.body;
    if (!wallet || !xp || !reason) {
      return res.status(400).json({ error: 'Missing: wallet, xp, reason' });
    }

    const event = await awardXP(wallet, parseInt(xp, 10), reason);
    res.json({ success: true, event });
  } catch (err) { next(err); }
});

// POST /api/campaign/poll-tweets — manually trigger tweet poll (admin)
router.post('/poll-tweets', async (req, res, next) => {
  try {
    const { pollRecentTweets, pollRegisteredUsers } = await import('../services/x-agent.mjs');
    await pollRecentTweets();
    await pollRegisteredUsers();
    res.json({ success: true, message: 'Poll completed (search + user timelines)' });
  } catch (err) { next(err); }
});

export default router;
