import { queryAll, queryOne } from '../services/db.mjs';
import { awardXP, getDailyRate } from '../services/xp-service.mjs';

/**
 * Daily XP accumulation for active OSS contributions.
 * Runs at midnight UTC: '0 0 * * *'
 *
 * Awards daily XP to contributions that are:
 * - status IN ('ACTIVE', 'MERGED')
 * - track = 'OSS'
 * - within 14-day cap (max_daily_until > NOW or null)
 * - not already awarded today
 */
export async function runDailyXP() {
  const startTime = Date.now();
  console.log('[daily-xp] Starting daily XP accumulation...');

  const now = new Date().toISOString();

  // Fetch eligible contributions
  const contributions = await queryAll(
    `SELECT id, wallet, score, status, max_daily_until
     FROM contributions
     WHERE track = 'OSS'
       AND status IN ('ACTIVE', 'MERGED')
       AND (max_daily_until IS NULL OR max_daily_until > $1)`,
    [now]
  );

  if (!contributions || contributions.length === 0) {
    console.log('[daily-xp] No eligible contributions found');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  let totalAwarded = 0;
  let contributionsProcessed = 0;

  for (const contrib of contributions) {
    try {
      // Check if already awarded today for this contribution
      const todayEvent = await queryOne(
        `SELECT id FROM xp_events
         WHERE contribution_id = $1 AND reason = 'DAILY_ACCUMULATION'
           AND created_at >= $2 AND created_at < $3
         LIMIT 1`,
        [contrib.id, `${today}T00:00:00.000Z`, `${today}T23:59:59.999Z`]
      );

      if (todayEvent) continue; // Already awarded today

      const dailyRate = getDailyRate(contrib.score);
      if (dailyRate <= 0) continue;

      await awardXP(contrib.wallet, dailyRate, 'DAILY_ACCUMULATION', contrib.id);
      totalAwarded += dailyRate;
      contributionsProcessed++;
    } catch (err) {
      console.error(`[daily-xp] Failed for contribution ${contrib.id}: ${err.message}`);
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`[daily-xp] Complete: ${totalAwarded} XP awarded across ${contributionsProcessed} contributions (${elapsed}ms)`);
}
