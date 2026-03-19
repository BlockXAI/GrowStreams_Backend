# Navigator UI Guide

**Purpose**: How to use Canton Navigator with GrowStreams  
**URL**: http://localhost:4000

---

## 🚀 Quick Start

### 1. Start Navigator
```bash
cd daml-contracts
daml navigator server localhost 6865 --port 4000 -c ui-backend.conf
```

### 2. Open Browser
Navigate to: http://localhost:4000

### 3. Login
Select party from dropdown:
- **Admin** - Factory owner
- **Alice** - Stream sender
- **Bob** - Stream receiver

---

## 📋 Navigator Tabs

### Templates Tab
Shows contract blueprints (not active contracts)
- Use this to understand contract structure
- Not for viewing active streams

### Contracts Tab ✅
Shows active contracts on the ledger
- **This is where you see your streams**
- Click any contract to view details
- Execute choices from here

---

## 🎯 Common Tasks

### View Active Streams
1. Login as Alice or Bob
2. Click "Contracts" tab
3. See StreamAgreement contracts

### Check Withdrawable Balance
1. Find your StreamAgreement
2. Click to expand
3. Execute "ObligationView" choice
4. Enter current time: `2026-03-19T10:00:00Z`
5. See withdrawable amount

### Withdraw Tokens
1. Find your StreamAgreement (as receiver)
2. Execute "Withdraw" choice
3. Enter current time
4. Tokens withdrawn!

### Pause Stream
1. Find your StreamAgreement (as sender)
2. Execute "Pause" choice
3. Enter current time
4. Stream paused

---

## ⚠️ Common Errors

### 500 Internal Server Error
**Cause**: Invalid time format or authorization error

**Fix**:
1. Use proper timestamp: `2026-03-19T10:00:00Z` (not "Time")
2. Make sure you're logged in as the correct party
3. Check you have permission for the choice

### 404 Not Found on /api/config
**Status**: Harmless - ignore this error

### Cannot read properties of undefined
**Status**: Cosmetic React UI issue - ignore

---

## ✅ Configuration

**File**: `daml-contracts/ui-backend.conf`

```hocon
users {
    Admin {
        party = "party-974f4e44-eb56-4d52-b912-9d0b43211b22::12200c904c539b9006bc40adf3c3727653320c5951a7ba3e23ece0b79f011257e614"
    }
    Alice {
        party = "party-01f28f51-139f-4d3b-99e7-cccf9eeeb699::12200c904c539b9006bc40adf3c3727653320c5951a7ba3e23ece0b79f011257e614"
    }
    Bob {
        party = "party-1939a953-f183-4e40-a268-5132ba44fa47::12200c904c539b9006bc40adf3c3727653320c5951a7ba3e23ece0b79f011257e614"
    }
}
```

---

## 🔍 Troubleshooting

### Parties not showing in dropdown
1. Check `ui-backend.conf` exists
2. Verify party IDs are correct
3. Restart Navigator

### Contracts not visible
1. Make sure you're on "Contracts" tab (not "Templates")
2. Check you're logged in as correct party
3. Verify contracts exist: `daml ledger list-parties`

### Choices failing
1. Verify you have authorization
2. Use correct timestamp format
3. Check contract is in correct state

---

**Navigator is your window into the Canton ledger!** ✅
