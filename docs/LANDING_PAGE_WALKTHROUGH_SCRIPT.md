# GrowStreams Landing Page Demonstration (Video Script)

**Target Duration:** 3:00 minutes  
**Audience:** Developers, Projects, VCs, Web3 Community  
**Goal:** Showcase the GrowStreams landing page design and core value propositions

---

## 🎬 SECTION 1: Hero / Homepage (0:00 - 0:45)

### [0:00 - 0:45] **First Impressions - Per-Second Money Streaming**

**VISUAL:**
- Fade in to homepage hero section
- "Per-Second Money Streaming" headline with animated blur/glow effect
- Live streaming visualization showing:
  - `company.vara` (left) streaming to `alice.vara` (right)
  - Withdrawable balance: `$1247.8118`
  - Buffer: `8h remaining`
  - Animated flow line with particles moving left to right
- Green "🟢 LIVE ON VARA TESTNET" badge pulsing
- Background with subtle gradient and geometric patterns

**NARRATION:**
> "Welcome to GrowStreams - the future of payments on Vara Network. This is per-second money streaming. Not batch payments. Not manual transfers. Real-time, continuous value flow. Watch this live stream between company.vara and alice.vara. Every second, tokens move. The balance updates in real-time. This isn't a demo - this is happening right now on Vara testnet."

**ON SCREEN ELEMENTS TO HIGHLIGHT:**
- "Per-Second Money Streaming" headline
- Live streaming animation (company → alice)
- Withdrawable balance counter
- "8h remaining" buffer indicator
- "LIVE ON VARA TESTNET" badge

**VISUAL CALLOUTS:**
- Circle/highlight the flowing animation line
- Zoom in slightly on the balance counter
- Show "Streaming" badge in green

**NARRATION (CONTINUED):**
> "Real-time token streaming on Vara. Composable smart contracts for payroll, subscriptions, bounties, grants, and revenue sharing. Let me show you what makes this possible."

**BUTTONS VISIBLE:**
- "Integrate (10 min)" - bright green/teal primary CTA
- "Launch App" - secondary button
- "Join Pilot" link below

**VISUAL TRANSITION:**
- Smooth scroll down OR click "Protocol" in navigation

---

## 🔧 SECTION 2: Protocol - How Streams Work (0:45 - 1:30)

### [0:45 - 1:30] **Technical Overview**

**VISUAL:**
- Navigate to "Protocol" page
- "How streams work" headline appears
- Subtitle: "A generalized streaming smart-contract system on Vara. Token-agnostic, composable, and designed for per-second settlement."
- Animated diagram shows:
  - Left node: "S" (alice.vara) - Sender
  - Right node: "R" (bob.vara) - Receiver
  - Connecting line with animated flow
  - Rate display: "USDC $8.48527/sec"

**NARRATION:**
> "Here's how it works. Alice wants to pay Bob. Instead of sending one lump sum, she creates a stream. She sets the flow rate - in this case, 8 dollars and 48 cents per second. The stream opens. And from that moment, value flows continuously. Bob can withdraw anytime. The stream keeps running until Alice stops it or the buffer runs out."

**ON SCREEN - Diagram Animation:**
```
[S] alice.vara ━━━━━━━━→ [R] bob.vara
              USDC $8.48527/sec
```

**VISUAL HIGHLIGHT:**
- Show the flow rate animating
- Particles/tokens flowing from S to R
- Counter incrementing on receiver side

**SCROLL DOWN TO:**
- "Stream lifecycle" section heading appears

**NARRATION (CONTINUED):**
> "The protocol handles everything. Creation, deposits, withdrawals, pausing, liquidation. All on-chain. All composable. Other contracts can integrate streaming as a primitive. It's not just a payment app - it's infrastructure."

**ON SCREEN TEXT APPEARS:**
- ✅ Create streams
- ✅ Deposit/Withdraw
- ✅ Pause/Resume
- ✅ Auto-liquidation
- ✅ Cross-contract calls

**VISUAL TRANSITION:**
- Scroll to next section OR click "Use Cases" in nav

---

## 💼 SECTION 3: Use Cases - Endless Possibilities (1:30 - 2:15)

### [1:30 - 2:15] **Real-World Applications**

**VISUAL:**
- "USE CASES" label appears
- Main headline: "One protocol, endless possibilities"
- Gradient text on "endless possibilities" (purple/pink)
- Subtitle: "From payroll to gaming rewards — stream money for any use case. Here are the apps you can build with GrowStreams."

**NARRATION:**
> "So what can you build with streaming? Everything. Bounties and gigs - submit code, pass verification, get paid per second. No more waiting weeks for bounty payouts. Developers earn as they work."

