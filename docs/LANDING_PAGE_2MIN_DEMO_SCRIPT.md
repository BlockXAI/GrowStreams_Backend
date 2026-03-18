# GrowStreams Landing Page Demo (2-Minute Script)

**Target Duration:** 2:00 minutes  
**Audience:** Developers, Projects, Web3 Community  
**Goal:** Showcase GrowStreams landing page and drive integration interest

---

## 🎬 SECTION 1: Hero - Per-Second Money Streaming (0:00 - 0:30)

### [0:00 - 0:30] **Opening Hook & Live Demo**

**VISUAL:**
- Fade in to hero section
- "Per-Second Money Streaming" headline with blur effect on "Streaming"
- Live visualization showing:
  - Left: `company.vara` 
  - Center: Animated flow line with particles
  - Right: `alice.vara`
  - "🟢 Streaming" badge
  - Withdrawable: `$1247.8111` (live counter)
  - Buffer: `8h remaining`
- Green "🟢 LIVE ON VARA TESTNET" badge pulsing
- Buttons visible: "Integrate (10 min)" and "Launch App"

**NARRATION:**
> "This is GrowStreams. Watch this - company.vara is streaming money to alice.vara right now. Not tomorrow. Not in batches. Right now. Per second. The withdrawable balance updates continuously - $1247... $1248... this is real-time token streaming on Vara Network."

**ON SCREEN TEXT (overlay):**
- "💰 Live: $1247.8111 → $1248.0223"
- "⚡ Per-second settlement"
- "🌐 Live on Vara Testnet"

**VISUAL HIGHLIGHT:**
- Circle the incrementing balance counter
- Zoom in on flowing particles
- Show "8h remaining" buffer indicator

**NARRATION (CONTINUED):**
> "Real-time token streaming on Vara. Composable smart contracts for payroll, subscriptions, bounties, grants, and revenue sharing. Let me show you how it works."

**VISUAL TRANSITION:**
- Smooth scroll down

---

## 💡 SECTION 2: Money Streaming, Simplified (0:30 - 0:55)

### [0:30 - 0:55] **Core Features**

**VISUAL:**
- Scroll to "Money streaming, simplified" section
- Headline appears with gradient on "simplified"
- Subtitle: "A generalized streaming smart-contract system on Vara. Token-agnostic, composable, and production-ready."
- Three feature cards appear:

**CARD 1: Token Agnostic**
- Icon: Stacked layers
- "Stream USDC, VARA, or any token. One protocol, all tokens."
- Badges: "● USDC  ● VARA  ● Any ERC-20"

**CARD 2: Buffer & Solvency**  
- Icon: Shield/Protection
- "Deposit-based model ensures solvency. Transparent."

**CARD 3: Composable**
- Icon: Code brackets
- "Plug into any app. StreamCore, SplitsRouter - modular and flexible."

**NARRATION:**
> "GrowStreams makes streaming simple. First, it's token-agnostic. Stream USDC, VARA, or any token you want. Second, buffer and solvency - deposits ensure streams never fail. And third, it's composable. Plug our contracts into your dApp like LEGO blocks."

**VISUAL EFFECTS:**
- Hover over each card (1-2 seconds each)
- Token badges animate in
- Code icon pulses

**ON SCREEN TEXT:**
- "✅ Any Token"
- "✅ Always Solvent"
- "✅ Plug & Play"

**VISUAL TRANSITION:**
- Scroll down to use cases

---

## 🎯 SECTION 3: Use Cases - Endless Possibilities (0:55 - 1:20)

### [0:55 - 1:20] **Real-World Applications**

**VISUAL:**
- "One protocol, endless possibilities" headline
- Gradient text on "endless possibilities" (purple/pink)
- Subtitle: "From payroll to gaming rewards — stream money for any use case."
- Six use case cards appear in grid:

**Row 1:**
1. **Bounties & Gigs** 🎯
   - "AI-verified work triggers instant streams"
   - Badges: Work-triggered, Instant pay, AI-verified

