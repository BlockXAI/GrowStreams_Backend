import { getSupabase } from '../services/supabase.mjs';

/**
 * Leaderboard snapshot — captures daily rank positions.
 * Runs at 00:05 UTC: '5 0 * * *' (5 min after daily-xp)
 *
 * Upserts into daily_snapshots with current XP totals and ranks.
 */
export async function runSnapshot() {
  const startTime = Date.now();
  console.log('[snapshot] Starting leaderboard snapshot...');

  const db = getSupabase();
  const today = new Date().toISOString().split('T')[0];

  // Fetch all participants with XP, sorted by total_xp desc
  const { data: participants, error } = await db
    .from('participants')
    .select('wallet, total_xp')
    .gt('total_xp', 0)
    .order('total_xp', { ascending: false });

  if (error) {
    console.error(`[snapshot] Query failed: ${error.message}`);
    return;
  }

  if (!participants || participants.length === 0) {
    console.log('[snapshot] No participants with XP found');
    return;
  }

  // Build snapshot rows with rank
  const rows = participants.map((p, i) => ({
    snapshot_date: today,
    wallet: p.wallet,
    xp_at_snapshot: p.total_xp,
    rank_at_snapshot: i + 1,
  }));

  // Upsert in batches of 100
  const batchSize = 100;
  let upserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error: upsertErr } = await db
      .from('daily_snapshots')
      .upsert(batch, { onConflict: 'snapshot_date,wallet' });

    if (upsertErr) {
      console.error(`[snapshot] Upsert batch failed: ${upsertErr.message}`);
    } else {
      upserted += batch.length;
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`[snapshot] Complete: ${upserted} participants ranked (${elapsed}ms)`);
}