**VISUAL - Bounties & Gigs Card:**
- Left side shows text description:
  - "Bounties & Gigs"
  - "Submit code, pass AI verification, and get paid per-second."
  - "GrowStreams' flagship use case combines quality verification with real-time streaming payouts for developer bounties."
  - Badge: "🔧 AI-verified work triggers instant streams"

**VISUAL - Right side card (zoomed):**
- Green briefcase icon
- "Bounties & Gigs" heading
- "Powered by GrowStreams Protocol"
- Clean card design with dark background

**SCROLL DOWN** (if more use cases are shown):

**NARRATION (CONTINUED):**
> "But it doesn't stop there. Payroll - pay employees every second instead of every month. Subscriptions - users pay for exactly what they use. Grants - funding streams in real-time. Vesting schedules - token unlocks happen continuously. Revenue sharing - split income as it arrives. One protocol. Infinite possibilities."

**ON SCREEN - Use Case Cards Appearing:**
- 💼 Payroll & Salaries
- 📺 Subscriptions & SaaS
- 🎮 Gaming Rewards
- 💰 Grants & Funding
- 📊 Revenue Sharing
- 🔒 Token Vesting

**VISUAL CALLOUTS:**
- Hover effect over each card
- Brief pause on each (0.5 seconds)
- Smooth animation between cards

**VISUAL TRANSITION:**
- Click "Developers" in navigation

---

## 👨‍💻 SECTION 4: Developers - Build with GrowStreams (2:15 - 2:45)

### [2:15 - 2:45] **Developer Resources**

**VISUAL:**
- "DEVELOPERS" badge appears (green code symbol)
- Headline: "Build with GrowStreams"
- Subtitle: "SDK, contract addresses, quickstart guides, and examples. Go from zero to first stream in under 10 minutes."

**NARRATION:**
> "For developers, we've made integration trivial. Our JavaScript SDK gets you started in minutes. One npm install, a few lines of code, and you're streaming tokens."

**ON SCREEN - Three CTA Buttons:**
```
[⚡ Quickstart]  [📘 SDK Reference]  [GitHub ↗]
```

**VISUAL - Code Block Appears:**
```
> npm install @growstreams/sdk
```

**NARRATION (CONTINUED):**
> "Install the SDK. Import it into your app. Create a stream with three function calls: deposit, create, withdraw. That's it. Full TypeScript support, complete documentation, example projects on GitHub. Everything you need to integrate streaming into your dApp today."

**VISUAL - Code Example Animation (optional, if showing code):**
```typescript
import { GrowStreamsSDK } from '@growstreams/sdk';

// Create stream
const stream = await sdk.createStream({
  receiver: 'bob.vara',
  flowRate: '1000000', // tokens per second
  duration: 86400 // 1 day
});
```

**ON SCREEN TEXT:**
- ⚡ 10-minute quickstart
- 📦 NPM package ready
- 📚 Full documentation
- 🔧 Example projects
- 🌐 Testnet live now

**VISUAL TRANSITION:**
- Click "Ecosystem" in navigation

---

## 🌐 SECTION 5: Ecosystem - Join the Movement (2:45 - 3:00)

### [2:45 - 3:00] **Ecosystem & CTA**

**VISUAL:**
- "ECOSYSTEM" badge appears
- Headline: "Join the ecosystem"
- Gradient text on "ecosystem" (orange/yellow)
- Subtitle: "Partner with GrowStreams to bring real-time payments to your users. Integrate, co-build, and grow together."

**NARRATION:**
> "GrowStreams isn't just a protocol - it's an ecosystem. We're partnering with DAOs, DeFi projects, developer platforms, and Web3 communities to bring real-time streaming everywhere."

**VISUAL - Section appears:**
- "Who we work with"
- Subtitle: "GrowStreams is designed for composability. Here's how different partners integrate."

**VISUAL - Partner Category Cards (if visible):**
- 🏦 DeFi Protocols
- 🎯 DAO Tooling
- 🎮 Gaming Platforms
- 💼 Freelance Markets
- 🔧 Dev Tools

**NARRATION (CONTINUED):**
> "If you're building on Vara - or planning to - streaming should be part of your stack. Join our pilot program. Integrate the SDK. Build the future of payments with us."

**VISUAL - CTA Section:**
- "Launch App" button (bright green)
- "Join Pilot" button (secondary)
- "Read Docs" link

**FINAL VISUAL:**
- Zoom out to show full ecosystem page
- Navigation bar visible at top
- Footer with links visible at bottom

**NARRATION (FINAL):**
> "GrowStreams. Per-second money streaming on Vara. Live now. Build now. Stream now."

