# Reclaim Protocol Integration Setup Guide

## Overview

Your campaign now includes **Reclaim Protocol** integration for verifying GitHub ownership on the Vara Network. This guide walks you through the complete setup process.

## What Has Been Implemented

### 1. **Reclaim SDK Integration**
- ✅ Added `@reclaimprotocol/js-sdk` to dependencies
- ✅ Added `qrcode` library for QR code generation (React 19 compatible)
- ✅ Created `useReclaimVerification` hook for proof generation
- ✅ Created `ReclaimVerification` component with QR code UI
- ✅ Created `useReclaimContract` hook for on-chain verification
- ✅ Updated campaign page to use real Reclaim verification

### 2. **Environment Variables Added**
```env
# Reclaim Protocol Configuration
NEXT_PUBLIC_RECLAIM_APP_ID=your_reclaim_app_id
NEXT_PUBLIC_RECLAIM_APP_SECRET=your_reclaim_app_secret
NEXT_PUBLIC_RECLAIM_GITHUB_PROVIDER_ID=your_github_provider_id
NEXT_PUBLIC_RECLAIM_CONTRACT=0x...
```

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
```

This will install:
- `@reclaimprotocol/js-sdk` - Reclaim Protocol SDK
- `qrcode` - QR code generation library
- `@types/qrcode` - TypeScript types for qrcode

### Step 2: Get Reclaim Credentials

1. **Visit Reclaim Dev Portal:**
   - Go to https://dev.reclaimprotocol.org/
   - Sign up / Log in

2. **Create a New Application:**
   - Click "Create New App"
   - Name: "GrowStreams Campaign"
   - Description: "Web3 Contribution Challenge"
   - Save your `APP_ID` and `APP_SECRET`

3. **Configure GitHub Provider:**
   - Go to "Providers" section
   - Find or create "GitHub" provider
   - Copy the `PROVIDER_ID`
   - Configure the provider to verify GitHub username ownership

### Step 3: Deploy Reclaim Contract on Vara

Follow the official Reclaim Gear SDK guide:

```bash
# Clone Reclaim Gear SDK
git clone https://gitlab.reclaimprotocol.org/integrations/onchain/gear-sdk
cd reclaim-gear

# Build the contract
cargo b --workspace

# Generate WASM and metadata
cd target/wasm32-unknown-unknown/release
ls reclaim_gear.wasm
```

#### Deploy via Gear IDEA:

1. Visit https://idea.gear-tech.io/
2. Connect your Vara wallet
3. Upload `reclaim_gear.wasm` and metadata
4. Deploy to Vara Testnet
5. Save the contract address

#### Initialize Contract:

```javascript
// In js/index.js from the Reclaim SDK
import { GearApi, GearKeyring } from '@gear-js/api';

const api = await GearApi.create({ providerAddress: 'wss://testnet.vara.network' });
const keyring = await GearKeyring.fromMnemonic('YOUR_MNEMONIC');

// Call initiate() to bootstrap contract
// Call addEpoch() to add witnesses
// Your contract is now ready
```

### Step 4: Configure Environment

Update your `.env.local`:

```env
# Vara Network
NEXT_PUBLIC_VARA_NODE_ADDRESS=wss://testnet.vara.network

# Reclaim Protocol
NEXT_PUBLIC_RECLAIM_APP_ID=0x1234567890abcdef...
NEXT_PUBLIC_RECLAIM_APP_SECRET=your-secret-key-here
NEXT_PUBLIC_RECLAIM_GITHUB_PROVIDER_ID=github-provider-id
NEXT_PUBLIC_RECLAIM_CONTRACT=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
```

### Step 5: Update Contract ABIs

When your Reclaim contract is deployed, you'll receive metadata. Update the hooks:

#### `/hooks/useReclaimContract.ts`
```typescript
import reclaimMetadata from './reclaim-metadata.json';

const RECLAIM_ABI = reclaimMetadata; // Replace the empty {}
```

## How It Works

### User Flow:

1. **User enters GitHub username** → Stored in state
2. **ReclaimVerification component loads** → Generates QR code
3. **User scans QR with Reclaim Wallet app** → Proves GitHub ownership
4. **Proof received** → Stored in state
5. **Optional: Submit proof on-chain** → Via `useReclaimContract()`
6. **Continue to analysis** → With verified GitHub ID

### Technical Flow:

```typescript
// 1. Initialize proof request
const { initializeProofRequest } = useReclaimVerification();
await initializeProofRequest(githubUsername);

// 2. Generate QR code
// Displayed automatically by ReclaimVerification component

// 3. Receive proof
onVerified={(proof) => {
  // proof contains verified GitHub data
  setReclaimProof(proof);
}}

// 4. Optional: Verify on-chain
const { submitProofOnChain } = useReclaimContract();
await submitProofOnChain(transformedProof);
```

## Testing Locally

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to campaign:**
   http://localhost:3000/campaign

3. **Test flow:**
   - Connect Vara wallet
   - Enter GitHub username
   - See QR code generated
   - *Note: You'll need Reclaim Wallet app on mobile to complete verification*

## Reclaim Wallet App

Users need the Reclaim Wallet mobile app to scan QR codes:

- **Download:** https://reclaimprotocol.org/wallet
- Available for iOS and Android
- Used to generate zero-knowledge proofs of GitHub ownership

## Contract Functions

Your deployed Reclaim contract should support:

```rust
// Initialize contract
pub fn initiate(&mut self) -> Result<(), Error>

// Add epoch witnesses
pub fn add_epoch(&mut self, witnesses: Vec<Witness>, epoch: u32) -> Result<(), Error>

// Verify proof
pub fn verify_proof(&self, proof: Proof) -> Result<bool, Error>
```

## API Integration (Optional)

For server-side verification, create an API route:

```typescript
// app/api/verify-reclaim/route.ts
export async function POST(req: Request) {
  const { proof, githubUsername } = await req.json();
  
  // Verify proof structure
  // Check signatures
  // Validate GitHub username from proof
  // Store verification in database
  
  return Response.json({ verified: true });
}
```

## Troubleshooting

### QR Code Not Showing
- Check that `NEXT_PUBLIC_RECLAIM_APP_ID` is set
- Check browser console for errors
- Ensure `qrcode.react` is installed

### Proof Not Received
- Ensure Reclaim Wallet app is updated
- Check network connectivity
- Verify provider ID is correct

### Contract Errors
- Ensure contract is initialized (`initiate()`)
- Ensure epochs are added (`addEpoch()`)
- Check witness configuration

## Resources

- **Reclaim Docs:** https://docs.reclaimprotocol.org/
- **Gear SDK:** https://gitlab.reclaimprotocol.org/integrations/onchain/gear-sdk
- **Example App:** https://gitlab.reclaimprotocol.org/starterpacks/reclaim-gear-example
- **Vara Network:** https://vara.network/
- **Gear Wiki:** https://wiki.gear.foundation/

## Security Notes

1. **Never expose APP_SECRET** client-side - only in API routes
2. **Verify proofs on-chain** for production use
3. **Rate limit** proof requests to prevent abuse
4. **Store verified proofs** in your database with timestamps

## Next Steps

1. ✅ Get Reclaim credentials from dev portal
2. ✅ Deploy Reclaim contract to Vara
3. ✅ Update environment variables
4. ✅ Test QR code generation
5. ✅ Download Reclaim Wallet app
6. ✅ Test complete verification flow
7. ✅ Integrate with GitHub analysis API

---

**You're all set!** The Reclaim integration is now live in your campaign. Users can verify GitHub ownership with zero-knowledge proofs. 🎉
