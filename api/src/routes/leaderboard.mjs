import { Router } from 'express';
import { queryOne } from '../services/db.mjs';
import { getLeaderboard, getParticipantStats } from '../services/xp-service.mjs';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/leaderboard
// ---------------------------------------------------------------------------
router.get('/', async (req, res, next) => {
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
// GET /api/leaderboard/stats  (MUST be before /:wallet)
// ---------------------------------------------------------------------------
router.get('/stats', async (req, res, next) => {
  try {
    // Total participants with XP > 0
    const pRow = await queryOne(
      `SELECT COUNT(*) AS cnt FROM participants WHERE total_xp > 0`
    );
    const totalParticipants = parseInt(pRow?.cnt || '0', 10);

    // Total XP
    const xpRow = await queryOne(
      `SELECT COALESCE(SUM(total_xp), 0) AS total FROM participants WHERE total_xp > 0`
    );
    const totalXP = parseInt(xpRow?.total || '0', 10);

    // Total contributions (non-rejected/deleted)
    const cRow = await queryOne(
      `SELECT COUNT(*) AS cnt FROM contributions WHERE status NOT IN ('REJECTED','DELETED')`
    );
    const totalContributions = parseInt(cRow?.cnt || '0', 10);

    // OSS contributions
    const ossRow = await queryOne(
      `SELECT COUNT(*) AS cnt FROM contributions WHERE track = 'OSS' AND status NOT IN ('REJECTED','DELETED')`
    );
    const ossContributions = parseInt(ossRow?.cnt || '0', 10);

    // Content contributions
    const contentRow = await queryOne(
      `SELECT COUNT(*) AS cnt FROM contributions WHERE track = 'CONTENT' AND status NOT IN ('REJECTED','DELETED')`
    );
    const contentContributions = parseInt(contentRow?.cnt || '0', 10);

    // Top contributor
    const topData = await queryOne(
      `SELECT wallet, display_name, github_handle, x_handle, total_xp, track
       FROM participants WHERE total_xp > 0 ORDER BY total_xp DESC LIMIT 1`
    );

    const topContributor = topData ? {
      wallet: topData.wallet,
      displayName: topData.display_name || topData.github_handle || topData.x_handle || topData.wallet,
      totalXP: topData.total_xp,
      track: topData.track,
    } : null;

    // Campaign days remaining
    const campaignEnd = process.env.CAMPAIGN_END_DATE;
    const campaignDaysRemaining = campaignEnd
      ? Math.max(0, Math.ceil((new Date(campaignEnd) - Date.now()) / 86400000))
      : null;

    const poolUSDC = parseFloat(process.env.CAMPAIGN_POOL_USDC || '500');

    res.json({
      totalParticipants,
      totalXP,
      totalContributions,
      ossContributions,
      contentContributions,
      topContributor,
      campaignDaysRemaining,
      poolUSDC,
    });
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// GET /api/leaderboard/:wallet
// ---------------------------------------------------------------------------
router.get('/:wallet', async (req, res, next) => {
  try {
    const { wallet } = req.params;
    const stats = await getParticipantStats(wallet);
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