**END SCREEN:**
- Fade to GrowStreams logo
- URLs appear:
  - growstreams.io
  - docs.growstreams.io
  - github.com/growstreams
  - @GrowStreams

---

## 🎥 Production Notes

### Timing Breakdown
- **Section 1:** Hero/Home (0:45)
- **Section 2:** Protocol (0:45)
- **Section 3:** Use Cases (0:45)
- **Section 4:** Developers (0:30)
- **Section 5:** Ecosystem (0:15)
- **Total:** 3:00 minutes

### Navigation Style
**Two Options:**

**Option A: Smooth Scrolling (Recommended)**
- Start at top of homepage
- Scroll through each section naturally
- Feels like one continuous page
- More cinematic

**Option B: Nav Bar Clicking**
- Click "Protocol" → jump to section
- Click "Use Cases" → jump to section
- Click "Developers" → jump to section
- More explicit, shows navigation UX

**Recommendation:** Use Option A (smooth scroll) for main sections, but show nav bar clicks for specific CTAs like "Quickstart" or "GitHub"

### Visual Effects to Add

1. **Live Counter Animation**
   - Hero section balance should animate/increment
   - Shows it's truly "live"

2. **Flow Particles**
   - Animated dots/particles flowing from sender to receiver
   - Glowing trail effect
   - Speed matches flow rate conceptually

3. **Card Hover Effects**
   - Use case cards should have subtle glow/lift on hover
   - Shows interactivity

4. **Text Gradient Animation**
   - "endless possibilities" should have animated gradient
   - "ecosystem" should shimmer

5. **Button Pulse**
   - "Launch App" button should have subtle pulse/glow
   - Draws eye to primary CTA

### Screen Recording Setup

**Resolution:** 1920x1080 (Full HD)  
**Browser:** Chrome (cleanest rendering)  
**Zoom Level:** 100% (or 110% for better readability)  
**Window:** Full screen, hide bookmarks bar  
**Cursor:** Show cursor, slow movements  

### Mouse Movements

**Good practices:**
- Move cursor slowly and deliberately
- Pause cursor on key elements for 1-2 seconds
- Use cursor to "point" at important text
- Hover over buttons to show interactive states
- Don't move cursor erratically

### Highlighting Techniques

1. **Circle Overlays**
   - Draw attention to specific elements
   - Use sparingly (2-3 times max)

2. **Zoom-In Effect**
   - Zoom into specific sections
   - Great for code examples or detailed diagrams

3. **Spotlight/Vignette**
   - Darken everything except focused area
   - Useful for complex pages

4. **Animated Arrows**
   - Point to flow direction
   - Show relationships between elements

### Typography & Text Overlays

**When to add text overlays:**
- Emphasize key statistics
- Highlight feature names
- Show simplified explanations
- Add CTAs

**Style guide:**
- Font: Modern sans-serif (Inter, Poppins, or similar)
- Size: Large enough to read on mobile (48px+ for headlines)
- Color: Match brand (teal/green for primary, white for secondary)
- Animation: Fade in, not slide (less distracting)

### Voiceover Direction

**Tone:** Professional but approachable, confident, enthusiastic  
**Pace:** Medium (120-140 words per minute)  
**Energy:** High-medium, building excitement  
**Pronunciation:**
- "Vara" = VAH-rah
- "GrowStreams" = Grow-Streams (two distinct words)
- "USDC" = U-S-D-C (spell it out)

**Emphasis points:**
- "Per-second" (hero section)
- "Real-time" (multiple times)
- "Live now" (ecosystem section)
- "Composable" (protocol section)
- "10 minutes" (developer section)

### Music & Sound Design

**Music Track:**
- Style: Modern electronic, upbeat corporate
- Energy: Medium-high
- Mood: Innovative, forward-thinking
- BPM: 110-130
- No vocals

**Sound Effects (optional):**
- Subtle "whoosh" for page transitions
- Soft "tick" for counter incrementing
- Light "ping" for buttons appearing
- Flow "hum" for streaming animation

**Audio Mix:**
- Music: -18dB (background only)
- Voiceover: -3dB (clear and prominent)
- Sound effects: -12dB (subtle accents)

---

## 📱 Responsive Considerations

### Desktop Version (Primary)
- 1920x1080 recording
- Show full nav bar
- Show all sections expanded
- Highlight hover states

### Mobile Version (Optional Secondary Video)
- 375x812 (iPhone viewport)
- Show hamburger menu
- Show stacked layout
- Show touch interactions instead of hover
- Vertical video format (9:16)

---

## 🎯 Call-to-Action Strategy

