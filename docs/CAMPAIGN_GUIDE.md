# Campaign & Leaderboard Guide

## Table of Contents
- [Understanding the Campaign](#understanding-the-campaign)
- [Registering for the Campaign](#registering-for-the-campaign)
- [Earning XP: OSS Track](#earning-xp-oss-track)
- [Earning XP: Content Track](#earning-xp-content-track)
- [Accessing the Leaderboard](#accessing-the-leaderboard)
- [Understanding Your Stats](#understanding-your-stats)
- [Campaign Strategies](#campaign-strategies)
- [Campaign Rules & Fair Play](#campaign-rules--fair-play)
- [Campaign Timeline](#campaign-timeline)
- [Payout Process](#payout-process)
- [Campaign FAQ](#campaign-faq)

---

## Understanding the Campaign

The GrowStreams Campaign is a community rewards program that incentivizes ecosystem contributions through XP (experience points) and USDC rewards.

### Campaign Benefits

- ✅ Earn XP for contributions to the GrowStreams ecosystem
- 🏆 Compete on the global leaderboard
- 💰 Share in a USDC prize pool based on your XP
- 🌟 Get recognized for high-quality work
- 🚀 Build reputation in the Vara community

### Campaign Duration

The campaign runs for a fixed period (check the dashboard for end date). All contributions during this period earn XP toward your final ranking.

### Prize Pool

The total USDC pool is distributed proportionally based on each participant's XP share:

```
Your Share = (Your XP / Total XP) × Pool Size
```

**Example:**
- Total Pool: $10,000 USDC
- Your XP: 1,200
- Total Campaign XP: 20,000
- **Your Share: (1,200 / 20,000) × $10,000 = $600 USDC**

> [SCREENSHOT PLACEHOLDER: Campaign overview page showing pool size, days remaining, and participant count]

---

## Registering for the Campaign

### Prerequisites

- ✅ Connected Vara-compatible wallet
- ✅ GitHub account (for OSS track)
- ✅ X/Twitter account (for Content track)

### Registration Steps

#### 1. Navigate to the Campaign Page
- Go to `growstreams.xyz/app/campaign`
- Click "Connect Wallet" if not already connected

#### 2. Select Your Track
- **OSS Track** – Earn XP through code contributions (PRs, issues)
- **Content Track** – Earn XP through social media content
- **Both Tracks** – Participate in both for maximum earning potential

#### 3. Enter Your Handles
- **GitHub Handle** – Required for OSS track (e.g., `Sarthakv007`)
- **X Handle** – Required for Content track (e.g., `Sar1hakkk`)
- Both handles required if selecting "Both Tracks"

#### 4. Optional Referral Code
- Enter a referral code if you have one
- Your referrer earns 5% bonus XP from your contributions

#### 5. Submit Registration
- Click "Register for Campaign"
- Sign the transaction in your wallet
- Wait for confirmation

### After Registration

- ✅ You immediately receive **+10 XP join bonus**
- ✅ Your profile appears on the leaderboard
- ✅ You can start earning XP from contributions
- ✅ Your referral link is generated (share to earn bonuses)

> [SCREENSHOT PLACEHOLDER: Campaign registration form with track selection, handle inputs, and submit button]

### Registration Limits

- ⚠️ One registration per wallet
- ⚠️ GitHub and X handles must be unique
- ⚠️ Cannot change tracks after registration
- ⚠️ Registration closes when campaign ends

---

## Earning XP: OSS Track

### How It Works

1. You submit a Pull Request to a GrowStreams repository
2. The AI agent reviews your PR and scores it (0-100)
3. If your score ≥ 70, you earn XP based on quality
4. The bot posts feedback directly on your PR

### Scoring Factors

| Factor | Points | Description |
|--------|--------|-------------|
| **Correctness** | 0-30 pts | Code works and fixes the issue |
| **Test Coverage** | 0-25 pts | Tests included and comprehensive |
| **Code Quality** | 0-20 pts | Clean, readable, maintainable code |
| **Issue Relevance** | 0-15 pts | Addresses the stated problem |
| **Completeness** | 0-10 pts | Docs updated, edge cases handled |

### XP Rewards

| Score Range | Initial XP | Daily Accumulation |
|-------------|------------|-------------------|
| 90-100      | 2,000 XP   | +200 XP/day       |
| 80-89       | 1,200 XP   | +150 XP/day       |
| 70-79       | 700 XP     | +100 XP/day       |
| Below 70    | 0 XP       | No reward         |

### Bonus XP

- 🎉 **PR Merged** – +50% of initial XP
- 🎊 **First Contribution** – +100 XP (one-time)

### Anti-Gaming Rules

- ❌ PRs with < 5 meaningful lines changed score below 70
- ❌ Copied code without adaptation scores below 70
- ❌ AI-generated code without human insight scores poorly
- ❌ Spam or trivial changes receive 0 XP

### Example OSS Contribution

```
Your PR: Fix wallet connection bug (#142)
Score: 85/100
Initial XP: +1,200 XP
Daily Rate: +150 XP/day (while PR active)
If merged: +600 XP bonus
Total potential: 1,200 + 600 = 1,800 XP
```

> [SCREENSHOT PLACEHOLDER: GitHub PR with GrowStreams bot comment showing score breakdown and XP awarded]

---

## Earning XP: Content Track

### How It Works

1. You post content about GrowStreams on X/Twitter
2. Mention `@GrowStreams` or use `#GrowStreams` hashtag
3. The AI agent detects and scores your content (0-100)
4. **Phase 1 (Immediate):** You get provisional XP if quality score ≥ 70
5. **Phase 2 (6 hours later):** Engagement data adds to your score
6. The bot replies with your score and XP earned

### Two-Phase Scoring

#### Phase 1 – Quality Assessment (Immediate)

- AI evaluates content quality only (no engagement penalty)
- **Score ≥ 70:** Receive 70% of XP immediately, status = `PROVISIONAL`
- **Score 40-69:** No XP yet, gets second chance at 6h (status = `PENDING_REEVAL`)
- **Score < 40:** Rejected immediately

#### Phase 2 – Engagement Boost (6 hours later)

- Final score = **65% quality + 35% engagement**
- **PROVISIONAL → ACTIVE:** Receive remaining 30% XP
- **PENDING_REEVAL → ACTIVE:** If combined score ≥ 70, receive full XP
- **PENDING_REEVAL → REJECTED:** If still below 70, no XP

### Scoring Factors

| Factor | Points | Description |
|--------|--------|-------------|
| **Quality** | 0-30 pts | Well-written, clear, engaging |
| **Relevance** | 0-15 pts | Meaningfully discusses GrowStreams/Vara |
| **Originality** | 0-10 pts | Original insight, not generic |
| **Educational Value** | 0-20 pts | Teaches something useful |
| **Engagement** | 0-25 pts | Drives discussion and sharing |

### XP Rewards

| Score Range | Provisional XP (70%) | Total XP (100%) |
|-------------|---------------------|-----------------|
| 90-100      | 840 XP             | 1,200 XP        |
| 80-89       | 560 XP             | 800 XP          |
| 70-79       | 350 XP             | 500 XP          |

### Bonus XP (24h re-evaluation)

- 🔥 **Viral Bonus** – 500+ engagements: **+800 XP**
- 🎯 **Reshare Bonus** – @VaraNetwork retweets you: **+500 XP**
- 📈 **Engagement Growth** – Significant increase: **+30-100 XP**
- 🧵 **Thread Bonus** – 5+ tweet thread: **+30% XP**

### Content Type Multipliers

- 📚 **Tutorial/Explainer** – High educational value, scores well
- 🧵 **Thread (5+ tweets)** – Receives +30% bonus XP
- 🎥 **Video Content** – Preferred format, higher engagement
- 💬 **Generic Mentions** – Low effort, scores poorly

### Anti-Gaming Rules

- ❌ Tweets < 20 characters are skipped
- ❌ AI-generated content without insight scores below 70
- ❌ Low-effort tags/mentions score below 70
- ❌ Copied content scores below 70
- ❌ Spam receives 0 XP

### Example Content Contribution

```
Your Tweet: "Just built my first money stream on @GrowStreams! 
🚀 Real-time payments flowing at 0.001 GROW/sec. No more 
monthly batches. The future of payroll is here. 
#GrowStreams #VaraNetwork 🧵 1/5"

Phase 1 (Immediate):
Quality Score: 75/100
Status: PROVISIONAL
XP Awarded: 350 XP (70% of 500)

Phase 2 (6 hours later):
Engagement: 45 likes, 12 RTs, 8 replies
Combined Score: 78/100
Status: ACTIVE
XP Added: +150 XP (remaining 30%)
Total XP: 500 XP

Thread Bonus: +150 XP (30% for 5-tweet thread)
Grand Total: 650 XP
```

> [SCREENSHOT PLACEHOLDER: X/Twitter post with GrowStreams bot reply showing score and XP]

---

## Accessing the Leaderboard

### Navigation

- Go to `growstreams.xyz/app/leaderboard`
- No wallet connection required to view
- Connect wallet to see your personal rank

### Leaderboard Display

The leaderboard shows:

| Column | Description |
|--------|-------------|
| **Rank** | Your position (1 = highest XP) |
| **Display Name** | GitHub or X handle |
| **Track** | OSS, Content, or Both |
| **Total XP** | Cumulative points earned |
| **Contributions** | Number of accepted contributions |
| **Estimated USDC** | Your projected payout |
| **Rank Change** | ↑↓ compared to yesterday |

> [SCREENSHOT PLACEHOLDER: Leaderboard table showing top 10 participants with all columns]

### Leaderboard Features

1. 🔄 **Live Updates** – Refreshes automatically as XP changes
2. 🔍 **Track Filters** – Filter by OSS, Content, or Both
3. 📄 **Pagination** – Browse all participants
4. 🔎 **Search** – Find specific users by wallet/handle
5. ✨ **Personal Highlight** – Your row highlighted when connected

### Rank Calculation

- Users sorted by total XP (descending)
- Ties are broken by registration date (earlier = higher rank)
- **All registered users appear** (including 0 XP)

---

## Understanding Your Stats

### Personal Dashboard

Click your name on the leaderboard to view detailed stats:

#### Overview Section
- 🏅 Current Rank
- ⭐ Total XP
- 💵 Estimated USDC payout
- 📊 Active contributions count
- 📈 XP growth chart (21-day history)

#### Contributions List
- All your OSS PRs and Content posts
- Score for each contribution
- XP earned per item
- Status (Active, Provisional, Merged, Rejected)
- Date submitted

#### XP Events Log
- Every XP transaction
- Event type (Initial Award, Bonus, Daily Accumulation)
- Amount earned
- Timestamp

#### Referral Stats
- Your referral code
- Number of referrals
- Total bonus XP from referrals
- Shareable referral link

> [SCREENSHOT PLACEHOLDER: Personal stats dashboard with XP chart and contribution list]

---

## Campaign Strategies

### Maximizing Your XP

#### 1. Quality Over Quantity
- Focus on high-quality contributions (score 90+)
- One excellent PR > five mediocre PRs
- Thoughtful content > frequent low-effort posts

#### 2. Consistency
- Contribute regularly throughout the campaign
- Daily accumulation adds up over time
- Maintain active PRs to earn daily XP

#### 3. Engage Both Tracks
- "Both Tracks" participants can earn from OSS + Content
- Diversify your contribution types
- Cross-promote: tweet about your PRs

#### 4. Leverage Bonuses
- Create tutorial threads (thread bonus)
- Get PRs merged (merge bonus)
- Drive engagement on posts (viral bonus)
- Refer friends (5% of their XP)

#### 5. Monitor Competition
- Check leaderboard daily
- See what top contributors are doing
- Identify gaps you can fill

### Time Investment Examples

| Strategy | Time/Week | Potential XP/Week |
|----------|-----------|-------------------|
| Casual Content | 2-3 hrs | 500-1,000 XP |
| Active OSS | 5-10 hrs | 1,500-3,000 XP |
| Both Tracks | 10-15 hrs | 3,000-5,000 XP |
| Power User | 20+ hrs | 5,000-10,000 XP |

---

## Campaign Rules & Fair Play

### Eligibility

- ✅ Must be 18+ years old
- ✅ One registration per person
- ✅ Valid GitHub/X accounts required
- ✅ Vara wallet required for payout

### Prohibited Actions

- 🚫 Creating multiple accounts (sybil attacks)
- 🚫 Using AI to generate spam contributions
- 🚫 Plagiarizing code or content
- 🚫 Coordinating fake engagement
- 🚫 Exploiting system vulnerabilities

### Enforcement

- 🤖 AI agents detect low-quality contributions
- 👁️ Manual review for suspicious activity
- ⚠️ Disqualification for rule violations
- 💸 No payout for disqualified users

### Dispute Resolution

- If your contribution was unfairly scored, contact support
- Include contribution ID and explanation
- Team reviews within 48 hours
- Decisions are final

---

## Campaign Timeline

### Key Dates

1. **Campaign Start** – Registration opens, XP earning begins
2. **Mid-Campaign** – Leaderboard rankings stabilize
3. **Final Week** – Last chance for contributions
4. **Campaign End** – All XP finalized, rankings locked
5. **Payout** – USDC distributed to all participants

### Countdown Features

- ⏰ Dashboard shows "Days Remaining"
- 📧 Email reminders at 7 days, 3 days, 1 day
- 🕐 Final submissions accepted until 23:59 UTC on end date

> [SCREENSHOT PLACEHOLDER: Campaign timeline graphic showing key milestones]

---

## Payout Process

### After Campaign Ends

#### 1. XP Finalization (1-2 days)
- All pending contributions scored
- Final daily accumulation calculated
- Leaderboard locked

#### 2. Payout Calculation (1 day)
- Total pool divided by total XP
- Individual shares calculated
- Minimum payout: $10 USDC (if you have XP)

#### 3. Distribution (3-5 days)
- USDC sent to registered Vara wallet
- Email notification when sent
- Transaction hash provided

### Payout Formula

```
Your USDC = (Your Total XP / Campaign Total XP) × Pool Size
```

### Payout Tiers

| Rank | Typical Payout (example with $10k pool) |
|------|----------------------------------------|
| Top 1% | $500-2,000 |
| Top 5% | $200-500 |
| Top 10% | $100-200 |
| Top 25% | $50-100 |
| All others | $10-50 |

### Tax & Compliance

- ⚠️ You are responsible for tax reporting in your jurisdiction
- ⚠️ GrowStreams does not withhold taxes
- ⚠️ Payouts over $600 may require KYC (US users)

> [SCREENSHOT PLACEHOLDER: Payout summary showing final rank, XP, and USDC amount]

---

## Campaign FAQ

### General Questions

**Q: Can I change my track after registering?**  
A: No, track selection is permanent for the campaign.

**Q: What if I don't have a GitHub account?**  
A: Create one at github.com – it's free. You need it for the OSS track.

**Q: Do I need to tweet every day?**  
A: No. Quality matters more than frequency. Focus on valuable content.

**Q: Can I edit a PR after submission?**  
A: Yes. PRs are re-scored when you push updates.

**Q: What happens if a stream I created goes to a campaign participant?**  
A: Using GrowStreams doesn't earn campaign XP directly. You earn XP through code contributions (OSS) or content creation (Content).

### XP & Rewards

**Q: Is the join bonus only for new users?**  
A: Yes, the +10 XP join bonus is one-time per wallet.

**Q: Can I see other participants' contributions?**  
A: You can see their total XP and contribution count, but not individual items for privacy.

**Q: What if I join late?**  
A: You can register anytime before the campaign ends, but you'll have less time to accumulate XP.

### Technical Questions

**Q: Do paused PRs still earn daily XP?**  
A: No, only active (unmerged, open) PRs accumulate daily XP.

**Q: Can I delete a low-scoring post and repost?**  
A: Deleted tweets are marked as DELETED but score remains. Reposting won't earn new XP.

---

## Support & Resources

### Need Help?

- 💬 **Discord:** [Join our Discord](https://discord.gg/growstreams)
- 🐦 **Twitter:** [@GrowStreams](https://twitter.com/GrowStreams)
- 📧 **Email:** support@growstreams.xyz
- 🐛 **Bug Reports:** [GitHub Issues](https://github.com/BlockXAI/GrowStreams_Backend/issues)

### Documentation

- 📖 [User Guide](https://growstreams.xyz/docs)
- 💻 [Developer Docs](https://github.com/BlockXAI/GrowStreams_Backend)
- 🔗 [API Reference](https://growstreams-core-production.up.railway.app/api/docs)

---

**GrowStreams Campaign** – Build, Create, Earn  
*Last Updated: March 2026*
