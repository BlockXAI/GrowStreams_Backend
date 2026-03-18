import { queryAll, query } from '../services/db.mjs';

/**
 * Leaderboard snapshot — captures daily rank positions.
 * Runs at 00:05 UTC: '5 0 * * *' (5 min after daily-xp)
 *
 * Upserts into daily_snapshots with current XP totals and ranks.
 */
export async function runSnapshot() {
  const startTime = Date.now();
  console.log('[snapshot] Starting leaderboard snapshot...');

  const today = new Date().toISOString().split('T')[0];

  // Fetch all participants with XP, sorted by total_xp desc
  const participants = await queryAll(
    `SELECT wallet, total_xp FROM participants WHERE total_xp > 0 ORDER BY total_xp DESC`
  );

  if (!participants || participants.length === 0) {
    console.log('[snapshot] No participants with XP found');
    return;
  }

  // Upsert each snapshot row
  let upserted = 0;

  for (let i = 0; i < participants.length; i++) {
    const p = participants[i];
    try {
      await query(
        `INSERT INTO daily_snapshots (snapshot_date, wallet, xp_at_snapshot, rank_at_snapshot)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (snapshot_date, wallet)
         DO UPDATE SET xp_at_snapshot = $3, rank_at_snapshot = $4`,
        [today, p.wallet, p.total_xp, i + 1]
      );
      upserted++;
    } catch (err) {
      console.error(`[snapshot] Upsert failed for ${p.wallet}: ${err.message}`);
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`[snapshot] Complete: ${upserted} participants ranked (${elapsed}ms)`);
}
