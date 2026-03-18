# GrowStreams Platform Demo Video Script

**Target Duration:** 5-6 minutes  
**Audience:** Developers, Web3 Community, Potential Users  
**Goal:** Demonstrate the complete GrowStreams platform functionality from wallet connection to live streaming

---

## 🎬 SECTION 1: Introduction & Wallet Connection (0:00 - 0:45)

### [0:00 - 0:15] **Opening & Platform Overview**

**VISUAL:**
- Fade in to GrowStreams application homepage/login screen
- Show GrowStreams logo and branding
- Clean, modern dark UI visible

**NARRATION:**
> "Welcome to GrowStreams - the first native VARA streaming protocol. Today I'll walk you through the complete platform, showing you how to mint tokens, manage your vault, create streams, and verify everything on-chain. Let's dive in."

**ON SCREEN TEXT:**
- "🌊 GrowStreams Platform Demo"
- "Live on Vara Testnet"

---

### [0:15 - 0:45] **Connect Admin Wallet**

**VISUAL:**
- Click "Connect Wallet" button
- Wallet selector modal appears
- Select wallet (SubWallet/Polkadot.js)
- Wallet extension popup appears
- Select "Sarthak" account from wallet
- Approve connection
- Success animation - wallet connected

**NARRATION:**
> "First, let's connect our wallet. I'll click 'Connect Wallet' and select my admin account - Sarthak. This is the token admin account that has special permissions for managing the GROW token faucet and minting."

**ON SCREEN:**
```
━━━━━━━━━━━━━━━━━━━━━━━━
   Connect Your Wallet
   
   Select Account:
   
   ● Sarthak (Admin)
     0x6774528...
     Balance: 15.234 VARA
   
   [Connect]
━━━━━━━━━━━━━━━━━━━━━━━━
```

**VISUAL AFTER CONNECTION:**
- Top right shows: "👤 Sarthak" with address
- Green checkmark animation
- "Vara Testnet ●" indicator

**NARRATION (CONTINUED):**
> "Connected! You can see my wallet address in the top right, and we're on Vara Testnet. Now let's explore the dashboard."

---

## 📊 SECTION 2: Dashboard Overview (0:45 - 1:30)

### [0:45 - 1:30] **Dashboard Tour**

**VISUAL:**
- Click "Dashboard" in sidebar (if not already there)
- Dashboard loads with multiple panels:
  - GROW Balance card
  - Vault Balance card
  - Inflows card
  - Outflows card
  - Net Flow card
  - Recent Activity/Streams list

**NARRATION:**
> "Here's the dashboard - your streaming control center. At the top, we have key metrics. My GROW balance shows how many tokens I currently hold in my wallet. The Vault balance shows tokens I've deposited and ready to stream. Inflows show streams coming to me. Outflows show streams I'm sending. And Net Flow is the combined rate - am I gaining or losing tokens per second?"

**ON SCREEN - Dashboard Layout:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GrowStreams Dashboard | Sarthak (Admin)

━━━ Balances ━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────┬─────────────┬─────────────┐
│ GROW Balance│ Vault Balance│   Inflows   │
│  0.00 GROW  │  0.00 GROW   │  0 streams  │
│             │              │  +0 GROW/sec│
└─────────────┴─────────────┴─────────────┘

┌─────────────┬─────────────────────────────┐
│  Outflows   │        Net Flow             │
│  0 streams  │      0.00 GROW/sec          │
│  -0 GROW/sec│    ━━━━━━━━━                │
└─────────────┴─────────────────────────────┘

━━━ Active Streams (0) ━━━━━━━━━━━━━━━━━━━
  No active streams yet.
  
[+ Create Stream]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**VISUAL HIGHLIGHTS:**
- Hover over each card briefly
- Show "0.00 GROW" in balance (fresh account)
- Show "0 streams" in inflows/outflows
- Emphasize we're starting fresh

**NARRATION (CONTINUED):**
> "Right now, everything is at zero because this is a fresh start. Let's change that. First, we need to get some GROW tokens."

**VISUAL TRANSITION:**
- Click "GROW Token" in sidebar

---

## 🪙 SECTION 3: GROW Token - Minting & Approval (1:30 - 3:15)

