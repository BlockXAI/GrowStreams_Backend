# GrowStreams Foundation Demo Script
**Two-Wallet Live Stream Demonstration**

> **Duration:** 8-10 minutes  
> **Setup:** Two browser windows side-by-side (Sender/Admin + Receiver)  
> **Network:** Vara Testnet  
> **URL:** https://growstreams-v2.vercel.app/app

---

## Pre-Demo Setup (Do Before Recording)

### Wallet 1: Admin/Sender Account
- Connect wallet with sufficient VARA for gas
- Note address for script

### Wallet 2: Receiver Account  
- Connect in separate browser/incognito window
- Note address for script
- Start with 0 GROW balance (clean slate)

---

## DEMO SCRIPT

### **[00:00-00:30] Introduction & Overview**

**[Screen: Landing page or Dashboard]**

> "Welcome to GrowStreams, a real-time money streaming protocol built on Vara Network. Today I'll demonstrate our complete token streaming lifecycle using two wallets - showing how tokens flow continuously, per-second, from sender to receiver on-chain."

**[Show both browser windows side-by-side]**

> "On the left, we have our sender wallet [show address]. On the right, our receiver wallet [show address]. Let's walk through the complete flow."

---

### **[00:30-01:30] Step 1: Get GROW Tokens (Sender Wallet)**

**[Left screen: Navigate to GROW Token page]**

> "First, our sender needs GROW tokens. GrowStreams uses a custom VFT token on Vara for streaming."

**[Click 'Get GROW Tokens' or Faucet button]**

> "We have a testnet faucet that mints 1,000 GROW tokens per request with a 5-minute cooldown."

**[Execute faucet request]**

> "The faucet is server-signed for convenience, but all other operations require wallet signatures for security."

**[Wait for confirmation, show balance update]**

> "Perfect - we now have 1,000 GROW tokens. You can see our balance updated here in real-time."

---

### **[01:30-02:30] Step 2: Approve Vault (Sender Wallet)**

**[Navigate to Vault page]**

> "Before we can stream, we need to approve the TokenVault contract to manage our GROW tokens. This is a standard ERC20-style approval pattern."

**[Click 'Approve Vault' or show approval interface]**

> "We'll approve 100 GROW tokens for the vault to use."

**[Sign transaction in wallet]**

> "Notice this requires a wallet signature - we're giving permission for the vault to pull tokens on our behalf when we create streams."

**[Wait for confirmation]**

> "Approval confirmed. The vault can now escrow our tokens for streaming."

---

### **[02:30-03:30] Step 3: Deposit to Vault (Sender Wallet)**

**[Still on Vault page]**

> "Now let's deposit tokens into our vault balance. The vault acts as an escrow - it holds tokens and allocates them to active streams."

**[Enter deposit amount: 50 GROW]**

> "We'll deposit 50 GROW tokens into the vault."

**[Sign transaction]**

> "This transaction calls the vault's deposit function, which pulls tokens from our wallet using the approval we just granted."

**[Show vault balance update]**

> "Excellent - our vault balance now shows 50 GROW available for streaming. Notice the distinction between 'total deposited' and 'available' - available is what's not currently allocated to active streams."

---

### **[03:30-05:00] Step 4: Create Stream (Sender Wallet)**

**[Navigate to Streams page, click 'Create Stream']**

> "Now for the core feature - creating a real-time token stream."

**[Fill in stream creation form]**

- **Receiver Address:** [paste receiver wallet address]
  > "We're streaming to our second wallet here."

- **Token:** GROW Token [auto-selected]
  > "Streaming GROW tokens."

- **Flow Rate:** 0.001 GROW/second (1,000,000 units/sec)
  > "The flow rate is 0.001 GROW per second - that's 3.6 GROW per hour, or 86.4 GROW per day."

- **Initial Deposit:** 10 GROW
  > "We need to deposit at least 1 hour of buffer time. I'm depositing 10 GROW, which gives us about 2.7 hours of runway."

**[Click 'Create Stream', sign transaction]**

> "Creating the stream... This transaction creates the stream state on-chain and allocates 10 GROW from our vault balance to this stream."

**[Wait for confirmation, show stream details]**

> "Stream created! Notice the stream ID, status 'Active', and the real-time balance counter. The 'Streamed' amount is updating every second as tokens flow."

**[Point to vault balance]**

> "Back in our vault, you can see 'allocated' increased by 10 GROW, and 'available' decreased accordingly."

---

### **[05:00-06:30] Step 5: Receiver Sees Incoming Stream**

**[Switch to right screen: Receiver wallet]**

**[Navigate to Dashboard or Streams page]**

> "Now let's switch to our receiver wallet. Without any action from the receiver, they can already see the incoming stream."

**[Show 'Incoming Streams' or receiver stream list]**

> "Here's our stream - notice it shows the sender address, flow rate, and most importantly, the 'Withdrawable Balance' that's growing in real-time."

**[Let it run for 10-15 seconds, show balance incrementing]**

> "Watch this number - it's increasing every second. This is real on-chain streaming. The receiver has already earned [X] GROW tokens in just these few seconds."

**[Show stream details page]**

> "The stream details show the full lifecycle: when it started, how much has been streamed, how much buffer time remains before it runs out of funds."

---

### **[06:30-07:30] Step 6: Receiver Withdraws Tokens**

**[Still on receiver screen]**

> "The receiver can withdraw their accrued tokens at any time without stopping the stream."

**[Click 'Withdraw' button]**

> "Let's withdraw now."

**[Sign transaction]**

> "This transaction pulls the accrued tokens from the stream into the receiver's wallet."

**[Show GROW balance update on receiver wallet]**

