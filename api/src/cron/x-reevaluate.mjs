import { queryAll } from '../services/db.mjs';
import { reevaluateTweet } from '../services/x-agent.mjs';

// X/Twitter re-evaluation — checks engagement updates on recent tweets.
// Runs every 6 hours (cron: 0 */6 * * *)
//
// Queries CONTENT contributions that are:
// - status = 'ACTIVE'
// - submitted within the last 24 hours
//
// Awards viral/reshare/engagement bonuses as thresholds are crossed.
export async function runReevaluate() {
  const startTime = Date.now();
  console.log('[x-reeval] Starting tweet re-evaluation...');

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const contributions = await queryAll(
    `SELECT id, tweet_id, wallet FROM contributions
     WHERE track = 'CONTENT' AND status = 'ACTIVE' AND submitted_at >= $1`,
    [cutoff]
  );

  if (!contributions || contributions.length === 0) {
    console.log('[x-reeval] No recent tweets to re-evaluate');
    return;
  }

  let processed = 0;
  let errors = 0;

  for (const contrib of contributions) {
    try {
      await reevaluateTweet(contrib.id, contrib.tweet_id, contrib.wallet);
      processed++;
    } catch (err) {
      console.error(`[x-reeval] Failed for tweet ${contrib.tweet_id}: ${err.message}`);
      errors++;
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`[x-reeval] Complete: ${processed} tweets re-evaluated, ${errors} errors (${elapsed}ms)`);
}
