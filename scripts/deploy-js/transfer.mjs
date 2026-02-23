import { GearApi, GearKeyring } from '@gear-js/api';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../..');

config({ path: resolve(PROJECT_ROOT, '.env') });

const VARA_SEED = process.env.VARA_SEED;
const VARA_NODE = process.env.VARA_NODE || 'wss://testnet.vara.network';

const TARGET_ADDRESS = process.argv[2];
const AMOUNT_VARA = parseFloat(process.argv[3] || '1');

if (!TARGET_ADDRESS) {
  console.error('Usage: node transfer.mjs <target_ss58_address> [amount_in_vara]');
  process.exit(1);
}

async function main() {
  console.log(`Connecting to ${VARA_NODE}...`);
  const api = await GearApi.create({ providerAddress: VARA_NODE });

  let keyring;
  try { keyring = await GearKeyring.fromMnemonic(VARA_SEED); }
  catch { keyring = await GearKeyring.fromSuri(VARA_SEED); }

  console.log(`Sender:   ${keyring.address}`);
  console.log(`Receiver: ${TARGET_ADDRESS}`);

  const { data: { free: senderBalance } } = await api.query.system.account(keyring.address);
  console.log(`Sender balance: ${(Number(BigInt(senderBalance.toString())) / 1e12).toFixed(4)} VARA`);

  const amountUnits = BigInt(Math.round(AMOUNT_VARA * 1e12));
  console.log(`Transferring: ${AMOUNT_VARA} VARA (${amountUnits} units)\n`);

  const tx = api.tx.balances.transferKeepAlive(TARGET_ADDRESS, amountUnits);

  await new Promise((resolve, reject) => {
    let done = false;
    const timeout = setTimeout(() => {
      if (!done) { done = true; reject(new Error('Tx timeout 60s')); }
    }, 60_000);

    tx.signAndSend(keyring, ({ status, events }) => {
      if (status.isFinalized) {
        clearTimeout(timeout);
        if (done) return;
        done = true;

        for (const { event } of events) {
          if (api.events.system.ExtrinsicFailed.is(event)) {
            const [err] = event.data;
            const info = err.isModule
              ? api.registry.findMetaError(err.asModule).name
              : err.toString();
            return reject(new Error('Transfer failed: ' + info));
          }
        }

        console.log(`Transfer finalized in block: ${status.asFinalized.toHex()}`);
        resolve();
      }
    }).catch(err => {
      clearTimeout(timeout);
      if (!done) { done = true; reject(err); }
    });
  });

  const { data: { free: newSenderBal } } = await api.query.system.account(keyring.address);
  const { data: { free: receiverBal } } = await api.query.system.account(TARGET_ADDRESS);

  console.log(`\nSender balance:   ${(Number(BigInt(newSenderBal.toString())) / 1e12).toFixed(4)} VARA`);
  console.log(`Receiver balance: ${(Number(BigInt(receiverBal.toString())) / 1e12).toFixed(4)} VARA`);
  console.log('\nDone!');

  await api.disconnect();
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