2. **Streaming Payroll** ⏰
   - "Per-second salary with pause/resume and clawback rules"
   - Badges: HR, Recurring, Pause/Resume

3. **Subscriptions** 💳
   - "Pay-as-you-go billing. Cancel anytime, stop paying instantly"
   - Badges: Pay-as-you-go, Cancel anytime

**Row 2:**
4. **Revenue Share** 💰
   - "Route incoming funds to teams, contributors, and referrers automatically via splits"
   - Badges: Routing, Teams, Referrals

5. **Vesting Streams** 🔒
   - "Linear token unlock with configurable stoppability"
   - Badges: Linear unlock, Configurable

6. **Grants & Milestones** 🏆
   - "Milestone-based streaming with transparent runway tracking"
   - Badges: Milestone-based, Transparent

**NARRATION:**
> "What can you build? Bounties - verified work triggers instant streams. Payroll - pay employees every second. Subscriptions - users pay only for what they use. Revenue sharing - split income automatically. Token vesting - linear unlocks, per second. Grants - milestone-based funding with transparent tracking. One protocol. Infinite use cases."

**VISUAL EFFECTS:**
- Cards appear with stagger animation (0.1s delay each)
- Quick hover over each card
- Badges fade in

**VISUAL TRANSITION:**
- Scroll to integration section

---

## 💻 SECTION 4: Integrate in 10 Minutes (1:20 - 1:50)

### [1:20 - 1:50] **Developer Integration**

**VISUAL:**
- "Integrate in 10 minutes" headline (gradient on "10 minutes")
- Subtitle: "Four steps to start streaming payments on Vara."
- Split screen layout:
  - **Left:** Step-by-step guide with code
  - **Right:** Contract addresses and supported tokens

**STEP 00: Install SDK**
```javascript
npm i @growstreams/sdk

import { GrowStreams } from '@growstreams/sdk';
const client = new GrowStreams({
  network: 'vara-testnet'
});
```

**STEP 01: Deposit & Buffer**
```javascript
await client.vault.deposit({
  token: 'USDC',
  amount: '1000'
});
```

**CONTRACT ADDRESSES (Right Side):**
```
StreamCore:  0xf9a...2e1
TokenVault:  0xc2c...af2
SplitsRouter: 0x51a...6e7

Network: Vara Testnet
```

**SUPPORTED TOKENS:**
- USDC
- VARA  
- DOT

**NARRATION:**
> "Integration takes ten minutes. Step one: Install the SDK with npm. Step two: Deposit tokens and set a buffer. Step three: Create a stream with a recipient and flow rate. Step four: Done. You're streaming. Here are the deployed contract addresses on Vara testnet. StreamCore handles streams. TokenVault manages deposits. SplitsRouter handles revenue splits. All live, all production-ready."

**VISUAL EFFECTS:**
- Code types out (fast, 0.5 seconds per line)
- Contract addresses highlight one by one
- Token badges pulse
- Copy button appears on hover

**ON SCREEN TEXT:**
- "⚡ 4 steps"
- "⏱️ 10 minutes"
- "📦 npm i @growstreams/sdk"

**VISUAL (code continues scrolling):**
```javascript
// Step 02: Create stream
await client.streams.create({
  recipient: 'alice.vara',
  flowRate: '100', // per hour
  token: 'USDC'
});

// Step 03: Stream is live!
```

**NARRATION (CONTINUED):**
> "That's it. Three function calls. Deposit, create, stream. Your users are now getting paid per second."

**VISUAL TRANSITION:**
- Zoom out to show full page
- Scroll back to hero section

---

## 🚀 SECTION 5: Call to Action (1:50 - 2:00)

### [1:50 - 2:00] **Closing & CTA**

**VISUAL:**
- Return to hero section
- "Integrate (10 min)" button glows/pulses
- "Launch App" button visible
- "Join Pilot" link below
- Bottom shows contract info:
  - "📍 STATUS: Vara Testnet (Live)"
  - "📜 CONTRACTS: StreamCore + TokenVault"