### Primary CTA
**"Launch App"** - appears in:
- Hero section (top right nav)
- Hero section (secondary button)
- Ecosystem section

**Visual treatment:** Bright teal/green, glowing effect

### Secondary CTAs
- "Integrate (10 min)" - Hero
- "Quickstart" - Developers
- "SDK Reference" - Developers
- "Join Pilot" - Ecosystem

**Visual treatment:** Outlined buttons, white text

### Tertiary CTAs
- "Join Pilot" link - Hero
- "GitHub" - Developers
- "Read Docs" - Footer

**Visual treatment:** Text links, subtle underline on hover

### CTA Timing in Video
- **0:40** - First mention of "Launch App"
- **1:25** - Mention use cases, imply CTA
- **2:30** - Explicitly mention "Quickstart"
- **2:55** - Final CTA push: "Build now"

---

## 🎬 Detailed Shot List

### Shot 1: Hero Section Intro (0:00-0:20)
- **Type:** Screen recording
- **Duration:** 20 seconds
- **Camera:** Static, full page view
- **Action:** Fade in, live animation playing
- **Focus:** Streaming visualization, balance counter
- **Audio:** Voiceover intro + music start

### Shot 2: Hero CTA Highlight (0:20-0:30)
- **Type:** Screen recording with zoom
- **Duration:** 10 seconds
- **Camera:** Slight zoom on buttons area
- **Action:** Cursor hovers over "Integrate (10 min)"
- **Focus:** Primary CTAs
- **Audio:** Voiceover continuation

### Shot 3: Status Badge (0:30-0:40)
- **Type:** Screen recording with highlight
- **Duration:** 10 seconds
- **Camera:** Zoom to "LIVE ON VARA TESTNET" badge
- **Action:** Badge pulses
- **Focus:** Live status
- **Audio:** Voiceover: "This is live"

### Shot 4: Transition to Protocol (0:40-0:45)
- **Type:** Animated transition
- **Duration:** 5 seconds
- **Camera:** Smooth scroll down
- **Action:** Section change
- **Focus:** Smooth UX
- **Audio:** Music transition

### Shot 5: Protocol Diagram (0:45-1:10)
- **Type:** Screen recording with animation
- **Duration:** 25 seconds
- **Camera:** Centered on diagram
- **Action:** Flow animation plays, particles move
- **Focus:** Technical visualization
- **Audio:** Voiceover explanation

### Shot 6: Stream Lifecycle (1:10-1:30)
- **Type:** Screen recording
- **Duration:** 20 seconds
- **Camera:** Scroll to lifecycle section
- **Action:** Show lifecycle checkpoints
- **Focus:** Protocol features
- **Audio:** Voiceover feature list

### Shot 7: Use Cases Hero (1:30-1:45)
- **Type:** Screen recording
- **Duration:** 15 seconds
- **Camera:** Full section view
- **Action:** Headline appears
- **Focus:** "Endless possibilities" gradient text
- **Audio:** Voiceover intro

### Shot 8: Bounties Card (1:45-2:00)
- **Type:** Screen recording with focus
- **Duration:** 15 seconds
- **Camera:** Zoom on Bounties & Gigs card
- **Action:** Hover effect, show details
- **Focus:** Primary use case
- **Audio:** Voiceover explanation

### Shot 9: More Use Cases (2:00-2:15)
- **Type:** Screen recording or motion graphics
- **Duration:** 15 seconds
- **Camera:** Rapid card previews
- **Action:** Show 4-6 cards quickly
- **Focus:** Variety of use cases
- **Audio:** Voiceover list + fast-paced music

### Shot 10: Developer Section (2:15-2:35)
- **Type:** Screen recording
- **Duration:** 20 seconds
- **Camera:** Full developer section
- **Action:** Show CTAs, code block
- **Focus:** Easy integration
- **Audio:** Voiceover SDK pitch

### Shot 11: Code Example (2:35-2:45)
- **Type:** Code animation or screen recording
- **Duration:** 10 seconds
- **Camera:** Zoom on code block
- **Action:** Code types out (if animated)
- **Focus:** Simplicity
- **Audio:** Voiceover: "Three lines of code"

### Shot 12: Ecosystem (2:45-2:55)
- **Type:** Screen recording
- **Duration:** 10 seconds
- **Camera:** Full ecosystem section
- **Action:** Show partner categories
- **Focus:** Community & growth
- **Audio:** Voiceover ecosystem pitch

### Shot 13: Final CTA (2:55-3:00)
- **Type:** Screen recording with zoom
- **Duration:** 5 seconds
- **Camera:** Zoom on "Launch App" button
- **Action:** Button glows/pulses
- **Focus:** Clear action
- **Audio:** Voiceover final CTA

