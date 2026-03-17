const BASE = process.env.API_URL || 'http://localhost:3001';
const DELAY = 2000;
let passed = 0, failed = 0;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function put(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function del(path) {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function assert(condition, name) {
  if (condition) { console.log(`  PASS: ${name}`); passed++; }
  else { console.log(`  FAIL: ${name}`); failed++; }
}

async function run(label, fn) {
  try { await fn(); }
  catch (err) { console.log(`  ERROR [${label}]: ${err.message}`); failed++; }
  await sleep(DELAY);
}

async function main() {
  console.log('=== GrowStreams V2 — API Integration Test ===\n');
  console.log(`Target: ${BASE}\n`);

  // ---- Health ----
  console.log('--- Health ---\n');
  await run('[0] Health check', async () => {
    const d = await get('/health');
    assert(d.status === 'healthy', 'API is healthy');
    assert(Object.keys(d.contracts).length === 6, 'All 6 contracts loaded');
    console.log(`  Account: ${d.account}, Balance: ${d.balance}`);
  });

  // ===========================================================================
  // StreamCore Tests (mirrors E2E tests 1-11)
  // ===========================================================================
  console.log('\n--- StreamCore Tests ---\n');

  let streamId;
  let totalBefore = 0;

  await run('[1] GetConfig', async () => {
    const d = await get('/api/streams/config');
    assert(d.admin && d.min_buffer_seconds != null, 'GetConfig returns admin + buffer config');
    console.log(`  admin=${d.admin.slice(0,18)}..., buffer=${d.min_buffer_seconds}s`);
  });

  await run('[2] TotalStreams', async () => {
    const d = await get('/api/streams/total');
    totalBefore = Number(d.total);
    assert(totalBefore >= 0, `TotalStreams = ${totalBefore}`);
  });

  await run('[3] CreateStream', async () => {
    const cfg = await get('/api/streams/config');
    const d = await post('/api/streams', {
      receiver: '0x0000000000000000000000000000000000000000000000000000000000000001',
      token: '0x0000000000000000000000000000000000000000000000000000000000000000',
      flowRate: '1000',
      initialDeposit: '3600000',
    });
    assert(d.blockHash, `CreateStream tx confirmed: ${d.blockHash.slice(0,18)}...`);
    const t = await get('/api/streams/total');
    const totalAfter = Number(t.total);
    assert(totalAfter === totalBefore + 1, `TotalStreams incremented (${totalBefore} -> ${totalAfter})`);
    if (d.result != null) {
      streamId = Number(d.result);
    } else {
      const senderStreams = await get(`/api/streams/sender/${cfg.admin}`);
      streamId = Number(senderStreams.streamIds[senderStreams.streamIds.length - 1]);
    }
  });

  await run('[4] GetStream', async () => {
    const d = await get(`/api/streams/${streamId}`);
    assert(d.id === streamId || d.id === streamId, `GetStream returns stream ${streamId}`);
    assert(d.status === 'Active', `Stream status is Active`);
  });

  await run('[5] ActiveStreams', async () => {
    const d = await get('/api/streams/active');
    assert(Number(d.active) >= 1, `ActiveStreams >= 1 (got ${d.active})`);
  });

  await run('[6] PauseStream', async () => {
    const d = await post(`/api/streams/${streamId}/pause`);
    assert(d.blockHash, 'PauseStream succeeded');
  });

  await run('[7] ResumeStream', async () => {
    const d = await post(`/api/streams/${streamId}/resume`);
    assert(d.blockHash, 'ResumeStream succeeded');
  });

  await run('[8] Deposit', async () => {
    const d = await post(`/api/streams/${streamId}/deposit`, { amount: '1000000' });
    assert(d.blockHash, 'Deposit succeeded');
  });

  await run('[9] UpdateStream', async () => {
    const d = await put(`/api/streams/${streamId}`, { flowRate: '2000' });
    assert(d.blockHash, 'UpdateStream succeeded');
  });

  await run('[10] GetSenderStreams', async () => {
    const health = await get('/health');
    const account = health.account;
    // Use the admin hex from config since the API might use hex actor IDs
    const cfg = await get('/api/streams/config');
    const d = await get(`/api/streams/sender/${cfg.admin}`);
    assert(d.streamIds && d.streamIds.length >= 1, `Sender has ${d.streamIds?.length} stream(s)`);
  });

  await run('[11] StopStream', async () => {
    const d = await post(`/api/streams/${streamId}/stop`);
    assert(d.blockHash, 'StopStream succeeded');
  });

  // ===========================================================================
  // TokenVault Tests (mirrors E2E tests 12-19)
  // ===========================================================================
  console.log('\n--- TokenVault Tests ---\n');

  await run('[12] GetConfig', async () => {
    const d = await get('/api/vault/config');
    assert(d != null, 'VaultConfig returned');
  });

  await run('[13] IsPaused', async () => {
    const d = await get('/api/vault/paused');
    assert(typeof d.paused === 'boolean', `IsPaused = ${d.paused}`);
    if (d.paused) {
      console.log('  Unpausing vault from previous run...');
      await post('/api/vault/unpause');
    }
  });

  await run('[14] DepositTokens', async () => {
    const d = await post('/api/vault/deposit', {
      token: '0x0000000000000000000000000000000000000000000000000000000000000000',
      amount: '5000000',
    });
    assert(d.blockHash, 'DepositTokens succeeded');
  });

  await run('[15] GetBalance', async () => {
    const cfg = await get('/api/streams/config');
    const d = await get(`/api/vault/balance/${cfg.admin}/0x0000000000000000000000000000000000000000000000000000000000000000`);
    assert(d != null, 'GetBalance returned data');
  });

  await run('[16] EmergencyPause', async () => {
    const d = await post('/api/vault/pause');
    assert(d.blockHash, 'EmergencyPause succeeded');
    const check = await get('/api/vault/paused');
    assert(check.paused === true, 'Vault is paused');
  });

  await run('[17] Deposit blocked while paused', async () => {
    try {
      await post('/api/vault/deposit', {
        token: '0x0000000000000000000000000000000000000000000000000000000000000000',
        amount: '100',
      });
      assert(false, 'Deposit should have failed while paused');
    } catch (err) {
      assert(true, `Deposit rejected while paused: ${err.message.slice(0, 50)}`);
    }
  });

  await run('[18] EmergencyUnpause', async () => {
    const d = await post('/api/vault/unpause');
    assert(d.blockHash, 'EmergencyUnpause succeeded');
    const check = await get('/api/vault/paused');
    assert(check.paused === false, 'Vault is unpaused');
  });

  await run('[19] GetStreamAllocation', async () => {
    const d = await get('/api/vault/allocation/99');
    assert(d != null, 'GetStreamAllocation returned');
  });

  // ===========================================================================
  // SplitsRouter Tests (mirrors E2E tests 20-27)
  // ===========================================================================
  console.log('\n--- SplitsRouter Tests ---\n');

  let splitGroupId;

  await run('[20] GetConfig', async () => {
    const d = await get('/api/splits/config');
    assert(d != null, 'SplitsRouter GetConfig returned');
  });

  await run('[21] TotalGroups', async () => {
    const d = await get('/api/splits/total');
    assert(d.total != null, `TotalGroups = ${d.total}`);
  });

  await run('[22] CreateSplitGroup', async () => {
    const cfg = await get('/api/streams/config');
    const d = await post('/api/splits', {
      recipients: [
        { address: '0x0000000000000000000000000000000000000000000000000000000000000001', weight: 50 },
        { address: '0x0000000000000000000000000000000000000000000000000000000000000002', weight: 30 },
        { address: '0x0000000000000000000000000000000000000000000000000000000000000003', weight: 20 },
      ],
    });
    assert(d.blockHash, 'CreateSplitGroup succeeded');
    if (d.result != null) {
      splitGroupId = Number(d.result);
    } else {
      const groups = await get(`/api/splits/owner/${cfg.admin}`);
      splitGroupId = Number(groups.groupIds[groups.groupIds.length - 1]);
    }
    assert(splitGroupId >= 0, `SplitGroup created (id=${splitGroupId})`);
  });

  await run('[23] GetSplitGroup', async () => {
    const d = await get(`/api/splits/${splitGroupId}`);
    assert(d != null, 'GetSplitGroup returned data');
  });

  await run('[24] GetOwnerGroups', async () => {
    const cfg = await get('/api/streams/config');
    const d = await get(`/api/splits/owner/${cfg.admin}`);
    assert(d.groupIds && d.groupIds.length >= 1, `Owner has ${d.groupIds?.length} group(s)`);
  });

  await run('[25] PreviewDistribution', async () => {
    const d = await get(`/api/splits/${splitGroupId}/preview/10000`);
    assert(d.shares && d.shares.length > 0, `Preview has ${d.shares?.length} shares`);
  });

  await run('[26] Distribute', async () => {
    const d = await post(`/api/splits/${splitGroupId}/distribute`, {
      token: '0x0000000000000000000000000000000000000000000000000000000000000000',
      amount: '100000',
    });
    assert(d.blockHash, 'Distribute succeeded');
  });

  await run('[27] DeleteSplitGroup', async () => {
    const d = await del(`/api/splits/${splitGroupId}`);
    assert(d.blockHash, 'DeleteSplitGroup succeeded');
  });

  // ===========================================================================
  // PermissionManager Tests (mirrors E2E tests 28-34)
  // ===========================================================================
  console.log('\n--- PermissionManager Tests ---\n');

  const grantee = '0x0000000000000000000000000000000000000000000000000000000000000042';

  await run('[28] GetConfig', async () => {
    const d = await get('/api/permissions/config');
    assert(d != null, 'PermissionManager GetConfig returned');
  });

  await run('[29] GrantPermission', async () => {
    const d = await post('/api/permissions/grant', {
      grantee,
      scope: 'CreateStream',
    });
    assert(d.blockHash, 'GrantPermission succeeded');
  });

  await run('[30] HasPermission', async () => {
    const cfg = await get('/api/streams/config');
    const d = await get(`/api/permissions/check/${cfg.admin}/${grantee}/CreateStream`);
    assert(d.hasPermission === true, `HasPermission == true`);
  });

  await run('[31] GetPermissions', async () => {
    const cfg = await get('/api/streams/config');
    const d = await get(`/api/permissions/granter/${cfg.admin}`);
    assert(d.permissions != null, 'GetPermissions returned');
  });

  await run('[32] RevokePermission', async () => {
    const d = await post('/api/permissions/revoke', {
      grantee,
      scope: 'CreateStream',
    });
    assert(d.blockHash, 'RevokePermission succeeded');
  });

  await run('[33] HasPermission == false after revoke', async () => {
    const cfg = await get('/api/streams/config');
    const d = await get(`/api/permissions/check/${cfg.admin}/${grantee}/CreateStream`);
    assert(d.hasPermission === false, `HasPermission == false after revoke`);
  });

  await run('[34] TotalPermissions', async () => {
    const d = await get('/api/permissions/total');
    assert(d.total != null, `TotalPermissions = ${d.total}`);
  });

  // ===========================================================================
  // BountyAdapter Tests (mirrors E2E tests 35-43)
  // ===========================================================================
  console.log('\n--- BountyAdapter Tests ---\n');

  let bountyId;

  await run('[35] GetConfig', async () => {
    const d = await get('/api/bounty/config');
    assert(d != null, 'BountyAdapter GetConfig returned');
  });

  await run('[36] TotalBounties', async () => {
    const d = await get('/api/bounty/total');
    assert(d.total != null, `TotalBounties = ${d.total}`);
  });

  await run('[37] CreateBounty', async () => {
    const cfg = await get('/api/streams/config');
    const d = await post('/api/bounty', {
      title: 'Fix login bug',
      token: '0x0000000000000000000000000000000000000000000000000000000000000000',
      maxFlowRate: '5000',
      minScore: 60,
      totalBudget: '10000000',
    });
    assert(d.blockHash, 'CreateBounty succeeded');
    if (d.result != null) {
      bountyId = Number(d.result);
    } else {
      const creatorBounties = await get(`/api/bounty/creator/${cfg.admin}`);
      bountyId = Number(creatorBounties.bountyIds[creatorBounties.bountyIds.length - 1]);
    }
    assert(bountyId >= 0, `Bounty created (id=${bountyId})`);
  });

  await run('[38] GetBounty', async () => {
    const d = await get(`/api/bounty/${bountyId}`);
    assert(d != null && d.title, `GetBounty: "${d.title}"`);
  });

  await run('[39] GetOpenBounties', async () => {
    const d = await get('/api/bounty/open');
    assert(d.bountyIds != null, `Open bounties: ${d.bountyIds?.length}`);
  });

  await run('[40] ClaimBounty', async () => {
    const d = await post(`/api/bounty/${bountyId}/claim`);
    assert(d.blockHash, 'ClaimBounty succeeded');
  });

  await run('[41] VerifyAndStartStream', async () => {
    const cfg = await get('/api/streams/config');
    const d = await post(`/api/bounty/${bountyId}/verify`, {
      claimer: cfg.admin,
      score: 85,
    });
    assert(d.blockHash, 'VerifyAndStartStream succeeded');
  });

  await run('[42] CompleteBounty', async () => {
    const d = await post(`/api/bounty/${bountyId}/complete`);
    assert(d.blockHash, 'CompleteBounty succeeded');
  });

  await run('[43] GetCreatorBounties', async () => {
    const cfg = await get('/api/streams/config');
    const d = await get(`/api/bounty/creator/${cfg.admin}`);
    assert(d.bountyIds && d.bountyIds.length >= 1, `Creator has ${d.bountyIds?.length} bounty(ies)`);
  });

  // ===========================================================================
  // IdentityRegistry Tests (mirrors E2E tests 44-51)
  // ===========================================================================
  console.log('\n--- IdentityRegistry Tests ---\n');

  const testActor = '0x0000000000000000000000000000000000000000000000000000000000000099';

  await run('[44] GetConfig', async () => {
    const d = await get('/api/identity/config');
    assert(d != null, 'IdentityRegistry GetConfig returned');
  });

  await run('[45] OracleAddress', async () => {
    const d = await get('/api/identity/oracle');
    assert(d.oracle, `Oracle: ${d.oracle.slice(0,18)}...`);
  });

  await run('[46] TotalBindings', async () => {
    const d = await get('/api/identity/total');
    assert(d.total != null, `TotalBindings = ${d.total}`);
  });

  await run('[47] CreateBinding', async () => {
    const d = await post('/api/identity/bind', {
      actorId: testActor,
      githubUsername: 'test-github-user',
      proofHash: '0xabababababababababababababababababababababababababababababababababab',
      score: 75,
    });
    assert(d.blockHash, 'CreateBinding succeeded');
  });

  await run('[48] GetBinding', async () => {
    const d = await get(`/api/identity/binding/${testActor}`);
    assert(d != null, 'GetBinding returned data');
  });

  await run('[49] GetActorByGithub', async () => {
    const d = await get('/api/identity/github/test-github-user');
    assert(d.actorId, `Found actor: ${d.actorId?.slice(0,18)}...`);
  });

  await run('[50] UpdateScore', async () => {
    const d = await post('/api/identity/update-score', {
      actorId: testActor,
      newScore: 92,
    });
    assert(d.blockHash, 'UpdateScore succeeded');
  });

  await run('[51] RevokeBinding', async () => {
    const d = await post('/api/identity/revoke', { actorId: testActor });
    assert(d.blockHash, 'RevokeBinding succeeded');
  });

  // ===========================================================================
  // Summary
  // ===========================================================================
  console.log('\n========================================');
  console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log('========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