### [1:30 - 2:00] **Faucet - Mint GROW Tokens**

**VISUAL:**
- GROW Token page loads
- "Getting Started" wizard visible at top:
  - ✅ Get GROW (highlighted)
  - ⭕ Approve
  - ⭕ Deposit
  - 🎯 Stream
- Tabs below: Faucet | Approve | Vault | Transfer | Admin
- "Faucet" tab is active

**NARRATION:**
> "The GROW Token page shows us the complete onboarding flow. Step one: Get GROW tokens from the faucet. I'll mint myself 10,000 GROW tokens."

**ON SCREEN - Faucet Tab:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚰 Faucet

Mint test GROW tokens to your wallet.

Amount to Mint:
┌─────────────────────────────────┐
│ 10000                     GROW  │
└─────────────────────────────────┘

Faucet allows 10,000 GROW per request.

          [Mint GROW]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**VISUAL ACTION:**
- Type "10000" in amount field
- Click "Mint GROW" button
- Transaction pending modal appears
- Wallet extension popup for approval
- Sign transaction
- Success notification: "✅ Minted 10,000 GROW"

**NARRATION (CONTINUED):**
> "I'll enter 10,000 and click 'Mint GROW'. The wallet asks me to sign the transaction... and done! 10,000 GROW tokens minted successfully."

**VISUAL:**
- Dashboard balance updates in background (if visible)
- "GROW Balance: 10,000 GROW" shown somewhere

---

### [2:00 - 2:30] **Approve Vault Access**

**VISUAL:**
- Click "Approve" tab
- Approve interface appears

**NARRATION:**
> "Before we can deposit tokens into our streaming vault, we need to approve the vault contract to access our tokens. This is a standard ERC20-style approval. I'll approve 10,000 GROW."

**ON SCREEN - Approve Tab:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Approve

Allow the Vault to access your GROW tokens.

Amount to Approve:
┌─────────────────────────────────┐
│ 10000                     GROW  │
└─────────────────────────────────┘

Current Allowance: 0 GROW

        [Approve Vault]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**VISUAL ACTION:**
- Amount field shows "10000"
- Click "Approve Vault" button
- Transaction pending
- Sign in wallet
- Success: "✅ Vault approved for 10,000 GROW"

**NARRATION (CONTINUED):**
> "Approval granted. The vault can now access my tokens when I deposit them."

---

### [2:30 - 2:50] **Deposit to Vault**

**VISUAL:**
- Click "Vault" tab
- Deposit interface appears

**NARRATION:**
> "Now let's deposit tokens into our streaming vault. This vault is where all streamable funds are held. I'll deposit all 10,000 GROW."

**ON SCREEN - Vault Tab:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Vault

Deposit GROW tokens to start streaming.

Your Vault Balance: 0 GROW
Wallet Balance: 10,000 GROW

Amount to Deposit:
┌─────────────────────────────────┐
│ 10000                     GROW  │
└─────────────────────────────────┘

          [Deposit] [Withdraw]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**VISUAL ACTION:**
- Enter "10000"
- Click "Deposit"
- Transaction pending
- Sign transaction
- Success: "✅ Deposited 10,000 GROW to vault"

**VISUAL:**
- Vault balance updates: "10,000 GROW"
- Wallet balance updates: "0 GROW"
- Dashboard vault card updates in background

**NARRATION (CONTINUED):**
> "Perfect! My vault now has 10,000 GROW ready to stream. You can see the vault balance updated here, and if we go back to the dashboard..."

---

### [2:50 - 3:15] **Admin Panel - Manage Faucet Mode**

**VISUAL:**
- Click "Admin" tab
- Admin panel appears (only visible to token admin)

**NARRATION:**
> "Since I'm the token admin, I have access to the Admin panel. Here I can manage who can mint tokens from the faucet. There are two modes: Whitelist Only - where only approved addresses can mint, or Public - where anyone can mint."

**ON SCREEN - Admin Tab:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️ Admin Panel

Manage faucet access and whitelist.
Only visible to the token admin.

━━━ Faucet Mode ━━━━━━━━━━━━━━━━
Only whitelisted addresses can mint.

[ Whitelist Only ] [  Public  ]
                     (toggle)

