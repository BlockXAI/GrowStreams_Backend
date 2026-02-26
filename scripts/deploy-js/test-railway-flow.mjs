#!/usr/bin/env node
/**
 * Test the full GROW token flow via Railway-deployed API.
 * Sender: admin wallet (server-side keyring)
 * Receiver: kGihti2NTt1m7F5TvijpYgpQGcwgRVREsgSYyoaX9SBUgMwRm
 */

const API = 'https://growstreams-core-production.up.railway.app';
const GROW_TOKEN = '0x05a2a482f1a1a7ebf74643f3cc2099597dac81ff92535cbd647948febee8fe36';
const RECEIVER = 'kGihti2NTt1m7F5TvijpYgpQGcwgRVREsgSYyoaX9SBUgMwRm';

// Convert SS58 to hex using polkadot util
import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

const RECEIVER_HEX = u8aToHex(decodeAddress(RECEIVER));

async function api(path, body) {
  const url = `${API}${path}`;
  const opts = body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : { method: 'GET' };
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(data)}`);
  return data;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('=== GrowStreams Railway E2E Test ===');
  console.log(`API: ${API}`);
  console.log(`Receiver: ${RECEIVER}`);
  console.log(`Receiver hex: ${RECEIVER_HEX}`);
  console.log('');

  // Step 1: Get admin info
  console.log('--- Step 1: Admin Info ---');
  const meta = await api('/api/grow-token/meta');
  const admin = meta.admin;
  console.log(`Admin (deployer): ${admin}`);
  console.log(`Token: ${meta.name} (${meta.symbol}), decimals: ${meta.decimals}`);

  // Step 2: Check admin GROW balance
  console.log('\n--- Step 2: Check Balances ---');
  const adminBal = await api(`/api/grow-token/balance/${admin}`);
  console.log(`Admin GROW balance: ${adminBal.balance} (${Number(adminBal.balance) / 1e12} GROW)`);

  const recvBal = await api(`/api/grow-token/balance/${RECEIVER_HEX}`);
  console.log(`Receiver GROW balance: ${recvBal.balance} (${Number(recvBal.balance) / 1e12} GROW)`);

  // Step 3: Mint GROW to admin via faucet
  console.log('\n--- Step 3: Mint GROW (server-side faucet) ---');
  try {
    const faucet = await api('/api/grow-token/faucet', { to: admin });
    console.log(`Minted: ${faucet.amountHuman} | blockHash: ${faucet.blockHash}`);
  } catch (err) {
    console.log(`Faucet: ${err.message} (may be rate limited, continuing...)`);
  }
  await sleep(3000);

  // Step 4: Check updated balance
  const adminBal2 = await api(`/api/grow-token/balance/${admin}`);
  console.log(`Admin GROW after mint: ${Number(adminBal2.balance) / 1e12} GROW`);

  // Step 5: Approve vault
  console.log('\n--- Step 4: Approve Vault ---');
  const approveAmt = '500000000000000'; // 500 GROW
  const approve = await api('/api/grow-token/approve', {
    spender: '0x7e081c0f82e31e35d845d1932eb36c84bbbb50568eef3c209f7104fabb2c254b',
    amount: approveAmt,
  });
  console.log(`Approved 500 GROW for vault | blockHash: ${approve.blockHash}`);
  await sleep(3000);

  // Step 6: Deposit to vault
  console.log('\n--- Step 5: Deposit to Vault ---');
  const depositAmt = '100000000000000'; // 100 GROW
  const deposit = await api('/api/vault/deposit', {
    token: GROW_TOKEN,
    amount: depositAmt,
  });
  console.log(`Deposited 100 GROW to vault | blockHash: ${deposit.blockHash}`);
  await sleep(3000);

  // Step 7: Check vault balance
  console.log('\n--- Step 6: Check Vault Balance ---');
  const vaultBal = await api(`/api/vault/balance/${admin}/${GROW_TOKEN}`);
  console.log(`Vault balance:`);
  console.log(`  total_deposited: ${vaultBal.total_deposited} (${Number(vaultBal.total_deposited) / 1e12} GROW)`);
  console.log(`  total_allocated: ${vaultBal.total_allocated} (${Number(vaultBal.total_allocated) / 1e12} GROW)`);
  console.log(`  available: ${vaultBal.available} (${Number(vaultBal.available) / 1e12} GROW)`);

  // Step 8: Create stream
  console.log('\n--- Step 7: Create Stream ---');
  const flowRate = '1000000000'; // 0.001 GROW/s (enough for ~27 hours with 100 GROW)
  const initialDeposit = '50000000000000'; // 50 GROW
  const stream = await api('/api/streams', {
    receiver: RECEIVER_HEX,
    token: GROW_TOKEN,
    flowRate: flowRate,
    initialDeposit: initialDeposit,
  });
  console.log(`Stream created!`);
  console.log(`  Stream ID: ${stream.streamId || stream.id || JSON.stringify(stream)}`);
  console.log(`  blockHash: ${stream.blockHash}`);
  await sleep(5000);

  // Step 9: Verify stream exists
  const streamId = stream.streamId || stream.id;
  if (streamId) {
    console.log('\n--- Step 8: Verify Stream ---');
    const streamData = await api(`/api/streams/${streamId}`);
    console.log(`Stream #${streamId}:`);
    console.log(`  status: ${streamData.status}`);
    console.log(`  sender: ${streamData.sender}`);
    console.log(`  receiver: ${streamData.receiver}`);
    console.log(`  flow_rate: ${streamData.flow_rate} (${Number(streamData.flow_rate) / 1e12} GROW/s)`);
    console.log(`  deposited: ${streamData.deposited} (${Number(streamData.deposited) / 1e12} GROW)`);
    console.log(`  streamed: ${streamData.streamed}`);
  }

  // Step 10: Check receiver balance on vault
  console.log('\n--- Step 9: Final Balance Check ---');
  const adminBalFinal = await api(`/api/grow-token/balance/${admin}`);
  console.log(`Admin GROW wallet: ${Number(adminBalFinal.balance) / 1e12} GROW`);

  const vaultBalFinal = await api(`/api/vault/balance/${admin}/${GROW_TOKEN}`);
  console.log(`Admin vault available: ${Number(vaultBalFinal.available) / 1e12} GROW`);
  console.log(`Admin vault allocated: ${Number(vaultBalFinal.total_allocated) / 1e12} GROW`);

  console.log('\n=== E2E Test Complete ===');
  console.log('The stream is now actively streaming GROW tokens to the receiver.');
  console.log(`Receiver can withdraw from the stream once tokens have been streamed.`);
}

main().catch(err => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
