# GrowStreams Foundation Demo Script
**Complete Walkthrough: GROW Token, Vault, and Streaming**

> **Duration:** 10-12 minutes  
> **Setup:** Two browser windows side-by-side (Sender/Admin + Receiver)  
> **Network:** Vara Testnet  
> **URL:** https://growstreams-v2.vercel.app/app

---

## Pre-Demo Setup (Do Before Recording)

### Wallet 1: Admin/Sender Account
- Connect wallet with sufficient VARA for gas (~50 VARA recommended)
- Note address for script

### Wallet 2: Receiver Account  
- Connect in separate browser/incognito window
- Note address for script
- Start with 0 GROW balance (clean slate) if possible

---

## DEMO SCRIPT

### **[00:00-00:45] Introduction & Overview**

**[Screen: Landing page or Dashboard]**

> "Welcome to GrowStreams, a programmable money streaming protocol built on Vara Network. Today I'll demonstrate the complete lifecycle: managing tokens, using the vault escrow system, and creating real-time streams."

**[Show both browser windows side-by-side]**

> "On the left, I have my Sender wallet. On the right, a Receiver wallet. We'll show how tokens flow continuously on-chain between them."

---

### **[00:45-02:00] Part 1: The GROW Token Page**

**[Left screen: Navigate to 'Get GROW' / 'GROW Token' page]**

> "GrowStreams uses the GROW token (a VFT standard token) for streaming. Let's start by getting some tokens."

**[Click 'Faucet' button]**

> "I'll use the testnet faucet to mint 1,000 GROW tokens. This interacts directly with the VFT contract on Vara."

**[Wait for confirmation, show balance update]**

> "Transaction confirmed. We now have 1,000 GROW. On this page, you can also transfer tokens directly or approve them for the vault, which brings us to the next step."

---

### **[02:00-04:00] Part 2: The Vault (Escrow System)**

**[Navigate to Vault page]**

> "The Vault is the heart of the protocol. It's a secure smart contract that holds funds and allocates them to your active streams. This separation ensures that even if you have 10 streams, you only need one deposit balance."

**[Toggle between VARA and GROW tabs]**

> "The Vault supports multiple assets. Here we have the Native VARA Vault and the GROW Token Vault. Let's look at the GROW Vault first."

**[Select GROW tab]**

> "First, we need to approve the Vault to spend our GROW tokens."

**[Click 'Approve', enter 500, sign transaction]**

> "I'm approving 500 tokens. Now, let's deposit."

**[Click 'Deposit', enter 100, sign transaction]**

> "I'm depositing 100 GROW. Watch the 'Current Balance' update."

**[Show Balance Breakdown]**

> "Now look at this breakdown. We have a 'Current Balance' of 100 GROW.
> - **Available:** 100 GROW (Ready to be streamed)
> - **In Streams:** 0 GROW (No active streams yet)
> This 'Available' balance is what we can withdraw or allocate."

---

### **[04:00-05:00] Part 2b: Native VARA Vault Support**

**[Select VARA tab]**

> "We also support Native VARA. This uses a different on-chain mechanism (`DepositNative`) since VARA isn't a VFT token."

**[Click 'Deposit', enter 5 VARA, sign transaction]**

> "I'm depositing 5 VARA directly into the contract escrow."

**[Wait for confirmation]**

> "And there it is. 5 VARA in the Vault, fully secured on-chain. We can withdraw this at any time."

**[Click 'Withdraw', enter 1 VARA, sign transaction]**

> "Let me prove custody by withdrawing 1 VARA back to my wallet immediately."

> "Success. The Vault handles both native assets and tokens seamlessly."

---

### **[05:00-07:00] Part 3: Creating a Stream**

**[Navigate to Streams page]**

> "Now for the core feature: Real-time Streaming. We'll stream GROW tokens to our receiver."

**[Click 'Create Stream']**

> "I'll create a new stream."

**[Fill in form]**
- **Receiver:** [Paste Receiver Address]
- **Token:** GROW Token (Pre-selected)
- **Flow Rate:** 0.001 GROW/second
- **Initial Deposit:** 20 GROW

> "I'm setting a flow rate of 0.001 tokens per second. I'll allocate 20 GROW from my Vault 'Available' balance to this stream. This gives it a runway (buffer) of about 5 hours."

**[Click 'Create Stream', sign transaction]**

> "The contract is now allocating funds and creating the stream state."

**[Show Stream Card]**

> "Stream created! Status is 'Active'. Look at the 'Streamed' counter—it's increasing every second. This isn't an animation; it's the on-chain accrued value increasing with every block."

**[Quickly switch back to Vault page]**

> "If we check the Vault now, notice the change:
> - **Current Balance:** 99 GROW
> - **In Streams:** 20 GROW (Allocated)
> - **Available:** 79 GROW
> The funds are locked for the stream but still belong to me until they are withdrawn."

---

### **[07:00-08:30] Part 4: Receiver View & Withdrawal**

**[Switch to Receiver Window (Right Screen)]**

> "Now I'm the Receiver. I didn't have to do anything. The stream just appeared in my dashboard."

**[Show Incoming Stream]**

> "I can see who is paying me, the rate, and my 'Withdrawable Balance'. This balance is rightfully mine right now."

**[Click 'Withdraw', sign transaction]**

> "I'll claim my earnings. I don't need to stop the stream to do this. I'm just withdrawing what has accrued so far."

**[Show Wallet Balance Update]**

> "Transaction complete. My wallet balance just went up, and the stream 'Withdrawn' amount updated. The stream keeps flowing uninterrupted."

---

### **[08:30-10:00] Part 5: Stream Management (Sender)**

**[Switch to Sender Window (Left Screen)]**

> "Back to the Sender. I have full control."

**[Demonstrate Actions]**

1.  **Pause:** "I can pause the stream if I need to stop payment temporarily." [Click Pause] -> Status: Paused.
2.  **Resume:** "And resume it just as easily." [Click Resume] -> Status: Active.
3.  **Top Up:** "If the buffer is running low, I can deposit more tokens directly into this stream to extend its life." [Click Deposit, add 10 GROW].
4.  **Edit Rate:** "I can even update the flow rate dynamically." [Click Edit, change to 0.002].

**[Stop Stream]**

> "Finally, when the job is done, I stop the stream."

**[Click 'Stop']**

> "Stopping the stream settles the final amount to the receiver and returns all unspent 'allocated' funds back to my Vault 'Available' balance automatically."

---

### **[10:00-11:00] Conclusion**

**[Show Dashboard]**

> "And that is GrowStreams on Vara."

> "**Recap:**
> 1.  **Get Tokens:** Mint or transfer GROW.
> 2.  **Vault:** Securely deposit assets (VARA or GROW).
> 3.  **Stream:** Create per-second payment flows.
> 4.  **Manage:** Pause, update, or stop anytime.
> 5.  **Claim:** Receivers withdraw earnings instantly."

> "This infrastructure enables payroll, subscriptions, and grants to be fully automated and trustless. Thank you."

---

## Technical Notes for the Demo Driver

1.  **VARA Vault:** The `DepositNative` fix is deployed. It works! Make sure to show it to prove we handle native assets.
2.  **Allocated vs. Available:** Emphasize this distinction in the Vault. It proves the solvency model (funds are reserved).
3.  **Flow Rate:** Use `0.001` or `0.01`. If you use `1.0`, it drains too fast for a demo.
4.  **Wait Times:** Vara testnet blocks are ~3s. Fill the silence while waiting for the "Success" toast.
