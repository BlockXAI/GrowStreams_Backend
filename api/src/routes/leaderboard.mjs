import { Router } from 'express';
import { getSupabase } from '../services/supabase.mjs';
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
    const db = getSupabase();

    // Total participants with XP > 0
    const { count: totalParticipants } = await db
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .gt('total_xp', 0);

    // Total XP
    const { data: xpData } = await db
      .from('participants')
      .select('total_xp')
      .gt('total_xp', 0);

    const totalXP = xpData ? xpData.reduce((sum, p) => sum + p.total_xp, 0) : 0;

    // Total contributions (non-rejected/deleted)
    const { count: totalContributions } = await db
      .from('contributions')
      .select('*', { count: 'exact', head: true })
      .not('status', 'in', '("REJECTED","DELETED")');

    // OSS contributions
    const { count: ossContributions } = await db
      .from('contributions')
      .select('*', { count: 'exact', head: true })
      .eq('track', 'OSS')
      .not('status', 'in', '("REJECTED","DELETED")');

    // Content contributions
    const { count: contentContributions } = await db
      .from('contributions')
      .select('*', { count: 'exact', head: true })
      .eq('track', 'CONTENT')
      .not('status', 'in', '("REJECTED","DELETED")');

    // Top contributor
    const { data: topData } = await db
      .from('participants')
      .select('wallet, display_name, github_handle, x_handle, total_xp, track')
      .gt('total_xp', 0)
      .order('total_xp', { ascending: false })
      .limit(1)
      .single();

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
      totalParticipants: totalParticipants || 0,
      totalXP,
      totalContributions: totalContributions || 0,
      ossContributions: ossContributions || 0,
      contentContributions: contentContributions || 0,
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