**NARRATION:**
> "GrowStreams. Per-second money streaming on Vara. Integrate in ten minutes. Launch your app today. The future of payments is streaming."

**VISUAL:**
- Cursor hovers over "Integrate (10 min)" button
- Button glows brighter
- Quick flash of URL: `growstreams.xyz`

**ON SCREEN FINAL TEXT:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
     🌊 GrowStreams 🌊

  Integrate in 10 minutes

🌐 growstreams.xyz/app/grow
📚 docs.growstreams.io
💻 github.com/growstreams
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**VISUAL:**
- Fade to black
- Logo lingers for 1 second
- End

**MUSIC OUTRO:**
- Music swells and fades

---

## 🎥 Production Notes

### Timing Breakdown
- **Section 1:** Hero (0:30) - 25%
- **Section 2:** Features (0:25) - 20%
- **Section 3:** Use Cases (0:25) - 20%
- **Section 4:** Integration (0:30) - 25%
- **Section 5:** CTA (0:10) - 10%
- **Total:** 2:00 minutes

### Screen Recording Setup

**Resolution:** 1920x1080 (Full HD)  
**Frame Rate:** 60fps (for smooth animations)  
**Browser:** Chrome or Firefox (best rendering)  
**Zoom:** 100% (or 110% for text readability)  
**Extensions:** Hide browser extensions bar  
**Cursor:** Show cursor, slow deliberate movements

### Animation Speed

**Scroll Speed:**
- Slow and smooth (not jarring)
- 2-3 seconds per full section
- Pause on key content (1-2 seconds)

**Code Typing:**
- Fast but readable (0.3s per line)
- OR instant reveal with highlight effect

**Card Animations:**
- Stagger by 0.1 seconds
- Fade in + slight slide up
- Hover effects when mentioned

### Visual Effects to Add (Post-Production)

1. **Live Counter Animation**
   - Make the $1247.8111 actually increment
   - Add glow effect to counter
   - Smooth number transitions

2. **Flow Particles**
   - Enhance particle flow animation
   - Add glow trail
   - Speed matches "streaming" vibe

3. **Text Highlights**
   - Circle key phrases
   - Underline important stats
   - Arrow pointing to CTA buttons

4. **Code Syntax Highlighting**
   - Color code (green strings, blue keywords, etc.)
   - Line numbers optional
   - Cursor blink in terminal

5. **Badge Animations**
   - Token badges (USDC, VARA, DOT) fade in
   - Use case badges pulse slightly
   - Checkmarks animate

6. **Transition Effects**
   - Smooth fade between sections
   - Slight zoom on feature cards
   - Parallax scroll effect (optional)

### Voiceover Direction

**Tone:** Professional, confident, enthusiastic  
**Pace:** Medium-fast (120-140 WPM)  
**Energy:** High, building excitement  
**Emphasis Words:**
- "Per-second" (hero)
- "Real-time" (hero)
- "Live" (hero)
- "Token-agnostic" (features)
- "Composable" (features)
- "Infinite use cases" (use cases)
- "Ten minutes" (integration)
- "Production-ready" (integration)

**Pauses:**
- After "This is GrowStreams" (0.5s)
- After showing live counter (1s)
- After "One protocol" (0.3s)
- After listing use cases (0.5s)
- Before final CTA (0.5s)

### Music & Sound Design

**Background Music:**
- Style: Modern electronic, upbeat
- BPM: 120-130
- Mood: Innovative, energetic
- Volume: -18dB (quiet background)

**Sound Effects:**
- Soft "whoosh" for scroll transitions
- Gentle "ping" for appearing badges
- Low "hum" for streaming animation
- "Tick" for counter updates (subtle)
- "Chime" for final CTA

**Audio Mix:**
- Music: Background only, no lyrics
- Voiceover: Clear and prominent
- Sound effects: Subtle accents
- No audio during final logo hold

### Text Overlays Style

**Font:** Modern sans-serif (Inter, Poppins)  
**Size:** Large (48-60px for main text)  
**Color:** White or teal (brand color)  
**Background:** Semi-transparent dark box  
**Animation:** Fade in (0.3s), hold (2s), fade out (0.3s)  

