import { TwitterApi } from 'twitter-api-v2';
import { scoreContent } from './llm-scorer.mjs';
import { awardXP, getInitialXP } from './xp-service.mjs';
import { queryOne, query } from './db.mjs';

let readClient = null;
let writeClient = null;

function getReadClient() {
  if (readClient) return readClient;

  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) {
    throw new Error('[x-agent] Missing environment variable: X_BEARER_TOKEN');
  }

  readClient = new TwitterApi(bearerToken);
  return readClient;
}

function getWriteClient() {
  if (writeClient) return writeClient;

  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessSecret = process.env.X_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    throw new Error('[x-agent] Missing X API write credentials (X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET)');
  }

  writeClient = new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken,
    accessSecret,
  });

  return writeClient;
}

// Scheduled re-evaluation timers (in-memory, cleared on restart)
const reevalTimers = new Map();

function isCampaignActive() {
  const start = process.env.CAMPAIGN_START_DATE;
  const end = process.env.CAMPAIGN_END_DATE;
  const now = new Date();

  if (start && new Date(start) > now) return false;
  if (end && new Date(end) < now) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Lookup participant by X handle
// ---------------------------------------------------------------------------
async function findParticipantByX(xHandle) {
  // Normalize handle (remove leading @)
  const handle = xHandle.startsWith('@') ? xHandle.slice(1) : xHandle;
  return await queryOne(
    `SELECT * FROM participants WHERE x_handle = $1`,
    [handle]
  );
}

// ---------------------------------------------------------------------------
// Check if tweet already processed
// ---------------------------------------------------------------------------
async function findContributionByTweet(tweetId) {
  return await queryOne(
    `SELECT * FROM contributions WHERE tweet_id = $1 AND track = 'CONTENT'`,
    [tweetId]
  );
}

// ---------------------------------------------------------------------------
// Insert content contribution
// ---------------------------------------------------------------------------
async function insertContribution(wallet, tweetId, score, xpAwarded, status, agentFeedback, agentResponse) {
  const now = new Date().toISOString();
  const data = await queryOne(
    `INSERT INTO contributions
       (wallet, track, external_id, score, xp_awarded, status, agent_feedback, agent_response, tweet_id, submitted_at)
     VALUES ($1, 'CONTENT', $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [wallet, `TWEET#${tweetId}`, score, xpAwarded, status, agentFeedback, JSON.stringify(agentResponse), tweetId, now]
  );
  return data;
}

// ---------------------------------------------------------------------------
// Update contribution
// ---------------------------------------------------------------------------
async function updateContribution(id, updates) {
  const setClauses = [];
  const values = [];
  let idx = 1;
  for (const [key, val] of Object.entries(updates)) {
    setClauses.push(`${key} = $${idx}`);
    values.push(key === 'agent_response' ? JSON.stringify(val) : val);
    idx++;
  }
  setClauses.push(`updated_at = $${idx}`);
  values.push(new Date().toISOString());
  idx++;
  values.push(id);
  await query(
    `UPDATE contributions SET ${setClauses.join(', ')} WHERE id = $${idx}`,
    values
  );
}

// ---------------------------------------------------------------------------
// Calculate engagement velocity
// ---------------------------------------------------------------------------
function calculateEngagementVelocity(likes, retweets, replies, followerCount) {
  if (!followerCount || followerCount === 0) return 0;
  return (likes + retweets * 2 + replies * 1.5) / followerCount;
}

// ---------------------------------------------------------------------------
// Convert engagement velocity to a 0-100 score
// ---------------------------------------------------------------------------
function engagementToScore(velocity) {
  // Velocity ranges: 0-0.01 = low, 0.01-0.05 = medium, 0.05-0.2 = high, 0.2+ = viral
  if (velocity >= 0.2) return 100;
  if (velocity >= 0.1) return 85;
  if (velocity >= 0.05) return 70;
  if (velocity >= 0.02) return 55;
  if (velocity >= 0.01) return 40;
  return 20;
}

// ---------------------------------------------------------------------------
// Get participant rank
// ---------------------------------------------------------------------------
async function getParticipantRank(wallet) {
  const row = await queryOne(
    `SELECT COUNT(*) + 1 AS rank FROM participants WHERE total_xp > (
       SELECT COALESCE(total_xp, 0) FROM participants WHERE wallet = $1
     )`,
    [wallet]
  );
  return row ? parseInt(row.rank, 10) : null;
}

// ---------------------------------------------------------------------------
// Build reply tweet text
// ---------------------------------------------------------------------------
function buildReplyText(score, xpAwarded, rank) {
  let text = `\u{1F916} GrowStreams verified your post!\n\n`;
  text += `Score: ${score} / 100\n`;
  text += `XP: ${xpAwarded}\n`;
  if (rank) text += `\nRank: #${rank}\n`;
  text += `\nLeaderboard:\ngrowstreams.app/leaderboard`;
  return text;
}

// ---------------------------------------------------------------------------
// Reply to a tweet
// ---------------------------------------------------------------------------
async function replyToTweet(tweetId, text) {
  try {
    const client = getWriteClient();
    await client.v2.reply(text, tweetId);
    console.log(`[x-agent] Replied to tweet ${tweetId}`);
  } catch (err) {
    console.error(`[x-agent] Failed to reply to tweet ${tweetId}: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Process a single tweet
// ---------------------------------------------------------------------------
async function processTweet(tweet, authorUsername, authorMetrics) {
  const tweetId = tweet.id;
  const tweetText = tweet.text;

  console.log(`[x-agent] Processing tweet ${tweetId} from @${authorUsername}`);

  if (!isCampaignActive()) {
    console.log(`[x-agent] Campaign not active, skipping tweet ${tweetId}`);
    return;
  }

  // 1. Lookup participant
  const participant = await findParticipantByX(authorUsername);
  if (!participant) {
    console.log(`[x-agent] @${authorUsername} not registered, skipping`);
    return;
  }

  // 2. Check duplicate
  const existing = await findContributionByTweet(tweetId);
  if (existing) {
    console.log(`[x-agent] Tweet ${tweetId} already processed, skipping`);
    return;
  }

  // 3. Anti-gaming: reject extremely short content
  if (!tweetText || tweetText.trim().length < 20) {
    console.log(`[x-agent] Tweet ${tweetId}: content too short (${tweetText?.length || 0} chars), skipping`);
    return;
  }

  // 3b. Extract metrics
  const likes = tweet.public_metrics?.like_count || 0;
  const retweets = tweet.public_metrics?.retweet_count || 0;
  const replies = tweet.public_metrics?.reply_count || 0;
  const followerCount = authorMetrics?.followers_count || 0;

  // 4. Detect thread
  const isThread = tweet.referenced_tweets?.some(
    ref => ref.type === 'replied_to'
  ) && tweet.in_reply_to_user_id === tweet.author_id;
  const threadLength = isThread ? 2 : 1; // Approximate; full thread detection would need conversation lookup

  // 5. Check for media
  const hasMedia = !!(tweet.attachments?.media_keys?.length);

  // 6. Calculate engagement velocity
  const velocity = calculateEngagementVelocity(likes, retweets, replies, followerCount);
  const engagementScore = engagementToScore(velocity);

  // 7. Call LLM scorer (with try/catch)
  let llmResult;
  try {
    llmResult = await scoreContent(
      tweetText, isThread, threadLength, hasMedia,
      { likes, retweets, replies },
      followerCount
    );
  } catch (err) {
    console.error(`[x-agent] LLM scoring failed for tweet ${tweetId}: ${err.message}`);
    return;
  }

  // 8. Combined score: 65% LLM + 35% engagement
  const combinedScore = Math.round(llmResult.score * 0.65 + engagementScore * 0.35);

  const threshold = parseInt(process.env.SCORE_THRESHOLD || '70', 10);

  if (combinedScore >= threshold) {
    let xpAmount = getInitialXP(combinedScore, 'CONTENT');

    // Thread bonus: +30% if thread with 5+ tweets
    if (isThread && threadLength >= 5) {
      xpAmount = Math.round(xpAmount * 1.3);
    }

    const contribution = await insertContribution(
      participant.wallet, tweetId, combinedScore, xpAmount,
      'ACTIVE', llmResult.feedback, {
        ...llmResult,
        combinedScore,
        engagementScore,
        velocity,
      }
    );

    try {
      await awardXP(participant.wallet, xpAmount, 'INITIAL_AWARD', contribution.id);
    } catch (err) {
      console.error(`[x-agent] XP award failed for tweet ${tweetId}: ${err.message}`);
    }

    // Thread bonus as separate event if applicable
    if (isThread && threadLength >= 5) {
      try {
        const threadBonusXP = Math.round(getInitialXP(combinedScore, 'CONTENT') * 0.3);
        await awardXP(participant.wallet, threadBonusXP, 'THREAD_BONUS', contribution.id);
      } catch (err) {
        console.error(`[x-agent] Thread bonus XP failed for tweet ${tweetId}: ${err.message}`);
      }
    }

    const rank = await getParticipantRank(participant.wallet);
    await replyToTweet(tweetId, buildReplyText(combinedScore, xpAmount, rank));

    // Schedule re-evaluations
    scheduleReevaluation(contribution.id, tweetId, participant.wallet, 6 * 60 * 60 * 1000);   // 6h
    scheduleReevaluation(contribution.id, tweetId, participant.wallet, 24 * 60 * 60 * 1000);  // 24h

    console.log(`[x-agent] Tweet ${tweetId}: combinedScore=${combinedScore}, xp=${xpAmount}`);
  } else {
    await insertContribution(
      participant.wallet, tweetId, combinedScore, 0,
      'REJECTED', llmResult.feedback, {
        ...llmResult,
        combinedScore,
        engagementScore,
        velocity,
      }
    );

    console.log(`[x-agent] Tweet ${tweetId}: combinedScore=${combinedScore}, below threshold`);
  }
}

// ---------------------------------------------------------------------------
// Schedule re-evaluation
// ---------------------------------------------------------------------------
function scheduleReevaluation(contributionId, tweetId, wallet, delayMs) {
  const key = `${contributionId}-${delayMs}`;
  if (reevalTimers.has(key)) return;

  const timer = setTimeout(async () => {
    reevalTimers.delete(key);
    try {
      await reevaluateTweet(contributionId, tweetId, wallet);
    } catch (err) {
      console.error(`[x-agent] Re-evaluation failed for ${tweetId}: ${err.message}`);
    }
  }, delayMs);

  reevalTimers.set(key, timer);

  const hours = Math.round(delayMs / 3600000);
  console.log(`[x-agent] Scheduled re-evaluation for tweet ${tweetId} in ${hours}h`);
}

// ---------------------------------------------------------------------------
// Re-evaluate a tweet (called by timer or cron)
// ---------------------------------------------------------------------------
export async function reevaluateTweet(contributionId, tweetId, wallet) {
  console.log(`[x-agent] Re-evaluating tweet ${tweetId}`);

  // Fetch contribution
  const contribution = await queryOne(
    `SELECT * FROM contributions WHERE id = $1`,
    [contributionId]
  );

  if (!contribution || contribution.status !== 'ACTIVE') {
    console.log(`[x-agent] Contribution ${contributionId} not active, skipping re-eval`);
    return;
  }

  // Fetch tweet to check if still exists
  let tweet;
  try {
    const client = getReadClient();
    const { data } = await client.v2.singleTweet(tweetId, {
      'tweet.fields': 'public_metrics,author_id',
    });
    tweet = data;
  } catch (err) {
    // 404 or similar = tweet deleted
    if (err.code === 404 || err.data?.status === 404) {
      await updateContribution(contributionId, { status: 'DELETED' });
      console.log(`[x-agent] Tweet ${tweetId} deleted, status → DELETED`);
      return;
    }
    console.error(`[x-agent] Failed to fetch tweet ${tweetId}: ${err.message}`);
    return;
  }

  const likes = tweet.public_metrics?.like_count || 0;
  const retweets = tweet.public_metrics?.retweet_count || 0;
  const replies = tweet.public_metrics?.reply_count || 0;
  const totalEngagements = likes + retweets + replies;

  // Check for viral bonus (500+ engagements)
  if (totalEngagements >= 500) {
    await awardXP(wallet, 800, 'VIRAL_BONUS', contributionId);
    console.log(`[x-agent] Tweet ${tweetId}: VIRAL_BONUS +800 XP (${totalEngagements} engagements)`);
  }

  // Check for @VaraNetwork retweet
  try {
    const client = getReadClient();
    const { data: retweeters } = await client.v2.tweetRetweetedBy(tweetId, {
      max_results: 100,
    });

    if (retweeters?.data) {
      const varaRetweeted = retweeters.data.some(
        user => user.username?.toLowerCase() === 'varanetwork'
      );

      if (varaRetweeted) {
        await awardXP(wallet, 500, 'RESHARE_BONUS', contributionId);
        console.log(`[x-agent] Tweet ${tweetId}: RESHARE_BONUS +500 XP (@VaraNetwork retweeted)`);
      }
    }
  } catch (err) {
    console.error(`[x-agent] Failed to check retweeters for ${tweetId}: ${err.message}`);
  }

  // Check if engagement score improved significantly
  const oldResponse = contribution.agent_response;
  const followerCount = oldResponse?.followerCount || 1;
  const newVelocity = calculateEngagementVelocity(likes, retweets, replies, followerCount);
  const newEngagementScore = engagementToScore(newVelocity);
  const oldEngagementScore = oldResponse?.engagementScore || 0;

  if (newEngagementScore - oldEngagementScore > 10) {
    const bonusXP = Math.round((newEngagementScore - oldEngagementScore) * 3);
    await awardXP(wallet, bonusXP, 'ENGAGEMENT_BONUS', contributionId);
    console.log(`[x-agent] Tweet ${tweetId}: ENGAGEMENT_BONUS +${bonusXP} XP (engagement improved)`);
  }

  console.log(`[x-agent] Re-evaluation complete for tweet ${tweetId}`);
}

// ---------------------------------------------------------------------------
// Start the filtered stream
// ---------------------------------------------------------------------------
export async function startStream() {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) {
    console.warn('[x-agent] X_BEARER_TOKEN not set, X agent disabled');
    return;
  }

  const client = getReadClient();

  // Set up stream rules
  try {
    // Get existing rules
    const existingRules = await client.v2.streamRules();
    if (existingRules.data?.length) {
      const ids = existingRules.data.map(r => r.id);
      await client.v2.updateStreamRules({ delete: { ids } });
      console.log(`[x-agent] Cleared ${ids.length} existing stream rules`);
    }

    // Add our rule
    await client.v2.updateStreamRules({
      add: [
        { value: '@GrowStreams OR @GrowwStreams OR #GrowStreams -is:retweet lang:en', tag: 'growstreams-mentions' },
      ],
    });
    console.log('[x-agent] Stream rules set');
  } catch (err) {
    console.error(`[x-agent] Failed to set stream rules: ${err.message}`);
    return;
  }

  // Start filtered stream with retry on 503
  const maxStreamAttempts = 2;
  for (let streamAttempt = 1; streamAttempt <= maxStreamAttempts; streamAttempt++) {
    try {
      const stream = await client.v2.searchStream({
        'tweet.fields': 'public_metrics,author_id,referenced_tweets,in_reply_to_user_id,attachments,created_at',
        'user.fields': 'username,public_metrics',
        'expansions': 'author_id,attachments.media_keys',
      });

      // Auto-reconnect on stream errors
      stream.autoReconnect = true;
      stream.autoReconnectRetries = 5;

      stream.on('data', async (event) => {
        try {
          const tweet = event.data;
          if (!tweet) return;

          // Find author from includes
          const author = event.includes?.users?.find(u => u.id === tweet.author_id);
          if (!author) {
            console.warn(`[x-agent] No author data for tweet ${tweet.id}`);
            return;
          }

          await processTweet(tweet, author.username, author.public_metrics);
        } catch (err) {
          console.error(`[x-agent] Error processing stream event: ${err.message}`);
        }
      });

      stream.on('error', (err) => {
        console.error(`[x-agent] Stream error: ${err.message}`);
      });

      stream.on('reconnected', () => {
        console.log('[x-agent] Stream reconnected');
      });

      console.log('[x-agent] Filtered stream started, listening for GrowStreams mentions');
      return; // success — exit the retry loop
    } catch (err) {
      const is503 = err.message?.includes('503') || err.code === 503;
      console.error(`[x-agent] Failed to start stream (attempt ${streamAttempt}/${maxStreamAttempts}): ${err.message}`);
      if (is503 && streamAttempt < maxStreamAttempts) {
        console.log(`[x-agent] 503 — retrying stream in 5s...`);
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
    }
  }
}
