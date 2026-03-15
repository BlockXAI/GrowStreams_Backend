import { Octokit } from 'octokit';
import { scorePR } from './llm-scorer.mjs';
import { awardXP, getInitialXP } from './xp-service.mjs';
import { getSupabase } from './supabase.mjs';

let octokit = null;

function getOctokit() {
  if (octokit) return octokit;

  const token = process.env.GITHUB_APP_PRIVATE_KEY || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('[github-agent] Missing GITHUB_APP_PRIVATE_KEY or GITHUB_TOKEN');
  }

  octokit = new Octokit({ auth: token });
  return octokit;
}

function getRepoConfig() {
  return {
    owner: process.env.GITHUB_REPO_OWNER || 'BlockXAI',
    repo: process.env.GITHUB_REPO_NAME || 'GrowStreams_Backend',
  };
}

function isCampaignActive() {
  const start = process.env.CAMPAIGN_START_DATE;
  const end = process.env.CAMPAIGN_END_DATE;
  const now = new Date();

  if (start && new Date(start) > now) return false;
  if (end && new Date(end) < now) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Fetch PR diff as combined patch text
// ---------------------------------------------------------------------------
async function fetchPRDiff(prNumber) {
  const { owner, repo } = getRepoConfig();
  const gh = getOctokit();

  const { data: files } = await gh.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber,
    per_page: 50,
  });

  const patches = files.map(f => {
    const header = `--- ${f.filename}\n+++ ${f.filename}\n`;
    return header + (f.patch || '(binary or too large)');
  });

  return patches.join('\n\n');
}

