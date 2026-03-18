import { TwitterApi } from 'twitter-api-v2';
import { scoreContent } from './llm-scorer.mjs';
import { awardXP, getInitialXP } from './xp-service.mjs';
import { queryOne, query, queryAll } from './db.mjs';

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
  const raw = likes + retweets * 2 + replies * 1.5;
  const effectiveFollowers = Math.max(followerCount || 0, 100); // floor at 100 to avoid tiny-denominator spikes
  return raw / effectiveFollowers;
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

  // 8. TWO-PHASE SCORING
  //    Phase 1 (now): use LLM quality score ONLY (engagement is near-zero for fresh tweets)
  //    Phase 2 (6h re-eval): combine LLM + engagement for final score, adjust XP
  const qualityScore = llmResult.score;
  const threshold = parseInt(process.env.SCORE_THRESHOLD || '70', 10);
  const reevalThreshold = 40; // tweets scoring 40-69 get a second chance at 6h re-eval

  if (qualityScore >= threshold) {
    // HIGH QUALITY — award provisional XP (70% of full), finalize at 6h re-eval
    const fullXP = getInitialXP(qualityScore, 'CONTENT');
    let provisionalXP = Math.round(fullXP * 0.7);

    // Thread bonus: +30% if thread with 5+ tweets
    if (isThread && threadLength >= 5) {
      provisionalXP = Math.round(provisionalXP * 1.3);
    }

    const contribution = await insertContribution(
      participant.wallet, tweetId, qualityScore, provisionalXP,
      'PROVISIONAL', llmResult.feedback, {
        ...llmResult,
        qualityScore,
        engagementScore,
        velocity,
        phase: 'initial',
        followerCount,
      }
    );

    try {
      await awardXP(participant.wallet, provisionalXP, 'INITIAL_AWARD', contribution.id);
    } catch (err) {
      console.error(`[x-agent] XP award failed for tweet ${tweetId}: ${err.message}`);
    }

    // Thread bonus as separate event if applicable
    if (isThread && threadLength >= 5) {
      try {
        const threadBonusXP = Math.round(getInitialXP(qualityScore, 'CONTENT') * 0.3 * 0.7);
        await awardXP(participant.wallet, threadBonusXP, 'THREAD_BONUS', contribution.id);
      } catch (err) {
        console.error(`[x-agent] Thread bonus XP failed for tweet ${tweetId}: ${err.message}`);
      }
    }

    const rank = await getParticipantRank(participant.wallet);
    await replyToTweet(tweetId, buildReplyText(qualityScore, provisionalXP, rank));

    // Schedule Phase 2 re-evaluation at 6h and bonus check at 24h
    scheduleReevaluation(contribution.id, tweetId, participant.wallet, 6 * 60 * 60 * 1000);   // 6h
    scheduleReevaluation(contribution.id, tweetId, participant.wallet, 24 * 60 * 60 * 1000);  // 24h

    console.log(`[x-agent] Tweet ${tweetId}: qualityScore=${qualityScore}, provisionalXP=${provisionalXP} (PROVISIONAL)`);

  } else if (qualityScore >= reevalThreshold) {
    // BORDERLINE — don't reject yet, give a second chance at 6h when engagement exists
    const contribution = await insertContribution(
      participant.wallet, tweetId, qualityScore, 0,
      'PENDING_REEVAL', llmResult.feedback, {
        ...llmResult,
        qualityScore,
        engagementScore,
        velocity,
        phase: 'initial',
        followerCount,
      }
    );

    // Schedule Phase 2 re-evaluation at 6h
    scheduleReevaluation(contribution.id, tweetId, participant.wallet, 6 * 60 * 60 * 1000);

    console.log(`[x-agent] Tweet ${tweetId}: qualityScore=${qualityScore}, PENDING_REEVAL (will re-check at 6h)`);

  } else {
    // LOW QUALITY — reject immediately
    await insertContribution(
      participant.wallet, tweetId, qualityScore, 0,
      'REJECTED', llmResult.feedback, {
        ...llmResult,
        qualityScore,
        engagementScore,
        velocity,
        phase: 'initial',
        followerCount,
      }
    );

    console.log(`[x-agent] Tweet ${tweetId}: qualityScore=${qualityScore}, REJECTED (below ${reevalThreshold})`);
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
// Handles three statuses:
//   PROVISIONAL  → finalize with engagement boost, award remaining 30% XP
//   PENDING_REEVAL → second chance: combine LLM + engagement, award if above threshold
//   ACTIVE       → check for viral/reshare/engagement bonuses
// ---------------------------------------------------------------------------
export async function reevaluateTweet(contributionId, tweetId, wallet) {
  console.log(`[x-agent] Re-evaluating tweet ${tweetId}`);

  const contribution = await queryOne(
    `SELECT * FROM contributions WHERE id = $1`,
    [contributionId]
  );

  if (!contribution || !['ACTIVE', 'PROVISIONAL', 'PENDING_REEVAL'].includes(contribution.status)) {
    console.log(`[x-agent] Contribution ${contributionId} status=${contribution?.status}, skipping re-eval`);
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

  const oldResponse = typeof contribution.agent_response === 'string'
    ? JSON.parse(contribution.agent_response)
    : contribution.agent_response || {};
  const followerCount = oldResponse.followerCount || 100;
  const qualityScore = oldResponse.qualityScore || oldResponse.score || contribution.score;

  const newVelocity = calculateEngagementVelocity(likes, retweets, replies, followerCount);
  const newEngagementScore = engagementToScore(newVelocity);

  // --- PROVISIONAL: Finalize with engagement boost, award remaining 30% XP ---
  if (contribution.status === 'PROVISIONAL') {
    const combinedScore = Math.round(qualityScore * 0.65 + newEngagementScore * 0.35);
    const fullXP = getInitialXP(combinedScore, 'CONTENT');
    const alreadyAwarded = contribution.xp_awarded || 0;
    const remainingXP = Math.max(0, fullXP - alreadyAwarded);

    if (remainingXP > 0) {
      try {
        await awardXP(wallet, remainingXP, 'ENGAGEMENT_BONUS', contributionId);
        console.log(`[x-agent] Tweet ${tweetId}: finalized PROVISIONAL → ACTIVE, +${remainingXP} XP (combined=${combinedScore})`);
      } catch (err) {
        console.error(`[x-agent] Failed to award finalization XP for ${tweetId}: ${err.message}`);
      }
    }

    await updateContribution(contributionId, {
      status: 'ACTIVE',
      score: combinedScore,
      xp_awarded: alreadyAwarded + remainingXP,
      agent_response: { ...oldResponse, combinedScore, engagementScore: newEngagementScore, velocity: newVelocity, phase: 'finalized' },
    });

    console.log(`[x-agent] Tweet ${tweetId}: PROVISIONAL → ACTIVE (combined=${combinedScore}, engagement=${newEngagementScore})`);
    return;
  }

  // --- PENDING_REEVAL: Second chance with engagement ---
  if (contribution.status === 'PENDING_REEVAL') {
    const combinedScore = Math.round(qualityScore * 0.65 + newEngagementScore * 0.35);
    const threshold = parseInt(process.env.SCORE_THRESHOLD || '70', 10);

    if (combinedScore >= threshold) {
      const xpAmount = getInitialXP(combinedScore, 'CONTENT');

      await updateContribution(contributionId, {
        status: 'ACTIVE',
        score: combinedScore,
        xp_awarded: xpAmount,
        agent_response: { ...oldResponse, combinedScore, engagementScore: newEngagementScore, velocity: newVelocity, phase: 'promoted' },
      });

      try {
        await awardXP(wallet, xpAmount, 'INITIAL_AWARD', contributionId);
      } catch (err) {
        console.error(`[x-agent] XP award failed for promoted tweet ${tweetId}: ${err.message}`);
      }

      const rank = await getParticipantRank(wallet);
      await replyToTweet(tweetId, buildReplyText(combinedScore, xpAmount, rank));

      // Schedule 24h bonus check
      scheduleReevaluation(contributionId, tweetId, wallet, 24 * 60 * 60 * 1000);

      console.log(`[x-agent] Tweet ${tweetId}: PENDING_REEVAL → ACTIVE (combined=${combinedScore}, xp=${xpAmount})`);
    } else {
      await updateContribution(contributionId, {
        status: 'REJECTED',
        score: combinedScore,
        agent_response: { ...oldResponse, combinedScore, engagementScore: newEngagementScore, velocity: newVelocity, phase: 'rejected_after_reeval' },
      });

      console.log(`[x-agent] Tweet ${tweetId}: PENDING_REEVAL → REJECTED (combined=${combinedScore}, still below threshold)`);
    }
    return;
  }

  // --- ACTIVE: Check for viral/reshare/engagement bonuses ---
  if (totalEngagements >= 500) {
    await awardXP(wallet, 800, 'VIRAL_BONUS', contributionId);
    console.log(`[x-agent] Tweet ${tweetId}: VIRAL_BONUS +800 XP (${totalEngagements} engagements)`);
  }

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

  const oldEngagementScore = oldResponse?.engagementScore || 0;
  if (newEngagementScore - oldEngagementScore > 10) {
    const bonusXP = Math.round((newEngagementScore - oldEngagementScore) * 3);
    await awardXP(wallet, bonusXP, 'ENGAGEMENT_BONUS', contributionId);
    console.log(`[x-agent] Tweet ${tweetId}: ENGAGEMENT_BONUS +${bonusXP} XP (engagement improved)`);
  }

  console.log(`[x-agent] Re-evaluation complete for tweet ${tweetId}`);
}

// ---------------------------------------------------------------------------
// Poll for recent tweets (fallback for free-tier X API where filtered stream
// connects but delivers no data). Called by cron every 15 minutes.
// ---------------------------------------------------------------------------
export async function pollRecentTweets() {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) return;

  console.log('[x-agent] Polling for recent GrowStreams tweets...');
  const client = getReadClient();

  try {
    const result = await client.v2.search('(#GrowStreams OR @GrowStreams OR @GrowwStreams) -is:retweet lang:en', {
      'tweet.fields': 'public_metrics,author_id,referenced_tweets,in_reply_to_user_id,attachments,created_at',
      'user.fields': 'username,public_metrics',
      'expansions': 'author_id,attachments.media_keys',
      max_results: 10,
    });

    const tweets = result.data?.data || [];
    const users = result.data?.includes?.users || [];

    if (!tweets.length) {
      console.log('[x-agent] Poll: no new tweets found');
      return;
    }

    console.log(`[x-agent] Poll: found ${tweets.length} tweets`);

    for (const tweet of tweets) {
      const author = users.find(u => u.id === tweet.author_id);
      if (!author) continue;

      try {
        await processTweet(tweet, author.username, author.public_metrics);
      } catch (err) {
        console.error(`[x-agent] Poll: error processing tweet ${tweet.id}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error(`[x-agent] Poll failed: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Poll tweets from registered participants (bypasses search API limits).
// Looks up each registered user's recent tweets and processes GrowStreams ones.
// ---------------------------------------------------------------------------
export async function pollRegisteredUsers() {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) return;

  console.log('[x-agent] Polling registered users for GrowStreams tweets...');
  const client = getReadClient();

  // Get all registered participants with x_handle
  const participants = await queryAll(
    `SELECT wallet, x_handle FROM participants WHERE x_handle IS NOT NULL AND x_handle != ''`
  );

  if (!participants?.length) {
    console.log('[x-agent] No registered X users to poll');
    return;
  }

  console.log(`[x-agent] Polling ${participants.length} registered users`);
  const growPattern = /growstream|#growstreams|@growstreams|@growwstreams/i;

  for (const p of participants) {
    try {
      // Look up user ID by username
      const userResult = await client.v2.userByUsername(p.x_handle, {
        'user.fields': 'public_metrics',
      });
      const user = userResult.data;
      if (!user) {
        console.log(`[x-agent] User @${p.x_handle} not found on X`);
        continue;
      }

      // Fetch recent tweets from this user
      const timeline = await client.v2.userTimeline(user.id, {
        'tweet.fields': 'public_metrics,author_id,referenced_tweets,in_reply_to_user_id,attachments,created_at',
        max_results: 5,
        exclude: ['retweets', 'replies'],
      });

      const tweets = timeline.data?.data || [];
      if (!tweets.length) continue;

      for (const tweet of tweets) {
        // Only process tweets mentioning GrowStreams
        if (!growPattern.test(tweet.text)) continue;

        try {
          await processTweet(tweet, p.x_handle, user.public_metrics);
        } catch (err) {
          console.error(`[x-agent] Error processing tweet ${tweet.id} from @${p.x_handle}: ${err.message}`);
        }
      }
    } catch (err) {
      console.error(`[x-agent] Failed to poll @${p.x_handle}: ${err.message}`);
    }
  }

  console.log('[x-agent] Registered user poll complete');
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
      const isRetryable = err.message?.includes('503') || err.code === 503
        || err.message?.includes('429') || err.code === 429;
      console.error(`[x-agent] Failed to start stream (attempt ${streamAttempt}/${maxStreamAttempts}): ${err.message}`);
      if (isRetryable && streamAttempt < maxStreamAttempts) {
        const backoff = err.message?.includes('429') ? 60000 : 5000;
        console.log(`[x-agent] ${err.message?.includes('429') ? '429 rate-limited' : '503'} — retrying stream in ${backoff / 1000}s...`);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
    }
  }
}