### Shot 14: End Screen (3:00-3:05)
- **Type:** Motion graphics
- **Duration:** 5 seconds
- **Camera:** Fade to logo
- **Action:** URLs appear
- **Focus:** Brand & links
- **Audio:** Music outro

---

## ✅ Pre-Production Checklist

### Design Finalization
- [ ] Ensure all landing page sections are finalized
- [ ] Test all animations (streaming visualization, counters)
- [ ] Verify responsive behavior (desktop view)
- [ ] Check all copy for typos
- [ ] Ensure all CTAs link to correct destinations

### Recording Preparation
- [ ] Set up screen recording software (OBS, ScreenFlow, Camtasia)
- [ ] Configure 1920x1080 resolution
- [ ] Test frame rate (30fps minimum, 60fps preferred)
- [ ] Set up clean browser window (no extensions visible)
- [ ] Clear browser cache for fastest load times
- [ ] Prepare mouse movements (practice run)

### Content Preparation
- [ ] Write final voiceover script with exact timing
- [ ] Record voiceover (or book voice actor)
- [ ] Select background music track
- [ ] Prepare logo animations
- [ ] Create end screen graphics

### Technical Setup
- [ ] Deploy latest version to staging/production URL
- [ ] Verify all animations work smoothly
- [ ] Test page load speed
- [ ] Ensure no console errors
- [ ] Set up VPN if needed (for consistent server location)

### Post-Production
- [ ] Edit video with transitions
- [ ] Add text overlays/callouts
- [ ] Color grade for consistency
- [ ] Mix audio (voiceover + music)
- [ ] Add sound effects
- [ ] Export in multiple formats (MP4, WebM)
- [ ] Create thumbnail image
- [ ] Add YouTube chapters/timestamps

---

## 🎨 Style & Branding Guide

### Color Palette (from screenshots)
- **Primary:** Teal/Green `#00D9A3` (CTAs, accents)
- **Secondary:** Dark Navy/Black `#0A0F1C` (background)
- **Accent:** Purple/Pink gradient (headings)
- **Text:** White `#FFFFFF` (primary text)
- **Text Secondary:** Gray `#8B8B8B` (descriptions)

### Typography (observed)
- **Headlines:** Large, bold, modern sans-serif
- **Subheadings:** Medium weight, slightly condensed
- **Body:** Regular weight, good line height
- **Code:** Monospace, syntax highlighting

### Animation Style
- **Speed:** Smooth, not too fast
- **Easing:** Ease-in-out (natural feel)
- **Particles:** Flowing, continuous
- **Counters:** Smooth incremental updates
- **Transitions:** Fade or slide, no jarring cuts

### Visual Motifs
- **Streaming:** Always present (flow lines, particles, counters)
- **Network:** Nodes and connections (alice.vara ↔ bob.vara)
- **Real-time:** Live badges, updating numbers
- **Developer-focused:** Code blocks, terminal aesthetics

---

## 📊 Success Metrics

### Video Performance Goals
- **Views:** 5,000+ in first month
- **Watch time:** 70%+ completion rate
- **Engagement:** 5%+ like/comment rate
- **CTR:** 15%+ click to landing page

### Landing Page Metrics (Post-Video)
- **Traffic:** +200% to landing page
- **Scroll depth:** 80%+ see "Developers" section
- **CTA clicks:** 20%+ click "Launch App"
- **Developer signups:** 100+ new SDK installs

### Platform Distribution
- **YouTube:** Main long-form (3:00)
- **Twitter:** Cut to 60s highlights
- **LinkedIn:** Professional version (2:30, focus on use cases)
- **Discord/Telegram:** Full version with discussion
- **Website embed:** Header of docs site

---

## 🔄 Alternative Versions

### Short Version (60 seconds)
**For social media:**
- Hero: 15s
- Protocol: 15s
- Use Cases: 15s
- Developers: 10s
- CTA: 5s

### Developer-Focused Version (2 minutes)
**For hackathons, dev communities:**
- Skip ecosystem section
- Double time on Developers section
- Show actual code integration
- Terminal commands
- GitHub repo tour

### Investor/VC Version (2 minutes)
**For fundraising:**
- Add market opportunity slide
- Add team/traction slide
- Emphasize "endless possibilities"
- Show growth metrics
- Add "Join Pilot" CTA

---

**Script Version:** 1.0  
**Duration:** 3:00 minutes  
**Last Updated:** 2026-02-26  
**Prepared By:** GrowStreams Team  
**Status:** Ready for Production 🎬
