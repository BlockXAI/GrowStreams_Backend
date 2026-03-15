import { getSupabase } from '../services/supabase.mjs';
import { reevaluateTweet } from '../services/x-agent.mjs';

/**
 * X/Twitter re-evaluation — checks engagement updates on recent tweets.
 * Runs every 6 hours: '0 */6 * * *'
 *
 * Queries CONTENT contributions that are:
 * - status = 'ACTIVE'
 * - submitted within the last 24 hours
 *
 * Awards viral/reshare/engagement bonuses as thresholds are crossed.
 */
export async function runReevaluate() {
  const startTime = Date.now();
  console.log('[x-reeval] Starting tweet re-evaluation...');

  const db = getSupabase();

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: contributions, error } = await db
    .from('contributions')
    .select('id, tweet_id, wallet')
    .eq('track', 'CONTENT')
    .eq('status', 'ACTIVE')
    .gte('submitted_at', cutoff);

  if (error) {
    console.error(`[x-reeval] Query failed: ${error.message}`);
    return;
  }

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