━━━ Whitelist (0 addresses) ━━━━

Add address to whitelist:
┌─────────────────────────────────┐
│ 0x... address to whitelist      │
└─────────────────────────────────┘
                     [+ Add]

No addresses whitelisted yet.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**VISUAL ACTION:**
- Show current mode: "Whitelist Only"
- Click toggle to switch to "Public"
- Success notification: "✅ Faucet mode set to Public"

**NARRATION (CONTINUED):**
> "Right now it's on Whitelist Only. Let me switch it to Public mode so anyone can mint test tokens. There we go - faucet is now public."

**VISUAL ACTION (OPTIONAL):**
- Switch back to "Whitelist Only"
- Show adding an address to whitelist:
  - Paste test wallet address: "0x1234...5678"
  - Click "Add"
  - Address appears in whitelist
  - Success: "✅ Address added to whitelist"

**NARRATION (CONTINUED):**
> "I can also add specific addresses to the whitelist. Let me add my test wallet address here... added. Now this address can mint even in whitelist mode."

---

## 🌊 SECTION 4: Create Stream (3:15 - 4:30)

### [3:15 - 3:35] **Show Empty Test Wallet Dashboard**

**VISUAL:**
- Open new browser tab/window (or split screen)
- Show GrowStreams app with different wallet connected
- OR show test wallet address dashboard view

**NARRATION:**
> "Before we create a stream, let me show you the test wallet's dashboard. This is a fresh account with no streams."

**ON SCREEN - Test Wallet Dashboard:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GrowStreams Dashboard | Test Wallet

━━━ Balances ━━━━━━━━━━━━━━━━━━━

GROW Balance: 0.00 GROW
Vault Balance: 0.00 GROW

━━━ Incoming Streams (0) ━━━━━━━
  
  No incoming streams yet.
  Share your address to receive!

━━━ Outgoing Streams (0) ━━━━━━━

  No active streams.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**NARRATION (CONTINUED):**
> "As you can see - zero balance, no incoming streams, completely empty. Now let's create a stream to this wallet from the admin account."

**VISUAL TRANSITION:**
- Switch back to Sarthak admin account tab/window

---

### [3:35 - 4:10] **Create Stream from Admin to Test Wallet**

**VISUAL:**
- Back on admin dashboard
- Click "Streams" in sidebar OR click "+ Create Stream" button
- Stream creation form appears

**NARRATION:**
> "Back on the admin account, I'll create a new stream. Click 'Streams' and then 'Create Stream'."

**ON SCREEN - Create Stream Form:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌊 Create New Stream

Recipient Address:
┌─────────────────────────────────┐
│ 0x1234...5678                   │
└─────────────────────────────────┘

Token: GROW (default)

Flow Rate:
┌─────────────────────────────────┐
│ 100                       GROW/hr│
└─────────────────────────────────┘

Duration (optional):
┌─────────────────────────────────┐
│ 24                        hours  │
└─────────────────────────────────┘

Initial Deposit:
┌─────────────────────────────────┐
│ 2400                      GROW   │
└─────────────────────────────────┘
(Auto-calculated: 100 GROW/hr × 24hr)

Buffer: 1 hour (recommended)

       [Cancel] [Create Stream]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**VISUAL ACTION:**
- Paste test wallet address: "0x1234...5678"
- Set flow rate: "100 GROW/hr"
- Set duration: "24 hours"
- Initial deposit auto-calculates to 2400 GROW
- Review details
- Click "Create Stream"

**NARRATION:**
> "I'll enter the test wallet address as the recipient. Flow rate: 100 GROW per hour. Duration: 24 hours. The platform automatically calculates the initial deposit needed - 2400 GROW plus a 1-hour buffer. That's 2500 GROW total. Let me create the stream..."

**VISUAL:**
- Transaction pending modal
- Sign transaction in wallet
- Transaction processing
- Success animation: "✅ Stream created successfully!"
- Stream ID shown: "Stream #1"

**NARRATION (CONTINUED):**
> "Stream created! You can see it's assigned Stream ID number 1."

---

### [4:10 - 4:30] **Show Stream Appearing in Test Wallet**

**VISUAL:**
- Switch to test wallet tab/window
- Dashboard automatically updates (or refresh page)
- Incoming stream appears in "Incoming Streams" section

