import { getSupabase } from '../services/supabase.mjs';
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

  const db = getSupabase();

  // Fetch eligible contributions
  const now = new Date().toISOString();
  const { data: contributions, error } = await db
    .from('contributions')
    .select('id, wallet, score, status, max_daily_until')
    .eq('track', 'OSS')
    .in('status', ['ACTIVE', 'MERGED'])
    .or(`max_daily_until.is.null,max_daily_until.gt.${now}`);

  if (error) {
    console.error(`[daily-xp] Query failed: ${error.message}`);
    return;
  }

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
      const { data: todayEvents } = await db
        .from('xp_events')
        .select('id')
        .eq('contribution_id', contrib.id)
        .eq('reason', 'DAILY_ACCUMULATION')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .limit(1);

      if (todayEvents && todayEvents.length > 0) {
        continue; // Already awarded today
      }

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