**When to Use:**
- Key statistics: "$1247 → $1248"
- Feature highlights: "✅ Any Token"
- Call to action: "Integrate in 10 min"
- URLs at end

### Camera Movements (Screen Recording)

**Static Shots:**
- Hero section (full view)
- Feature cards (grid view)
- Code blocks (centered)

**Slow Scrolls:**
- Hero → Features (smooth)
- Features → Use Cases (smooth)
- Use Cases → Integration (smooth)

**Zooms:**
- Zoom in on live counter (1.2x)
- Zoom in on code (1.1x)
- Zoom out for full page view at end

**Pans:**
- None needed (avoid unless necessary)

### Highlight Techniques

1. **Circle Annotations**
   - Live counter
   - "10 minutes" text
   - CTA buttons

2. **Box Highlights**
   - Contract addresses
   - Code snippets
   - Token badges

3. **Arrows**
   - Pointing to streaming flow
   - Pointing from code to result
   - Pointing to CTA

4. **Glow Effects**
   - Around buttons
   - Around live elements
   - Around key statistics

---

## 📱 Alternative Cuts

### 60-Second Version (Social Media)
**Structure:**
- Hero (15s)
- Features (10s)
- Use cases (10s) - show 3 only
- Integration (15s) - code only
- CTA (10s)

### 90-Second Version (YouTube Pre-Roll)
**Structure:**
- Hero (20s)
- Features (15s)
- Use cases (15s) - show 4
- Integration (25s)
- CTA (15s)

### 30-Second Teaser (Twitter/X)
**Structure:**
- Hero with live counter (10s)
- "Integrate in 10 minutes" text (5s)
- Quick code flash (5s)
- CTA (10s)

---

## 🎬 Shot List (Detailed)

### Shot 1: Title/Logo (0:00-0:03)
- **Duration:** 3 seconds
- **Visual:** GrowStreams logo fade in
- **Audio:** Music starts
- **Text:** None

### Shot 2: Hero Section (0:03-0:20)
- **Duration:** 17 seconds
- **Visual:** Full hero, live streaming animation
- **Audio:** Voiceover intro + music
- **Focus:** Live counter, streaming visualization

### Shot 3: Counter Highlight (0:20-0:25)
- **Duration:** 5 seconds
- **Visual:** Zoom on counter
- **Audio:** Voiceover emphasizing real-time
- **Effect:** Circle highlight, glow

### Shot 4: CTA Buttons (0:25-0:30)
- **Duration:** 5 seconds
- **Visual:** Show "Integrate (10 min)" button
- **Audio:** Voiceover transition
- **Effect:** Button pulse

### Shot 5: Scroll to Features (0:30-0:33)
- **Duration:** 3 seconds
- **Visual:** Smooth scroll transition
- **Audio:** Music transition
- **Effect:** Fade/slide

### Shot 6: Features Overview (0:33-0:45)
- **Duration:** 12 seconds
- **Visual:** Three feature cards
- **Audio:** Voiceover explaining features
- **Effect:** Card hover, badge animations

### Shot 7: Feature Cards Detail (0:45-0:55)
- **Duration:** 10 seconds
- **Visual:** Quick pan across cards
- **Audio:** Voiceover listing features
- **Effect:** Checkmarks appear

### Shot 8: Scroll to Use Cases (0:55-0:58)
- **Duration:** 3 seconds
- **Visual:** Smooth scroll
- **Audio:** Music continues
- **Effect:** Fade transition

### Shot 9: Use Cases Grid (0:58-1:15)
- **Duration:** 17 seconds
- **Visual:** Six use case cards
- **Audio:** Voiceover listing use cases
- **Effect:** Stagger animation, badge pulses

### Shot 10: Use Case Highlight (1:15-1:20)
- **Duration:** 5 seconds
- **Visual:** Hover over Bounties & Payroll cards
- **Audio:** Voiceover emphasis
- **Effect:** Card lift, glow