**NARRATION:**
> "Now let's switch back to the test wallet dashboard. Watch what happens..."

**ON SCREEN - Test Wallet Dashboard (Updated):**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GrowStreams Dashboard | Test Wallet

━━━ Balances ━━━━━━━━━━━━━━━━━━━

Inflows: 1 stream
Rate: +100 GROW/hr (+0.0278 GROW/sec)

━━━ Incoming Streams (1) ━━━━━━━

┌──────────────────────────────────┐
│ 🌊 Stream #1                     │
│ From: Sarthak (0x6774528...)     │
│ Rate: 100 GROW/hr                │
│ Streamed: 0.156 GROW             │
│ Started: 2 minutes ago           │
│                                  │
│ [Withdraw] [View Details]        │
└──────────────────────────────────┘
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**VISUAL HIGHLIGHT:**
- Stream card appears with animation
- "Streamed" counter is live - shows increasing balance
- Highlight the counter updating: 0.156... 0.157... 0.158 GROW

**NARRATION:**
> "There it is! The stream is now live on the test wallet. You can see it's from Sarthak, streaming at 100 GROW per hour. And look at the 'Streamed' amount - it's updating in real-time. Every second, the balance increases. This is real streaming."

**VISUAL (OPTIONAL):**
- Click "View Details" to show more info
- Show stream status: Active
- Show withdrawable balance
- Show time remaining

---

## 🔍 SECTION 5: On-Chain Verification (4:30 - 5:15)

### [4:30 - 5:15] **Verify Stream on Vara IDEA Explorer**

**VISUAL:**
- Open new tab
- Navigate to Vara IDEA explorer: `https://idea.gear-tech.io/`
- OR show the explorer is already open

**NARRATION:**
> "Finally, let's verify this stream exists on-chain. I'll open the Vara IDEA explorer - this is the official Vara Network block explorer."

**VISUAL:**
- Show Vara IDEA homepage
- Network selector shows "Vara Testnet"
- Search bar at top

**NARRATION (CONTINUED):**
> "First, I need the StreamCore program ID. Let me get that from our platform..."

**VISUAL:**
- Switch back to GrowStreams app
- Click on stream details OR go to footer/settings
- Copy StreamCore program ID: "0xabcd...ef12..." (example)
- Switch back to Vara IDEA

**ON SCREEN:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Vara Network IDEA Explorer

Search: Programs, Accounts, Messages

┌─────────────────────────────────┐
│ 0xabcd...ef12                   │🔍
└─────────────────────────────────┘

Network: [Vara Testnet ▼]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**VISUAL ACTION:**
- Paste StreamCore program ID into search
- Press Enter or click search
- Program page loads

**NARRATION:**
> "I'll paste the StreamCore program ID and search... here it is."

**ON SCREEN - Program Page:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Program: StreamCore

Address: 0xabcd...ef12
Type: Sails Smart Contract
Status: ✅ Active

━━━ Recent Messages ━━━━━━━━━━━━

📤 CreateStream
   From: 0x6774528... (Sarthak)
   Time: 2 minutes ago
   Status: Success ✅
   
📤 GetStream
   From: 0x1234...5678 (Test Wallet)
   Time: 1 minute ago
   Status: Success ✅

━━━ State ━━━━━━━━━━━━━━━━━━━━━

Total Streams: 1
Active Streams: 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**VISUAL HIGHLIGHT:**
- Highlight "CreateStream" message
- Click on it to expand details
- Show message payload with stream parameters

**NARRATION (CONTINUED):**
> "Perfect! Here's our StreamCore contract. You can see the recent messages - there's the 'CreateStream' transaction we just sent. It's marked as successful. The state shows 1 total stream, 1 active stream. This proves everything is on-chain and verifiable."

**VISUAL (OPTIONAL):**
- Click "State" tab
- Show raw state data
- Highlight stream #1 data structure
- Show sender, receiver, flow rate, etc.

**NARRATION (FINAL):**
> "And if I check the contract state, I can see all the stream details - sender, receiver, flow rate, timestamps - everything stored on the Vara blockchain. This is real, verifiable, decentralized streaming."

---

