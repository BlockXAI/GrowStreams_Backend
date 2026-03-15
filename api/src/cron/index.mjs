import cron from 'node-cron';
import { runDailyXP } from './daily-xp.mjs';
import { runSnapshot } from './leaderboard-snapshot.mjs';
import { runReevaluate } from './x-reevaluate.mjs';

export function initCrons() {
  // Daily XP accumulation — midnight UTC
  cron.schedule('0 0 * * *', async () => {
    try {
      await runDailyXP();
    } catch (err) {
      console.error(`[cron] daily-xp failed: ${err.message}`);
    }
  }, { timezone: 'UTC' });

  // Leaderboard snapshot — 00:05 UTC (after daily XP)
  cron.schedule('5 0 * * *', async () => {
    try {
      await runSnapshot();
    } catch (err) {
      console.error(`[cron] snapshot failed: ${err.message}`);
    }
  }, { timezone: 'UTC' });

  // X tweet re-evaluation — every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      await runReevaluate();
    } catch (err) {
      console.error(`[cron] x-reevaluate failed: ${err.message}`);
    }
  }, { timezone: 'UTC' });

  console.log('[cron] Campaign jobs scheduled:');
  console.log('[cron]   daily-xp:    0 0 * * *   (midnight UTC)');
  console.log('[cron]   snapshot:    5 0 * * *   (00:05 UTC)');
  console.log('[cron]   x-reeval:    0 */6 * * * (every 6h)');
}
