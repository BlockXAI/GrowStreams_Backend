# E2E Validation Test

This PR tests the GitHub webhook → AI scoring → XP award pipeline.

## Changes
- Added validation test file
- Testing PR scoring with meaningful content

## Expected Behavior
1. Webhook fires on PR creation
2. AI scores the PR diff
3. If score ≥ 70, XP is awarded
4. Bot posts comment with score and XP
5. Leaderboard updates with new XP

## Test Details
- **Date**: 2026-03-18
- **User**: Testing GitHub integration
- **Track**: OSS