## 🎯 SECTION 6: Conclusion & CTA (5:15 - 5:45)

### [5:15 - 5:45] **Recap & Call to Action**

**VISUAL:**
- Quick montage showing:
  - Dashboard with updated balances
  - Live streaming counter
  - Vault balance
  - Stream on explorer
- Fade to GrowStreams logo

**NARRATION:**
> "Let's recap what we just did. We connected our admin wallet, checked the dashboard, minted 10,000 GROW tokens from the faucet, approved and deposited them to our vault, managed the faucet settings in the admin panel, created a live stream to a test wallet, watched the balance update in real-time, and verified everything on-chain using the Vara explorer."

**ON SCREEN TEXT:**
```
✅ Wallet Connected
✅ GROW Tokens Minted
✅ Vault Deposited
✅ Admin Panel Configured
✅ Stream Created
✅ Real-time Updates
✅ On-Chain Verified
```

**NARRATION (CONTINUED):**
> "This is GrowStreams - real-time, per-second token streaming on Vara Network. No more batch payments. No more manual transfers. Just continuous value flow."

**VISUAL:**
- GrowStreams logo
- Website URLs fade in

**ON SCREEN:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
     🌊 GrowStreams 🌊

   Try it now on Vara Testnet

🌐 app.growstreams.xyz
📚 docs.growstreams.io
💻 github.com/growstreams
🐦 @GrowStreams

  Built with 💙 on Vara Network
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**NARRATION (FINAL):**
> "Try it yourself at app.growstreams.xyz. Connect your wallet, mint some tokens, and start streaming. The future of payments is here."

**VISUAL:**
- Fade to black
- End screen

---

## 🎥 Production Notes

### Total Duration
- **Section 1:** Intro & Wallet (0:45)
- **Section 2:** Dashboard (0:45)
- **Section 3:** GROW Token Operations (1:45)
- **Section 4:** Create Stream (1:15)
- **Section 5:** On-Chain Verification (0:45)
- **Section 6:** Conclusion (0:30)
- **Total:** 5:45 minutes

### Recording Setup

**Required Screens/Tabs:**
1. GrowStreams app (admin wallet - Sarthak)
2. GrowStreams app (test wallet - separate window or tab)
3. Vara IDEA Explorer

**Screen Recording:**
- Record entire screen OR use window switching
- 1920x1080 resolution
- 30fps minimum (60fps preferred)
- Show cursor movements clearly

**Browser Setup:**
- Clean browser window (hide extensions bar)
- Zoom level: 100% or 110% for readability
- Enable dark mode (matches app theme)
- Pre-connect both wallets before recording

### Pre-Recording Checklist

**Admin Wallet (Sarthak):**
- [ ] Connected to Vara Testnet
- [ ] Has sufficient VARA for gas fees (5+ VARA)
- [ ] GROW balance at 0 (for clean demo)
- [ ] Vault balance at 0
- [ ] Token admin permissions verified

**Test Wallet:**
- [ ] Connected to Vara Testnet
- [ ] Has some VARA for transactions
- [ ] GROW balance at 0
- [ ] No existing streams
- [ ] Address copied and ready to paste

**Platform Setup:**
- [ ] Latest version deployed to app.growstreams.xyz
- [ ] All features working (faucet, approve, deposit, streaming)
- [ ] Admin panel accessible
- [ ] Real-time counters functioning
- [ ] No console errors

**Explorer Setup:**
- [ ] Vara IDEA accessible
- [ ] Network set to Vara Testnet
- [ ] StreamCore program ID copied
- [ ] TokenVault program ID copied (if needed)

### Transaction Timing

**Important:** Allow time for transactions to finalize!

- **Mint GROW:** ~5-10 seconds
- **Approve Vault:** ~5-10 seconds
- **Deposit to Vault:** ~5-10 seconds
- **Create Stream:** ~5-10 seconds
- **State Updates:** ~2-5 seconds

**Tip:** Add subtle "waiting for transaction..." overlay during these moments, or speed up the video slightly (1.2x) during wait times in post-production.

### Visual Effects to Add

1. **Transaction Pending Indicators**
   - Loading spinner
   - "Processing..." text
   - Progress bar

2. **Success Animations**
   - Checkmark animation
   - Green glow effect
   - Confetti (for major milestones like stream creation)

