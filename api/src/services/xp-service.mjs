import { getSupabase } from './supabase.mjs';

const ONE_TIME_REASONS = ['INITIAL_AWARD', 'MERGE_BONUS', 'VIRAL_BONUS', 'RESHARE_BONUS'];

/**
 * Award XP to a participant.
 * Inserts an xp_event and updates participant total_xp.
 * One-time reasons are idempotent per (reason, contribution_id).
 */
export async function awardXP(wallet, xpDelta, reason, contributionId = null) {
  const db = getSupabase();

  if (ONE_TIME_REASONS.includes(reason) && contributionId) {
    const { data: existing } = await db
      .from('xp_events')
      .select('id')
      .eq('wallet', wallet)
      .eq('reason', reason)
      .eq('contribution_id', contributionId)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`[xp] Skipped duplicate ${reason} for ${wallet} on ${contributionId}`);
      return null;
    }
  }

  const { data: event, error: eventErr } = await db
    .from('xp_events')
    .insert({
      wallet,
      xp_delta: xpDelta,
      reason,
      contribution_id: contributionId,
    })
    .select()
    .single();

  if (eventErr) throw new Error(`[xp] Failed to insert xp_event: ${eventErr.message}`);

  // Recalculate total from all xp_events for this wallet (safe, avoids drift)
  const { data: sumData } = await db
    .from('xp_events')
    .select('xp_delta')
    .eq('wallet', wallet);

  const total = sumData ? sumData.reduce((sum, row) => sum + row.xp_delta, 0) : 0;

  const { error: updateErr } = await db
    .from('participants')
    .update({ total_xp: total, updated_at: new Date().toISOString() })
    .eq('wallet', wallet);

  if (updateErr) {
    console.error(`[xp] Failed to update total_xp for ${wallet}: ${updateErr.message}`);
  }

  console.log(`[xp] Awarded ${xpDelta} XP (${reason}) to ${wallet}`);
  return event;
}

/**
 * Get current XP for a wallet.
 */
export async function getXP(wallet) {
  const db = getSupabase();
  const { data, error } = await db
    .from('participants')
    .select('total_xp')
    .eq('wallet', wallet)
    .single();

  if (error) throw new Error(`[xp] Participant not found: ${wallet}`);
  return data.total_xp;
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
  const db = getSupabase();
  const offset = (page - 1) * limit;

  let query = db
    .from('participants')
    .select('wallet, github_handle, x_handle, display_name, track, total_xp, updated_at', { count: 'exact' })
    .gt('total_xp', 0)
    .order('total_xp', { ascending: false })
    .range(offset, offset + limit - 1);

  if (track && track !== 'BOTH') {
    query = query.or(`track.eq.${track},track.eq.BOTH`);
  }

  const { data: participants, error, count } = await query;
  if (error) throw new Error(`[xp] Leaderboard query failed: ${error.message}`);

  const { data: totalXPData } = await db
    .from('participants')
    .select('total_xp')
    .gt('total_xp', 0);

  const totalXP = totalXPData
    ? totalXPData.reduce((sum, p) => sum + p.total_xp, 0)
    : 0;

  const poolUSDC = parseFloat(process.env.CAMPAIGN_POOL_USDC || '500');

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const { data: snapshots } = await db
    .from('daily_snapshots')
    .select('wallet, rank_at_snapshot')
    .eq('snapshot_date', yesterday);

  const snapshotMap = {};
  if (snapshots) {
    for (const s of snapshots) {
      snapshotMap[s.wallet] = s.rank_at_snapshot;
    }
  }

  const wallets = participants.map(p => p.wallet);
  let contributionCounts = {};
  if (wallets.length > 0) {
    const { data: contribs } = await db
      .from('contributions')
      .select('wallet')
      .in('wallet', wallets)
      .not('status', 'in', '("REJECTED","DELETED")');

    if (contribs) {
      for (const c of contribs) {
        contributionCounts[c.wallet] = (contributionCounts[c.wallet] || 0) + 1;
      }
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
  const db = getSupabase();

  const { data: participant, error: pErr } = await db
    .from('participants')
    .select('*')
    .eq('wallet', wallet)
    .single();

  if (pErr) throw new Error(`[xp] Participant not found: ${wallet}`);

  const { data: contributions } = await db
    .from('contributions')
    .select('*')
    .eq('wallet', wallet)
    .order('submitted_at', { ascending: false });

  const { data: xpEvents } = await db
    .from('xp_events')
    .select('*')
    .eq('wallet', wallet)
    .order('created_at', { ascending: false })
    .limit(100);

  const { data: totalXPData } = await db
    .from('participants')
    .select('total_xp')
    .gt('total_xp', 0);

  const totalXP = totalXPData
    ? totalXPData.reduce((sum, p) => sum + p.total_xp, 0)
    : 0;

  const poolUSDC = parseFloat(process.env.CAMPAIGN_POOL_USDC || '500');
  const estimatedUSDC = totalXP > 0
    ? Math.round((participant.total_xp / totalXP) * poolUSDC * 100) / 100
    : 0;

  const sorted = (totalXPData || [])
    .map(p => p.total_xp)
    .sort((a, b) => b - a);
  const rank = sorted.indexOf(participant.total_xp) + 1;

  const { data: snapshots } = await db
    .from('daily_snapshots')
    .select('snapshot_date, xp_at_snapshot, rank_at_snapshot')
    .eq('wallet', wallet)
    .order('snapshot_date', { ascending: false })
    .limit(21);

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
  const db = getSupabase();

  const { data: participant } = await db
    .from('participants')
    .select('total_xp')
    .eq('wallet', wallet)
    .single();

  if (!participant) throw new Error(`[xp] Participant not found: ${wallet}`);

  const { data: allParticipants } = await db
    .from('participants')
    .select('total_xp')
    .gt('total_xp', 0);

  const totalXP = allParticipants
    ? allParticipants.reduce((sum, p) => sum + p.total_xp, 0)
    : 0;

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
  const db = getSupabase();

  const { data: participants, error } = await db
    .from('participants')
    .select('wallet, display_name, github_handle, x_handle, track, total_xp')
    .gt('total_xp', 0)
    .order('total_xp', { ascending: false });

  if (error) throw new Error(`[xp] Payout query failed: ${error.message}`);

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