### Shot 11: Scroll to Integration (1:20-1:23)
- **Duration:** 3 seconds
- **Visual:** Smooth scroll
- **Audio:** Music builds
- **Effect:** Slide transition

### Shot 12: SDK Installation (1:23-1:35)
- **Duration:** 12 seconds
- **Visual:** Code block, npm command
- **Audio:** Voiceover SDK explanation
- **Effect:** Code typing animation

### Shot 13: Contract Addresses (1:35-1:45)
- **Duration:** 10 seconds
- **Visual:** Right side panel with addresses
- **Audio:** Voiceover listing contracts
- **Effect:** Highlight each address

### Shot 14: Full Code Flow (1:45-1:50)
- **Duration:** 5 seconds
- **Visual:** Complete code example
- **Audio:** Voiceover: "Three function calls"
- **Effect:** Line-by-line highlight

### Shot 15: Final CTA (1:50-1:57)
- **Duration:** 7 seconds
- **Visual:** Back to hero, buttons glow
- **Audio:** Voiceover final pitch
- **Effect:** Button pulse, glow intensifies

### Shot 16: URLs & End Card (1:57-2:00)
- **Duration:** 3 seconds
- **Visual:** URLs appear, fade to logo
- **Audio:** Music outro
- **Text:** All links visible

---

## ✅ Pre-Production Checklist

### Website/Landing Page
- [ ] Latest version deployed
- [ ] All animations working smoothly
- [ ] Live counter actually updates
- [ ] All links functional
- [ ] Mobile responsive (if showing mobile view)
- [ ] No console errors
- [ ] Fast load times

### Recording Environment
- [ ] Screen recording software ready (OBS/ScreenFlow)
- [ ] 1920x1080 resolution set
- [ ] 60fps enabled
- [ ] Clean browser window
- [ ] Extensions hidden
- [ ] Bookmarks bar hidden
- [ ] Dark mode enabled (matches design)

### Content Preparation
- [ ] Voiceover script finalized
- [ ] Voice recorded (or artist booked)
- [ ] Background music selected
- [ ] Sound effects gathered
- [ ] Logo animations prepared
- [ ] Text overlay templates created

### Practice Run
- [ ] Full walkthrough rehearsed
- [ ] Timing verified (exactly 2:00)
- [ ] Scroll speed optimized
- [ ] Cursor movements planned
- [ ] Hover effects tested
- [ ] All animations trigger correctly

---

## 📊 Success Metrics

### Video Performance
- **Views:** 3,000+ in first week
- **Watch Time:** 75%+ completion rate
- **Engagement:** 200+ likes, 20+ comments
- **CTR:** 25%+ click to website

### Website Impact
- **Traffic:** +300% to landing page
- **CTA Clicks:** 30%+ click "Integrate (10 min)"
- **Documentation Views:** +200% to docs site
- **GitHub Stars:** +100 stars on SDK repo

### Developer Adoption
- **SDK Installs:** 200+ npm downloads
- **Integration Requests:** 50+ pilot signups
- **Discord Joins:** 100+ new developer members

---

## 🎨 Brand Guidelines

### Color Palette
- **Primary:** Teal/Green `#00FFA3` (CTA, accents)
- **Secondary:** Purple/Pink gradient (headlines)
- **Background:** Dark `#0A0F1C` (navy/black)
- **Text:** White `#FFFFFF` (primary)
- **Text Secondary:** Gray `#9CA3AF` (subtitles)

### Typography
- **Headlines:** Bold, large (48-72px)
- **Subheadings:** Medium (24-32px)
- **Body:** Regular (16-18px)
- **Code:** Monospace (14-16px)

### Iconography
- **Style:** Minimal, outlined
- **Color:** Teal or white
- **Size:** Consistent across cards
- **Animation:** Subtle pulse or glow

---

**Script Version:** 1.0  
**Duration:** 2:00 minutes  
**Last Updated:** 2026-02-27  
**Prepared By:** GrowStreams Team  
**Status:** Ready for Production 🎬
