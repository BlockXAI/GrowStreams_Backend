# Week 8-10: Deployment & Submission

**Duration**: April 19 - May 9, 2026  
**Goal**: Canton Deployment + Dev Fund Submission  
**Status**: ⏳ 90% Complete

---

## 🎯 Objectives

1. Deploy to Canton sandbox
2. Configure Navigator UI
3. Create evidence folder
4. Build testnet demo scripts
5. Record demo video
6. Submit to Canton Dev Fund

---

## ✅ Deliverables

### 1. Canton Sandbox Deployment ✅
**Platform**: Canton Sandbox  
**Host**: localhost  
**Port**: 6865

**Status**:
- ✅ Canton running
- ✅ DAR deployed (growstreams-1.0.0.dar)
- ✅ Parties allocated (Admin, Alice, Bob)
- ✅ Contracts active on ledger
- ✅ Live transactions executing

**Verification**:
```bash
lsof -i:6865  # Canton running
daml ledger list-parties --host localhost --port 6865  # 22 parties
```

---

### 2. Navigator UI ✅
**URL**: http://localhost:4000  
**Port**: 4000

**Configuration**: `daml-contracts/ui-backend.conf`
```hocon
users {
    Admin { party = "party-974f4e44..." }
    Alice { party = "party-01f28f51..." }
    Bob { party = "party-1939a953..." }
}
```

**Status**:
- ✅ Navigator running
- ✅ Party dropdown working
- ✅ Contracts visible
- ✅ Choices executable

---

### 3. Evidence Folder ✅
**Location**: `evidence/`

**Files**:
1. ✅ README.md - Overview
2. ✅ criterion-1-streaming-contract.md
3. ✅ criterion-2-accrual-formula.md
4. ✅ criterion-3-obligation-view.md
5. ✅ criterion-4-lifecycle-manager.md
6. ✅ criterion-5-testing.md
7. ✅ criterion-6-canton-deployment.md
8. ✅ test-output.log (33/33 passing)
9. ✅ contract-ids.txt (22 parties)

**Status**: ✅ All 6 criteria documented

---

### 4. Testnet Demo Scripts ✅
**Location**: `scripts/demo/`

**Scripts**:
1. ✅ 01-setup-testnet.daml - Testnet initialization
2. ✅ 02-create-stream-realtime.daml - Real-time accrual (60s wait)
3. ✅ 03-lifecycle-realtime.daml - Lifecycle management
4. ✅ README.md - Demo guide

**Key Feature**: Uses `passTime` (real wall-clock time) instead of `setTime` (simulated time)

**Quick Demos**:
- `createStreamQuickDemo` - 10s wait instead of 60s
- `lifecycleQuickDemo` - 5s intervals instead of 30s

---

### 5. Demo Video ⏳
**Status**: ⏳ Pending

**Plan** (2 minutes):
1. 0:00-0:20: Canton running + tests passing
2. 0:20-0:50: Real-time stream demo (quick version)
3. 0:50-1:30: Lifecycle demo (quick version)
4. 1:30-2:00: Navigator UI + conclusion

**Commands**:
```bash
# Quick stream demo (10s)
daml script --dar .daml/dist/growstreams-1.0.0.dar \
  --script-name Demo.CreateStreamRealtime:createStreamQuickDemo \
  --ledger-host localhost --ledger-port 6865

# Quick lifecycle demo (5s intervals)
daml script --dar .daml/dist/growstreams-1.0.0.dar \
  --script-name Demo.LifecycleRealtime:lifecycleQuickDemo \
  --ledger-host localhost --ledger-port 6865
```

---

### 6. Canton Dev Fund Submission ⏳
**Status**: ⏳ Pending (waiting for demo video)

**Checklist**:
- ✅ All 6 acceptance criteria met
- ✅ Evidence folder complete
- ✅ Tests passing (33/33)
- ✅ Canton deployment verified
- ✅ Demo scripts ready
- ⏳ Demo video (2 hours of work)

**Submission Package**:
- GitHub repository link
- Evidence folder
- Demo video URL
- Contact information

---

## 📊 Metrics

### Deployment
- **Platform**: Canton Sandbox
- **SDK Version**: 2.10.3
- **DAR Size**: ~500KB
- **Parties**: 22 allocated
- **Status**: ✅ Running

### Evidence
- **Criteria Met**: 6/6 (100%)
- **Test Coverage**: 33/33 passing
- **Documentation**: Complete

### Submission Readiness
- **Implementation**: 100% ✅
- **Testing**: 100% ✅
- **Deployment**: 100% ✅
- **Evidence**: 100% ✅
- **Demo Video**: 0% ⏳

**Overall**: 90% ready

---

## 🔍 Key Learnings

1. **setTime vs passTime**: Tests use setTime (sandbox), demos use passTime (testnet)
2. **Evidence Folder**: Critical for committee review
3. **Navigator Config**: Proper party configuration essential
4. **Demo Scripts**: Real-time compatible scripts prove functionality

---

## ✅ Acceptance Criteria Status

| # | Criterion | Status |
|---|-----------|--------|
| 1 | StreamAgreement | ✅ Complete |
| 2 | Accrual Formula | ✅ Complete |
| 3 | ObligationView | ✅ Complete |
| 4 | LifecycleManager | ✅ Complete |
| 5 | Testing | ✅ Complete |
| 6 | Canton Deployment | ✅ Complete |

**Overall**: ✅ **6/6 Met (100%)**

---

## 🚀 Next Steps

### This Week
- [ ] Record demo video (2 hours)
- [ ] Upload to YouTube/Loom
- [ ] Add URL to evidence/demo-video-url.txt

### Next Week
- [ ] Final evidence review
- [ ] Test all demo scripts
- [ ] Prepare submission package

### Week 10
- [ ] Submit to Canton Dev Fund
- [ ] Follow up with committee

---

**Week 8-10: 90% Complete!** ⏳  
**Remaining**: Demo video (2 hours of work)