> "Perfect - the receiver's GROW balance just increased. They now own these tokens outright and can transfer, trade, or use them however they want."

**[Show stream still active]**

> "Notice the stream is still active and continues to accrue. The 'Withdrawn' amount updated, but the stream keeps flowing."

---

### **[07:30-08:30] Step 7: Stream Management (Sender Wallet)**

**[Switch back to left screen: Sender wallet]**

**[Navigate to stream details]**

> "As the sender, I have full control over the stream lifecycle. Let me show you the management features."

**[Show 'Pause' button]**

> "I can pause the stream temporarily - this stops the token flow but preserves the stream state."

**[Click Pause, sign transaction]**

**[Show status change to 'Paused']**

> "Stream paused. The receiver can no longer accrue tokens, but I can resume it anytime."

**[Click Resume, sign transaction]**

> "And resume - the stream is active again."

**[Show 'Add Deposit' option]**

> "I can also add more funds to extend the stream's runway without creating a new stream."

**[Optional: demonstrate adding 5 GROW]**

> "Added 5 more GROW - the buffer time just increased."

**[Show 'Update Flow Rate' option]**

> "I can even change the flow rate on the fly - increase or decrease the tokens per second."

**[Show 'Stop Stream' button]**

> "Finally, I can permanently stop the stream. This returns any remaining buffer to my vault balance and closes the stream."

---

### **[08:30-09:00] Step 8: Vault Withdrawal (Sender Wallet)**

**[Navigate back to Vault page]**

> "Let's say I'm done streaming and want my remaining tokens back."

**[Show available balance]**

> "I have [X] GROW available in the vault - this is the amount not allocated to any active streams."

**[Click 'Withdraw from Vault']**

**[Enter amount, sign transaction]**

> "Withdrawing back to my wallet... and done. The tokens are now back in my direct control."

---

### **[09:00-09:30] Closing & Key Features Summary**

**[Show dashboard with stats]**

> "Let me summarize what we just demonstrated:

**On-Chain Streaming:**
- Real per-second token flow on Vara Network
- No off-chain computation - everything is on-chain state

**Vault Escrow System:**
- Secure token custody with allocation tracking
- Deposit once, create multiple streams

**Stream Lifecycle:**
- Create, pause, resume, update, stop
- Real-time balance accrual
- Withdraw anytime without stopping stream

**Two-Sided Interface:**
- Senders manage outgoing streams and deposits
- Receivers track incoming streams and withdraw

**Production Ready:**
- All contracts deployed and verified on Vara Testnet
- Full REST API for integration
- TypeScript SDK available

> "This is GrowStreams - programmable money streaming for payroll, subscriptions, grants, and any continuous payment use case. Thank you."

---

## Post-Demo Talking Points (Q&A)

### Technical Architecture
- **Contracts:** StreamCore (state machine), TokenVault (escrow), GROW Token (VFT)
- **Network:** Vara (Polkadot parachain) using Gear Protocol WASM actors
- **Frontend:** Next.js 15, React 19, TailwindCSS, Framer Motion
- **Backend:** Express REST API with sails-js for contract interaction

### Key Differentiators
- **Per-second granularity** - not batch settlements
- **On-chain state** - no off-chain indexers required for core functionality
- **Composable** - streams can be used as primitives for splits, bounties, subscriptions
- **Gas efficient** - Vara's actor model enables cheap continuous computation

### Use Cases
1. **Payroll** - Stream salaries by the second to employees
2. **Subscriptions** - Continuous payment for SaaS, content, services
3. **Grants** - Milestone-based or time-based funding for projects
4. **Revenue Sharing** - Split incoming streams to multiple recipients
5. **Vesting** - Token vesting with per-second unlock

### Roadmap
- Multi-token support (USDC, native VARA)
- Splits router for weighted distribution
- Bounty adapter for milestone-based streams
- Permission delegation system
- Mobile wallet support

---

## Technical Demo Tips

### If Something Goes Wrong

**Transaction Fails:**
> "Let me retry that - testnet can be congested. [retry]"

**Balance Not Updating:**
> "The UI polls every few seconds - let's refresh. [refresh page]"

**Wallet Connection Issues:**
> "Let me reconnect the wallet. [disconnect/reconnect]"

### Timing Tips

- **Let streams run for 15-30 seconds** between creation and withdrawal to show meaningful accrual
- **Prepare wallet addresses in advance** - don't fumble copying/pasting during demo
- **Have faucet cooldown ready** - if you need to demo faucet, make sure 5 min has passed
- **Test the full flow once** before recording to ensure gas balances are sufficient

### Visual Enhancements

- **Use browser zoom** to make UI elements clearly visible (125-150%)
- **Highlight cursor** in screen recording software
- **Use split-screen view** for two-wallet demonstration
- **Show transaction confirmations** in wallet popup for transparency

---

## Alternative: Single-Wallet Demo (Shorter Version)

If you only have 5 minutes or want a simpler demo:

1. **[1 min]** Show pre-funded wallet with GROW tokens
2. **[1 min]** Create stream to a fixed test address
3. **[2 min]** Show stream running, explain flow rate and buffer
4. **[1 min]** Demonstrate pause/resume and stream management

This skips the receiver perspective but still shows the core streaming functionality.

---

## Script Customization Notes

- Replace `[X]` placeholders with actual values during demo
- Adjust timing based on network speed (testnet can be slow)
- Add foundation-specific talking points (e.g., grant use cases, ecosystem fit)
- Emphasize Vara/Polkadot ecosystem integration if presenting to Vara Foundation
- Highlight open-source nature and SDK availability for developer adoption

**Good luck with your demo! 🚀**