3. **Live Counter Highlight**
   - Circle/highlight the incrementing balance
   - Add "+0.0278 GROW/sec" label with arrow

4. **Callout Boxes**
   - Explain key terms (vault, flow rate, buffer)
   - Show calculations (100 GROW/hr = 0.0278 GROW/sec)

5. **Split Screen**
   - Show admin and test wallet side-by-side
   - Especially during stream creation/appearance

### Voiceover Style

**Tone:** Educational, enthusiastic, professional  
**Pace:** Medium (not too fast, give viewers time to follow)  
**Energy:** Medium-high, building excitement at key moments  
**Clarity:** Clearly enunciate technical terms (vault, faucet, GROW)

**Key Emphasis Points:**
- "Real-time" (multiple times)
- "Per-second streaming"
- "On-chain verified"
- "Live counter updating"
- "100 GROW per hour"

### Music & Audio

**Background Music:**
- Style: Modern electronic, upbeat tech
- Volume: Low (background only, -20dB)
- Avoid during voiceover explanations
- Increase volume slightly during montages

**Sound Effects:**
- Click sounds for button presses
- "Success" chime for completed transactions
- Subtle "tick" for live counter updates
- "Whoosh" for page transitions

### Text Overlays

**When to Use:**
- Transaction confirmations: "✅ Minted 10,000 GROW"
- Key metrics: "Flow Rate: 100 GROW/hr"
- Addresses: "Recipient: 0x1234...5678"
- Status updates: "Stream #1 Active"

**Style:**
- Font: Modern sans-serif (matches app UI)
- Color: White or brand teal
- Background: Semi-transparent dark box
- Animation: Fade in/out, not slide

### Common Issues & Solutions

**Issue:** Transaction fails  
**Solution:** Have backup recording ready, or re-record section

**Issue:** Counter doesn't update  
**Solution:** Wait 5-10 seconds, refresh page, ensure testnet connection

**Issue:** Wallet extension popup blocked  
**Solution:** Allow popups before recording, or use picture-in-picture

**Issue:** Explorer page loads slowly  
**Solution:** Pre-load the program page in a hidden tab

---

## 📱 Alternative Versions

### Short Version (2 minutes)
**For social media:**
1. Wallet connection (15s)
2. Mint & deposit (30s)
3. Create stream (30s)
4. Show live counter (30s)
5. CTA (15s)

### Technical Deep-Dive (10 minutes)
**For developers:**
- Add contract interaction details
- Show raw transaction data
- Explain SCALE encoding
- Show state queries
- Demonstrate error handling

### User Tutorial (8 minutes)
**For new users:**
- Slower pace
- More explanation of each step
- Include "Why?" for each action
- Add troubleshooting tips
- Include FAQ section at end

---

## 🎬 Detailed Shot List

### Shot 1: Title Card (0:00-0:05)
- **Visual:** GrowStreams logo on dark background
- **Audio:** Music starts
- **Text:** "GrowStreams Platform Demo"

### Shot 2: Connect Wallet (0:05-0:25)
- **Visual:** Click connect, select wallet, approve
- **Audio:** Voiceover introduction
- **Focus:** Wallet selection UI

### Shot 3: Wallet Connected (0:25-0:30)
- **Visual:** Success state, show address in header
- **Audio:** Voiceover: "Connected as Sarthak"
- **Effect:** Green checkmark animation

### Shot 4: Dashboard Overview (0:30-0:50)
- **Visual:** Full dashboard view, hover over cards
- **Audio:** Voiceover explaining each metric
- **Focus:** Balance cards (all at 0)

### Shot 5: Navigate to GROW Token (0:50-1:00)
- **Visual:** Click sidebar, page transition
- **Audio:** Music transition
- **Effect:** Smooth page slide

### Shot 6: Mint GROW Tokens (1:00-1:20)
- **Visual:** Faucet tab, enter amount, click mint
- **Audio:** Voiceover explaining minting
- **Focus:** Input field and button

### Shot 7: Approve Vault (1:20-1:40)
- **Visual:** Approve tab, approve transaction
- **Audio:** Voiceover explaining approval
- **Focus:** Transaction flow

