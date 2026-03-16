import { query, queryOne, queryAll } from './db.mjs';

const ONE_TIME_REASONS = ['INITIAL_AWARD', 'MERGE_BONUS', 'VIRAL_BONUS', 'RESHARE_BONUS'];
const REFERRAL_BONUS_PCT = 0.05; // 5% referral bonus

/**
 * Award XP to a participant.
 * Inserts an xp_event and updates participant total_xp.
 * One-time reasons are idempotent per (reason, contribution_id).
 */
export async function awardXP(wallet, xpDelta, reason, contributionId = null) {
  if (ONE_TIME_REASONS.includes(reason) && contributionId) {
    const existing = await queryOne(
      `SELECT id FROM xp_events WHERE wallet = $1 AND reason = $2 AND contribution_id = $3 LIMIT 1`,
      [wallet, reason, contributionId]
    );
    if (existing) {
      console.log(`[xp] Skipped duplicate ${reason} for ${wallet} on ${contributionId}`);
      return null;
    }
  }

  const event = await queryOne(
    `INSERT INTO xp_events (wallet, xp_delta, reason, contribution_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [wallet, xpDelta, reason, contributionId]
  );

  // Recalculate total from all xp_events for this wallet (safe, avoids drift)
  const sumRow = await queryOne(
    `SELECT COALESCE(SUM(xp_delta), 0) AS total FROM xp_events WHERE wallet = $1`,
    [wallet]
  );
  const total = sumRow ? parseInt(sumRow.total, 10) : 0;

  await query(
    `UPDATE participants SET total_xp = $1, updated_at = NOW() WHERE wallet = $2`,
    [total, wallet]
  );

  console.log(`[xp] Awarded ${xpDelta} XP (${reason}) to ${wallet}`);

  // Award referral bonus to referrer (skip if this IS a referral bonus to avoid recursion)
  if (reason !== 'REFERRAL_BONUS' && xpDelta > 0) {
    try {
      await awardReferralBonus(wallet, xpDelta, contributionId);
    } catch (refErr) {
      console.warn(`[xp] Referral bonus failed for ${wallet}: ${refErr.message}`);
    }
  }

  return event;
}

/**
 * Award 5% referral bonus to a user's referrer.
 * Idempotent per contribution_id (valid FK to contributions table).
 * For non-contribution XP, contribution_id is NULL.
 */
async function awardReferralBonus(wallet, xpDelta, contributionId) {
  // Look up the user and their referrer
  const user = await queryOne(
    `SELECT u.referred_by FROM users u
     JOIN participants p ON p.user_id = u.id
     WHERE p.wallet = $1`,
    [wallet]
  );
  if (!user || !user.referred_by) return null;

  // Find the referrer's participant wallet
  const referrer = await queryOne(
    `SELECT p.wallet FROM participants p
     JOIN users u ON u.id = p.user_id
     WHERE u.id = $1`,
    [user.referred_by]
  );
  if (!referrer) return null;

  const bonus = Math.max(1, Math.floor(xpDelta * REFERRAL_BONUS_PCT));

  // Idempotency: if contribution-based, check if bonus already given for this contribution
  if (contributionId) {
    const existing = await queryOne(
      `SELECT id FROM xp_events
       WHERE wallet = $1 AND reason = 'REFERRAL_BONUS' AND contribution_id = $2 LIMIT 1`,
      [referrer.wallet, contributionId]
    );
    if (existing) return null;
  }

  const bonusEvent = await queryOne(
    `INSERT INTO xp_events (wallet, xp_delta, reason, contribution_id)
     VALUES ($1, $2, 'REFERRAL_BONUS', $3) RETURNING *`,
    [referrer.wallet, bonus, contributionId || null]
  );

  // Recalculate referrer total
  const sumRow = await queryOne(
    `SELECT COALESCE(SUM(xp_delta), 0) AS total FROM xp_events WHERE wallet = $1`,
    [referrer.wallet]
  );
  const total = sumRow ? parseInt(sumRow.total, 10) : 0;

  await query(
    `UPDATE participants SET total_xp = $1, updated_at = NOW() WHERE wallet = $2`,
    [total, referrer.wallet]
  );

  console.log(`[xp] Referral bonus: ${bonus} XP to ${referrer.wallet} (from ${wallet})`);
  return bonusEvent;
}

/**
 * Get current XP for a wallet.
 */
export async function getXP(wallet) {
  const row = await queryOne(
    `SELECT total_xp FROM participants WHERE wallet = $1`,
    [wallet]
  );
  if (!row) throw new Error(`[xp] Participant not found: ${wallet}`);
  return row.total_xp;
}

/**
 * Get the daily accumulation rate for a given score.
 */
export function getDailyRate(score) {
  if (score >= 90) return parseInt(process.env.OSS_DAILY_90 || '200', 10);
  if (score >= 80) return parseInt(process.env.OSS_DAILY_80 || '150', 10);
  if (score >= 70) return parseInt(process.env.OSS_DAILY_70 || '100', 10);
  return 0;
}

/**
 * Get the initial XP award for a given score and track.
 */
export function getInitialXP(score, track) {
  if (score < parseInt(process.env.SCORE_THRESHOLD || '70', 10)) return 0;

  if (track === 'OSS') {
    if (score >= 90) return parseInt(process.env.OSS_XP_90 || '2000', 10);
    if (score >= 80) return parseInt(process.env.OSS_XP_80 || '1200', 10);
    return parseInt(process.env.OSS_XP_70 || '700', 10);
  }

  if (track === 'CONTENT') {
    if (score >= 90) return parseInt(process.env.CONTENT_XP_90 || '1200', 10);
    if (score >= 80) return parseInt(process.env.CONTENT_XP_80 || '800', 10);
    return parseInt(process.env.CONTENT_XP_70 || '500', 10);
  }

  return 0;
}

/**
 * Get paginated leaderboard with rank, estimated USDC, and rank change.
 */
export async function getLeaderboard(page = 1, limit = 50, track = null) {
  const offset = (page - 1) * limit;

  // Build dynamic WHERE for track filter
  let trackFilter = '';
  const params = [limit, offset];
  if (track && track !== 'BOTH') {
    trackFilter = `AND (track = $3 OR track = 'BOTH')`;
    params.push(track);
  }

  const participants = await queryAll(
    `SELECT p.wallet, p.github_handle, p.x_handle, p.display_name, p.track, p.total_xp, p.updated_at,
            u.referral_code
     FROM participants p
     LEFT JOIN users u ON u.id = p.user_id
     WHERE p.total_xp > 0 ${trackFilter}
     ORDER BY p.total_xp DESC LIMIT $1 OFFSET $2`,
    params
  );

  // Total count
  const countParams = track && track !== 'BOTH' ? [track] : [];
  const countRow = await queryOne(
    `SELECT COUNT(*) AS cnt FROM participants WHERE total_xp > 0 ${
      track && track !== 'BOTH' ? `AND (track = $1 OR track = 'BOTH')` : ''
    }`,
    countParams
  );
  const count = parseInt(countRow?.cnt || '0', 10);

  // Global total XP
  const totalXPRow = await queryOne(
    `SELECT COALESCE(SUM(total_xp), 0) AS total FROM participants WHERE total_xp > 0`
  );
  const totalXP = parseInt(totalXPRow?.total || '0', 10);

  const poolUSDC = parseFloat(process.env.CAMPAIGN_POOL_USDC || '500');

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const snapshots = await queryAll(
    `SELECT wallet, rank_at_snapshot FROM daily_snapshots WHERE snapshot_date = $1`,
    [yesterday]
  );

  const snapshotMap = {};
  for (const s of snapshots) {
    snapshotMap[s.wallet] = s.rank_at_snapshot;
  }

  const wallets = participants.map(p => p.wallet);
  let contributionCounts = {};
  if (wallets.length > 0) {
    const placeholders = wallets.map((_, i) => `$${i + 1}`).join(',');
    const contribs = await queryAll(
      `SELECT wallet FROM contributions
       WHERE wallet IN (${placeholders}) AND status NOT IN ('REJECTED','DELETED')`,
      wallets
    );
    for (const c of contribs) {
      contributionCounts[c.wallet] = (contributionCounts[c.wallet] || 0) + 1;
    }
  }

  const entries = participants.map((p, i) => {
    const rank = offset + i + 1;
    const yesterdayRank = snapshotMap[p.wallet];
    const rankChange = yesterdayRank != null ? yesterdayRank - rank : 0;
    const estimatedUSDC = totalXP > 0
      ? Math.round((p.total_xp / totalXP) * poolUSDC * 100) / 100
      : 0;

    return {
      rank,
      wallet: p.wallet,
      displayName: p.display_name || p.github_handle || p.x_handle || p.wallet,
      github_handle: p.github_handle || null,
      x_handle: p.x_handle || null,
      track: p.track,
      totalXP: p.total_xp,
      contributions: contributionCounts[p.wallet] || 0,
      estimatedUSDC,
      rankChange,
      lastActive: p.updated_at,
    };
  });

  const campaignEnd = process.env.CAMPAIGN_END_DATE;
  const campaignEndsIn = campaignEnd
    ? Math.max(0, Math.ceil((new Date(campaignEnd) - Date.now()) / 86400000))
    : null;

  return {
    totalParticipants: count,
    totalXP,
    poolUSDC,
    campaignEndsIn,
    page,
    limit,
    entries,
  };
}

/**
 * Get full stats for a single participant.
 */
export async function getParticipantStats(wallet) {
  const participant = await queryOne(
    `SELECT * FROM participants WHERE wallet = $1`, [wallet]
  );
  if (!participant) throw new Error(`[xp] Participant not found: ${wallet}`);

  const contributions = await queryAll(
    `SELECT * FROM contributions WHERE wallet = $1 ORDER BY submitted_at DESC`, [wallet]
  );

  const xpEvents = await queryAll(
    `SELECT * FROM xp_events WHERE wallet = $1 ORDER BY created_at DESC LIMIT 100`, [wallet]
  );

  const totalXPRow = await queryOne(
    `SELECT COALESCE(SUM(total_xp), 0) AS total FROM participants WHERE total_xp > 0`
  );
  const totalXP = parseInt(totalXPRow?.total || '0', 10);

  const poolUSDC = parseFloat(process.env.CAMPAIGN_POOL_USDC || '500');
  const estimatedUSDC = totalXP > 0
    ? Math.round((participant.total_xp / totalXP) * poolUSDC * 100) / 100
    : 0;

  // Calculate rank
  const rankRow = await queryOne(
    `SELECT COUNT(*) + 1 AS rank FROM participants WHERE total_xp > $1`,
    [participant.total_xp]
  );
  const rank = parseInt(rankRow?.rank || '0', 10);

  const snapshots = await queryAll(
    `SELECT snapshot_date, xp_at_snapshot, rank_at_snapshot
     FROM daily_snapshots WHERE wallet = $1
     ORDER BY snapshot_date DESC LIMIT 21`,
    [wallet]
  );

  return {
    participant,
    rank: rank || null,
    estimatedUSDC,
    contributions: contributions || [],
    xpEvents: xpEvents || [],
    xpHistory: (snapshots || []).reverse(),
  };
}

/**
 * Calculate payout for a single wallet.
 */
export async function calculatePayout(wallet) {
  const participant = await queryOne(
    `SELECT total_xp FROM participants WHERE wallet = $1`, [wallet]
  );
  if (!participant) throw new Error(`[xp] Participant not found: ${wallet}`);

  const totalXPRow = await queryOne(
    `SELECT COALESCE(SUM(total_xp), 0) AS total FROM participants WHERE total_xp > 0`
  );
  const totalXP = parseInt(totalXPRow?.total || '0', 10);

  const poolUSDC = parseFloat(process.env.CAMPAIGN_POOL_USDC || '500');
  const payout = totalXP > 0
    ? Math.round((participant.total_xp / totalXP) * poolUSDC * 100) / 100
    : 0;

  return {
    wallet,
    totalXP: participant.total_xp,
    globalTotalXP: totalXP,
    sharePct: totalXP > 0
      ? Math.round((participant.total_xp / totalXP) * 10000) / 100
      : 0,
    estimatedUSDC: payout,
  };
}

/**
 * Calculate full payout table for all participants (admin).
 */
export async function calculateAllPayouts() {
  const participants = await queryAll(
    `SELECT wallet, display_name, github_handle, x_handle, track, total_xp
     FROM participants WHERE total_xp > 0 ORDER BY total_xp DESC`
  );

  const totalXP = participants.reduce((sum, p) => sum + p.total_xp, 0);
  const poolUSDC = parseFloat(process.env.CAMPAIGN_POOL_USDC || '500');

  const payouts = participants.map((p, i) => ({
    rank: i + 1,
    wallet: p.wallet,
    displayName: p.display_name || p.github_handle || p.x_handle || p.wallet,
    track: p.track,
    totalXP: p.total_xp,
    sharePct: Math.round((p.total_xp / totalXP) * 10000) / 100,
    estimatedUSDC: Math.round((p.total_xp / totalXP) * poolUSDC * 100) / 100,
  }));

  return {
    campaignPool: poolUSDC,
    totalXP,
    totalParticipants: participants.length,
    generatedAt: new Date().toISOString(),
    payouts,
  };
}