// ---------------------------------------------------------------------------
// Fetch linked issue body by parsing PR body for #NNN references
// ---------------------------------------------------------------------------
async function fetchLinkedIssue(prBody) {
  if (!prBody) return '';

  const match = prBody.match(/#(\d+)/);
  if (!match) return '';

  const issueNumber = parseInt(match[1], 10);
  const { owner, repo } = getRepoConfig();
  const gh = getOctokit();

  try {
    const { data: issue } = await gh.rest.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });
    return `**${issue.title}**\n\n${issue.body || ''}`;
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Fetch CI check status for a commit
// ---------------------------------------------------------------------------
async function fetchCIStatus(sha) {
  const { owner, repo } = getRepoConfig();
  const gh = getOctokit();

  try {
    const { data } = await gh.rest.checks.listForRef({
      owner,
      repo,
      ref: sha,
      per_page: 10,
    });

    if (!data.check_runs || data.check_runs.length === 0) return '';

    return data.check_runs
      .map(run => `${run.name}: ${run.conclusion || run.status}`)
      .join('\n');
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Count meaningful diff lines (excludes blank, comments, imports-only)
// ---------------------------------------------------------------------------
function countMeaningfulDiffLines(diff) {
  if (!diff) return 0;
  const lines = diff.split('\n');
  let count = 0;
  for (const line of lines) {
    // Only count added/removed lines (start with + or -)
    if (!line.startsWith('+') && !line.startsWith('-')) continue;
    // Skip diff headers
    if (line.startsWith('+++') || line.startsWith('---')) continue;
    // Strip the +/- prefix
    const content = line.slice(1).trim();
    // Skip empty lines
    if (!content) continue;
    // Skip pure comment lines
    if (content.startsWith('//') || content.startsWith('#') || content.startsWith('*') || content.startsWith('/*')) continue;
    // Skip pure import/require lines
    if (content.startsWith('import ') || content.startsWith('require(')) continue;
    count++;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Post a comment on a PR
// ---------------------------------------------------------------------------
async function postComment(prNumber, body) {
  const { owner, repo } = getRepoConfig();
  const gh = getOctokit();

  await gh.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });
}

// ---------------------------------------------------------------------------
// Build the score comment for GitHub
// ---------------------------------------------------------------------------
function buildScoreComment(result, xpAwarded, wallet) {
  const { score, factors, feedback } = result;
  const passed = score >= parseInt(process.env.SCORE_THRESHOLD || '70', 10);
  const emoji = passed ? '✅' : '❌';

  let comment = `### 🤖 GrowStreams AI Review\n\n`;
  comment += `**Score: ${score}/100** ${emoji}\n\n`;
  comment += `| Factor | Score |\n|--------|-------|\n`;
  comment += `| Correctness | ${factors.correctness}/30 |\n`;
  comment += `| Test Coverage | ${factors.testCoverage}/25 |\n`;
  comment += `| Code Quality | ${factors.codeQuality}/20 |\n`;
  comment += `| Issue Relevance | ${factors.issueRelevance}/15 |\n`;
  comment += `| Completeness | ${factors.completeness}/10 |\n\n`;
  comment += `**Feedback:** ${feedback}\n\n`;

  if (passed && xpAwarded > 0) {
    comment += `---\n`;
    comment += `🏆 **XP Awarded: ${xpAwarded} XP**`;
    if (wallet) comment += ` → \`${wallet.slice(0, 8)}...${wallet.slice(-4)}\``;
    comment += `\n📊 [View Leaderboard](https://growstreams.app/leaderboard)\n`;
  } else if (!passed) {
    comment += `---\n`;
    comment += `💡 Score below ${process.env.SCORE_THRESHOLD || '70'}. `;
    comment += `Push improvements to this PR and it will be re-scored automatically.\n`;
  }

  return comment;
}

function buildMergeBonusComment(bonusXP, wallet) {
  let comment = `### 🤖 GrowStreams — Merge Bonus!\n\n`;
  comment += `🎉 This PR was merged. **+${bonusXP} XP** merge bonus awarded`;
  if (wallet) comment += ` to \`${wallet.slice(0, 8)}...${wallet.slice(-4)}\``;
  comment += `.\n\n📊 [View Leaderboard](https://growstreams.app/leaderboard)\n`;
  return comment;
}

// ---------------------------------------------------------------------------
// Look up participant by GitHub username
// ---------------------------------------------------------------------------
async function findParticipant(githubUsername) {
  const db = getSupabase();
  const { data } = await db
    .from('participants')
    .select('*')
    .eq('github_handle', githubUsername)
    .single();

  return data || null;
}

// ---------------------------------------------------------------------------
// Find existing contribution by PR number
// ---------------------------------------------------------------------------
async function findContributionByPR(prNumber) {
  const db = getSupabase();
  const { data } = await db
    .from('contributions')
    .select('*')
    .eq('pr_number', prNumber)
    .eq('track', 'OSS')
    .single();

  return data || null;
}

// ---------------------------------------------------------------------------
// Insert a new contribution record
// ---------------------------------------------------------------------------
async function insertContribution(wallet, prNumber, score, xpAwarded, status, agentFeedback, agentResponse) {
  const db = getSupabase();

  const now = new Date().toISOString();
  const isActive = status === 'ACTIVE';
  const maxDailyDays = 14;
  const maxDailyUntil = isActive
    ? new Date(Date.now() + maxDailyDays * 86400000).toISOString()
    : null;

  const { data, error } = await db
    .from('contributions')
    .insert({
      wallet,
      track: 'OSS',
      external_id: `PR#${prNumber}`,
      score,
      xp_awarded: xpAwarded,
      status,
      agent_feedback: agentFeedback,
      agent_response: agentResponse,
      pr_number: prNumber,
      first_scored_at: isActive ? now : null,
      max_daily_until: maxDailyUntil,
      submitted_at: now,
    })
    .select()
    .single();

  if (error) throw new Error(`[github-agent] Insert contribution failed: ${error.message}`);
  return data;
}

// ---------------------------------------------------------------------------
// Update an existing contribution
// ---------------------------------------------------------------------------
async function updateContribution(id, updates) {
  const db = getSupabase();
  const { error } = await db
    .from('contributions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(`[github-agent] Update contribution failed: ${error.message}`);
}

// ===========================================================================
// EVENT HANDLERS
// ===========================================================================

/**
 * Handle pull_request.opened event
 */
export async function handlePROpened(payload) {
  const pr = payload.pull_request;
  const prNumber = pr.number;
  const authorLogin = pr.user.login;

  console.log(`[github-agent] PR #${prNumber} opened by ${authorLogin}`);

  if (!isCampaignActive()) {
    console.log(`[github-agent] Campaign not active, skipping PR #${prNumber}`);
    return;
  }

  const participant = await findParticipant(authorLogin);
  if (!participant) {
    console.log(`[github-agent] ${authorLogin} not registered, skipping`);
    await postComment(prNumber,
      `👋 Hey @${authorLogin}! Register at [GrowStreams](https://growstreams.app/campaign) to earn XP for your contributions.`
    );
    return;
  }

  // Check for existing contribution (avoid duplicate scoring)
  const existing = await findContributionByPR(prNumber);
  if (existing && existing.status === 'ACTIVE') {
    console.log(`[github-agent] PR #${prNumber} already scored and active, skipping`);
    return;
  }

  const diff = await fetchPRDiff(prNumber);

  // Anti-gaming: reject trivially small PRs
  const meaningfulLines = countMeaningfulDiffLines(diff);
  if (meaningfulLines < 5) {
    console.log(`[github-agent] PR #${prNumber}: only ${meaningfulLines} meaningful lines, flagging as trivial`);
    await insertContribution(
      participant.wallet, prNumber, 0, 0,
      'REJECTED', `Trivial change: only ${meaningfulLines} meaningful lines changed.`, { trivial: true, meaningfulLines }
    );
    await postComment(prNumber,
      `### 🤖 GrowStreams AI Review\n\n**Score: Below threshold**\n\nThis PR has fewer than 5 meaningful lines of change. Please submit more substantial contributions to earn XP.\n\n💡 Push more changes and it will be re-scored automatically.`
    );
    return;
  }

  const issueBody = await fetchLinkedIssue(pr.body);
  const ciStatus = await fetchCIStatus(pr.head.sha);

  const result = await scorePR(diff, issueBody, ciStatus);
  const threshold = parseInt(process.env.SCORE_THRESHOLD || '70', 10);

  if (result.score >= threshold) {
    const xpAmount = getInitialXP(result.score, 'OSS');
    const contribution = await insertContribution(
      participant.wallet, prNumber, result.score, xpAmount,
      'ACTIVE', result.feedback, result
    );

    await awardXP(participant.wallet, xpAmount, 'INITIAL_AWARD', contribution.id);
    await postComment(prNumber, buildScoreComment(result, xpAmount, participant.wallet));

    console.log(`[github-agent] PR #${prNumber}: score=${result.score}, xp=${xpAmount}`);
  } else {
    await insertContribution(
      participant.wallet, prNumber, result.score, 0,
      'REJECTED', result.feedback, result
    );

    await postComment(prNumber, buildScoreComment(result, 0, null));
    console.log(`[github-agent] PR #${prNumber}: score=${result.score}, below threshold`);
  }
}

/**
 * Handle pull_request.synchronize event (new commits pushed)
 */
export async function handlePRSynchronized(payload) {
  const pr = payload.pull_request;
  const prNumber = pr.number;
  const authorLogin = pr.user.login;

  console.log(`[github-agent] PR #${prNumber} synchronized by ${authorLogin}`);

  if (!isCampaignActive()) return;

  const participant = await findParticipant(authorLogin);
  if (!participant) return;

  const existing = await findContributionByPR(prNumber);
  if (!existing) {
    // Treat as new if no existing contribution
    await handlePROpened(payload);
    return;
  }

  // Only re-score if REJECTED (give them another chance) or ACTIVE (check for tier change)
  if (existing.status !== 'REJECTED' && existing.status !== 'ACTIVE') return;

  const diff = await fetchPRDiff(prNumber);
  const issueBody = await fetchLinkedIssue(pr.body);
  const ciStatus = await fetchCIStatus(pr.head.sha);

  const result = await scorePR(diff, issueBody, ciStatus);
  const threshold = parseInt(process.env.SCORE_THRESHOLD || '70', 10);

  if (existing.status === 'REJECTED' && result.score >= threshold) {
    // Upgrade from REJECTED to ACTIVE
    const xpAmount = getInitialXP(result.score, 'OSS');
    const now = new Date().toISOString();

    await updateContribution(existing.id, {
      score: result.score,
      xp_awarded: xpAmount,
      status: 'ACTIVE',
      agent_feedback: result.feedback,
      agent_response: result,
      first_scored_at: now,
      max_daily_until: new Date(Date.now() + 14 * 86400000).toISOString(),
    });

    await awardXP(participant.wallet, xpAmount, 'INITIAL_AWARD', existing.id);
    await postComment(prNumber, buildScoreComment(result, xpAmount, participant.wallet));

    console.log(`[github-agent] PR #${prNumber} upgraded: score=${result.score}, xp=${xpAmount}`);

  } else if (existing.status === 'ACTIVE') {
    // Check if score tier changed
    const oldXP = getInitialXP(existing.score, 'OSS');
    const newXP = getInitialXP(result.score, 'OSS');
    const xpDelta = newXP - oldXP;

    await updateContribution(existing.id, {
      score: result.score,
      agent_feedback: result.feedback,
      agent_response: result,
    });

    if (xpDelta > 0) {
      await awardXP(participant.wallet, xpDelta, 'ADJUSTMENT', existing.id);

      await updateContribution(existing.id, {
        xp_awarded: existing.xp_awarded + xpDelta,
      });
    }

    if (result.score !== existing.score) {
      await postComment(prNumber, buildScoreComment(result, xpDelta > 0 ? xpDelta : 0, participant.wallet));
      console.log(`[github-agent] PR #${prNumber} re-scored: ${existing.score} → ${result.score}`);
    }

  } else if (existing.status === 'REJECTED' && result.score < threshold) {
    // Still rejected, update score + feedback
    await updateContribution(existing.id, {
      score: result.score,
      agent_feedback: result.feedback,
      agent_response: result,
    });

    await postComment(prNumber, buildScoreComment(result, 0, null));
    console.log(`[github-agent] PR #${prNumber} re-scored, still below threshold: ${result.score}`);
  }
}

/**
 * Handle pull_request.closed + merged event
 */
export async function handlePRMerged(payload) {
  const pr = payload.pull_request;
  const prNumber = pr.number;
  const authorLogin = pr.user.login;

  console.log(`[github-agent] PR #${prNumber} merged by ${authorLogin}`);

  const participant = await findParticipant(authorLogin);
  if (!participant) return;

  const existing = await findContributionByPR(prNumber);
  if (!existing) return;

  // Only award merge bonus for ACTIVE contributions
  if (existing.status !== 'ACTIVE') {
    await updateContribution(existing.id, { status: 'MERGED' });
    return;
  }

  const mergeBonus = parseInt(process.env.MERGE_BONUS_XP || '500', 10);

  await updateContribution(existing.id, {
    status: 'MERGED',
    xp_awarded: existing.xp_awarded + mergeBonus,
  });

  await awardXP(participant.wallet, mergeBonus, 'MERGE_BONUS', existing.id);
  await postComment(prNumber, buildMergeBonusComment(mergeBonus, participant.wallet));

  console.log(`[github-agent] PR #${prNumber}: merge bonus +${mergeBonus} XP`);
}

/**
 * Handle pull_request.closed (not merged) event
 */
export async function handlePRClosed(payload) {
  const pr = payload.pull_request;
  const prNumber = pr.number;

  console.log(`[github-agent] PR #${prNumber} closed without merge`);

  const existing = await findContributionByPR(prNumber);
  if (!existing) return;

  await updateContribution(existing.id, { status: 'CLOSED' });
  console.log(`[github-agent] PR #${prNumber} contribution status → CLOSED`);
}