### Shot 8: Deposit to Vault (1:40-2:00)
- **Visual:** Vault tab, deposit transaction
- **Audio:** Voiceover explaining vault
- **Focus:** Balance updates

### Shot 9: Admin Panel (2:00-2:30)
- **Visual:** Admin tab, faucet mode toggle, whitelist
- **Audio:** Voiceover explaining admin features
- **Focus:** Toggle and whitelist management

### Shot 10: Empty Test Wallet (2:30-2:45)
- **Visual:** Switch to test wallet dashboard
- **Audio:** Voiceover: "Empty wallet"
- **Focus:** No streams message

### Shot 11: Create Stream Form (2:45-3:15)
- **Visual:** Stream creation form, fill details
- **Audio:** Voiceover explaining parameters
- **Focus:** Flow rate calculation

### Shot 12: Stream Created (3:15-3:25)
- **Visual:** Success notification, stream ID
- **Audio:** Success chime
- **Effect:** Confetti animation

### Shot 13: Stream Appears (3:25-3:45)
- **Visual:** Test wallet dashboard updates
- **Audio:** Voiceover: "Stream is live"
- **Focus:** Live counter incrementing

### Shot 14: Live Counter Highlight (3:45-4:00)
- **Visual:** Zoom on streaming counter
- **Audio:** Voiceover: "Real-time updates"
- **Effect:** Circle highlight, slow-mo counter

### Shot 15: Vara IDEA Explorer (4:00-4:30)
- **Visual:** Navigate to explorer, search program
- **Audio:** Voiceover explaining verification
- **Focus:** Program details

### Shot 16: On-Chain Messages (4:30-4:50)
- **Visual:** Show CreateStream message
- **Audio:** Voiceover: "Everything on-chain"
- **Focus:** Message details

### Shot 17: Contract State (4:50-5:05)
- **Visual:** State tab, stream data
- **Audio:** Voiceover: "Verifiable data"
- **Focus:** Stream #1 details

### Shot 18: Recap Montage (5:05-5:25)
- **Visual:** Quick cuts of all major steps
- **Audio:** Voiceover recap + music swell
- **Effect:** Fast-paced, energetic

### Shot 19: CTA & Logo (5:25-5:40)
- **Visual:** GrowStreams logo, URLs
- **Audio:** Voiceover final CTA
- **Text:** All links and social handles

### Shot 20: End Card (5:40-5:45)
- **Visual:** Black screen or logo hold
- **Audio:** Music outro
- **Text:** "Subscribe for more"

---

## ✅ Post-Production Checklist

### Video Editing
- [ ] Trim dead space between actions
- [ ] Add smooth transitions between sections
- [ ] Speed up transaction wait times (1.2-1.5x)
- [ ] Add text overlays for key moments
- [ ] Include callout boxes for explanations
- [ ] Add visual effects (checkmarks, highlights)

### Audio Editing
- [ ] Record clean voiceover
- [ ] Remove background noise
- [ ] Normalize audio levels
- [ ] Add background music
- [ ] Add sound effects
- [ ] Mix all audio tracks

### Color & Effects
- [ ] Color grade for consistency
- [ ] Enhance UI contrast if needed
- [ ] Add glow effects to buttons
- [ ] Animate live counters (if needed)
- [ ] Add particle effects for streaming

### Final Export
- [ ] Export at 1920x1080, 30fps minimum
- [ ] MP4 format with H.264 codec
- [ ] High bitrate for quality (8-10 Mbps)
- [ ] Create thumbnail image
- [ ] Add video chapters/timestamps
- [ ] Upload with proper title and description

---

## 📊 Success Metrics

### Video Performance
- **Views:** 2,000+ in first week
- **Watch Time:** 70%+ completion rate
- **Engagement:** 100+ likes, 50+ comments
- **CTR:** 20%+ click to platform

### Platform Impact
- **New Users:** +500 wallet connections
- **Token Mints:** +1,000 faucet requests
- **Streams Created:** +200 active streams
- **Developer Interest:** +50 SDK installs

---

**Script Version:** 1.0  
**Duration:** 5:45 minutes  
**Last Updated:** 2026-02-27  
**Prepared By:** GrowStreams Team  
**Status:** Ready for Production 🎬
