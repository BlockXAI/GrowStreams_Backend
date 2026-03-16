# GitHub Agent - Automated PR Scoring System

## Overview

**Automated PR scoring pipeline** that evaluates open-source contributions in real-time using GPT-4o-mini.

## How It Works

1. **Listens to GitHub webhook events** (PR opened/merged/closed)
2. **Fetches PR context** via GitHub API:
   - PR diff
   - Linked issue
   - CI status
3. **Scores PRs** on 5 factors using LLM:
   - **Correctness** (0-30 points)
   - **Test Coverage** (0-25 points)
   - **Code Quality** (0-20 points)
   - **Issue Relevance** (0-15 points)
   - **Completeness** (0-10 points)
4. **Awards XP** based on score tier:
   - **70-79**: 700 XP
   - **80-89**: 1,200 XP
   - **90-100**: 2,000 XP
5. **Posts score breakdown** as GitHub comment
6. **Tracks daily XP accumulation** for active PRs (+100-200 XP/day)
7. **Awards +500 XP merge bonus** when PR is merged

## XP Rewards Table

| Score Range | Initial XP | Daily Accumulation | Merge Bonus |
|-------------|-----------|-------------------|-------------|
| 70-79       | 700 XP    | +100 XP/day       | +500 XP     |
| 80-89       | 1,200 XP  | +150 XP/day       | +500 XP     |
| 90-100      | 2,000 XP  | +200 XP/day       | +500 XP     |

## GitHub Comment Template

```
🤖 GrowStreams AI Review

Score: 82/100 ✅

  Correctness:     24/30
  Test Coverage:   20/25
  Code Quality:    17/20
  Issue Relevance: 13/15
  Completeness:     8/10

Feedback: The fix correctly handles the race condition.
Consider adding a test for the concurrent access scenario.

XP Awarded: 1,200 XP → 0x1234...abcd
📊 Leaderboard: growstreams.app/leaderboard
```

## Anti-Gaming Features

- Rejects copy-paste code through LLM analysis
- Detects trivial changes
- Validates issue relevance
- Requires minimum quality threshold (70/100)

## Tech Stack

- **Octokit** - GitHub API integration
- **OpenAI GPT-4o-mini** - LLM-based code evaluation
- **HMAC-SHA256** - Webhook signature verification
- **Supabase** - XP tracking and leaderboard storage

## Purpose

Enables the **OSS track** of the 21-day campaign where contributors earn XP → USDC payouts based on **code quality**, not just quantity.

## Integration Points

- `api/src/services/github-agent.mjs` - Core scoring pipeline
- `api/src/services/llm-scorer.mjs` - LLM wrapper
- `api/src/routes/webhooks.mjs` - Webhook handler
- `api/src/services/xp-service.mjs` - XP management
