'use client';

import { useState, useCallback } from 'react';
import { useApi, useAccount } from '@gear-js/react-hooks';
import { web3Enable, web3FromSource, web3FromAddress } from '@polkadot/extension-dapp';
import { decodeAddress } from '@gear-js/api';
import { api as gsApi, type PayloadResult, type TxResult } from '@/lib/growstreams-api';

const PROGRAM_IDS: Record<string, string> = {
  streamCore: '0x2e7c2064344449504c9c638261bab78238ae50b8a47faac5beae2d1915d70a56',
  tokenVault: '0xa6b64dd5c89c5c0b12c15a54de23995e91fb23f61de35e50393a0d40b975ac90',
  splitsRouter: '0xe4fe59166d824a0f710488b02e039f3fe94980756e3571fc93ba083b5b88b894',
  permissionManager: '0x6cce66023765a57cbc6adf5dfe7df66ee636af56ab7d92a8f614bd8c229f88cb',
  bountyAdapter: '0xd5377611a285d3efcbe9369361647d13f3a9c60ed70d648eaa21c08c72268f81',
  identityRegistry: '0xb6389d1da594b84a73f3a5178caa25ff56ec0f57f2f8a9d42f8b1b6fba9d948a',
};

interface SendResult {
  blockHash: string;
  success: boolean;
}

function isPayload(r: TxResult | PayloadResult): r is PayloadResult {
  return 'payload' in r;
}

function getPayload(res: TxResult | PayloadResult): string {
  if (!isPayload(res)) throw new Error('Expected payload from API');
  const p = res.payload;
  if (typeof p === 'string' && p.startsWith('0x')) return p;
  return p;
}

function toHex(address: string): string {
  if (address.startsWith('0x') && address.length === 66) return address;
  try {
    return decodeAddress(address);
  } catch {
    return address;
  }
}

export function useGearSign() {
  const { api } = useApi();
  const { account } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signAndSend = useCallback(
    async (contract: keyof typeof PROGRAM_IDS, payloadHex: string, value = 0): Promise<SendResult> => {
      if (!api) throw new Error('Gear API not connected. Please wait for the network connection.');
      if (!account) throw new Error('Wallet not connected. Please connect your Vara wallet first.');

      setLoading(true);
      setError(null);

      try {
        const programId = PROGRAM_IDS[contract] as `0x${string}`;

        await web3Enable('GrowStreams');

        let injector;
        try {
          injector = await web3FromSource(account.meta.source);
        } catch {
          injector = await web3FromAddress(account.address);
        }
        if (!injector?.signer) {
          throw new Error('Could not access wallet signer. Please reconnect your wallet.');
        }

        const gas = await api.program.calculateGas.handle(
          account.decodedAddress as `0x${string}`,
          programId,
          payloadHex as `0x${string}`,
          value,
          true,
        );

        const minGas = BigInt(gas.min_limit.toString());
        const gasLimit = (minGas * BigInt(6) / BigInt(5)).toString();

        return new Promise((resolve, reject) => {
          const tx = api.message.send({
            destination: programId,
            payload: payloadHex as `0x${string}`,
            gasLimit,
            value,
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tx.signAndSend(account.address, { signer: injector.signer as any }, ({ status, events }) => {
            if (status.isInBlock) {
              const failed = events?.some((e) =>
                api.events.system.ExtrinsicFailed.is(e.event)
              );
              if (failed) {
                reject(new Error('Transaction failed on-chain. Check contract parameters.'));
              } else {
                resolve({ blockHash: status.asInBlock.toHex(), success: true });
              }
            } else if (status.isFinalized) {
              resolve({ blockHash: status.asFinalized.toHex(), success: true });
            } else if (status.isInvalid) {
              reject(new Error('Transaction invalid — it may have been dropped by the network.'));
            }
          }).catch((err) => {
            if (err?.message?.includes('Cancelled') || err?.message?.includes('Rejected')) {
              reject(new Error('Transaction was cancelled by the user.'));
            } else {
              reject(err);
            }
          });
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Transaction failed';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api, account],
  );

  return { signAndSend, loading, error, account };
}

export function useStreamActions() {
  const { signAndSend, loading, error, account } = useGearSign();

  const createStream = async (receiver: string, token: string, flowRate: string, initialDeposit: string) => {
    const res = await gsApi.streams.create({ receiver: toHex(receiver), token: toHex(token), flowRate, initialDeposit, mode: 'payload' });
    return signAndSend('streamCore', getPayload(res));
  };

  const pauseStream = async (id: number) => {
    const res = await gsApi.streams.pause(id, 'payload');
    return signAndSend('streamCore', getPayload(res));
  };

  const resumeStream = async (id: number) => {
    const res = await gsApi.streams.resume(id, 'payload');
    return signAndSend('streamCore', getPayload(res));
  };

  const depositToStream = async (id: number, amount: string) => {
    const res = await gsApi.streams.deposit(id, { amount, mode: 'payload' });
    return signAndSend('streamCore', getPayload(res));
  };

  const withdrawFromStream = async (id: number) => {
    const res = await gsApi.streams.withdraw(id, 'payload');
    return signAndSend('streamCore', getPayload(res));
  };

  const stopStream = async (id: number) => {
    const res = await gsApi.streams.stop(id, 'payload');
    return signAndSend('streamCore', getPayload(res));
  };

  const updateStream = async (id: number, flowRate: string) => {
    const res = await gsApi.streams.update(id, { flowRate, mode: 'payload' });
    return signAndSend('streamCore', getPayload(res));
  };

  const liquidateStream = async (id: number) => {
    const res = await gsApi.streams.liquidate(id, 'payload');
    return signAndSend('streamCore', getPayload(res));
  };

  return {
    createStream, pauseStream, resumeStream, depositToStream,
    withdrawFromStream, stopStream, updateStream, liquidateStream,
    loading, error, account,
  };
}

export function useVaultActions() {
  const { signAndSend, loading, error } = useGearSign();

  const depositTokens = async (token: string, amount: string) => {
    const res = await gsApi.vault.deposit({ token, amount, mode: 'payload' });
    return signAndSend('tokenVault', getPayload(res));
  };

  const withdrawTokens = async (token: string, amount: string) => {
    const res = await gsApi.vault.withdraw({ token, amount, mode: 'payload' });
    return signAndSend('tokenVault', getPayload(res));
  };

  const depositNative = async (amount: string) => {
    const res = await gsApi.vault.depositNative({ amount, mode: 'payload' });
    return signAndSend('tokenVault', getPayload(res), Number(amount));
  };

  const withdrawNative = async (amount: string) => {
    const res = await gsApi.vault.withdrawNative({ amount, mode: 'payload' });
    return signAndSend('tokenVault', getPayload(res));
  };

  return { depositTokens, withdrawTokens, depositNative, withdrawNative, loading, error };
}

export function useSplitsActions() {
  const { signAndSend, loading, error } = useGearSign();

  const createGroup = async (recipients: { address: string; weight: number }[]) => {
    const mapped = recipients.map(r => ({ ...r, address: toHex(r.address) }));
    const res = await gsApi.splits.create({ recipients: mapped, mode: 'payload' });
    return signAndSend('splitsRouter', getPayload(res));
  };

  const distribute = async (id: number, token: string, amount: string) => {
    const res = await gsApi.splits.distribute(id, { token, amount, mode: 'payload' });
    return signAndSend('splitsRouter', getPayload(res));
  };

  const deleteGroup = async (id: number) => {
    return gsApi.splits.delete(id);
  };

  return { createGroup, distribute, deleteGroup, loading, error };
}

export function useBountyActions() {
  const { signAndSend, loading, error } = useGearSign();

  const createBounty = async (title: string, token: string, maxFlowRate: string, minScore: number, totalBudget: string) => {
    const res = await gsApi.bounty.create({ title, token, maxFlowRate, minScore, totalBudget, mode: 'payload' });
    return signAndSend('bountyAdapter', getPayload(res));
  };

  const claimBounty = async (id: number) => {
    const res = await gsApi.bounty.claim(id, 'payload');
    return signAndSend('bountyAdapter', getPayload(res));
  };

  const completeBounty = async (id: number) => {
    const res = await gsApi.bounty.complete(id, 'payload');
    return signAndSend('bountyAdapter', getPayload(res));
  };

  return { createBounty, claimBounty, completeBounty, loading, error };
}

export function usePermissionActions() {
  const { signAndSend, loading, error } = useGearSign();

  const grantPermission = async (grantee: string, scope: string) => {
    const res = await gsApi.permissions.grant({ grantee: toHex(grantee), scope, mode: 'payload' });
    return signAndSend('permissionManager', getPayload(res));
  };

  const revokePermission = async (grantee: string, scope: string) => {
    const res = await gsApi.permissions.revoke({ grantee: toHex(grantee), scope, mode: 'payload' });
    return signAndSend('permissionManager', getPayload(res));
  };

  return { grantPermission, revokePermission, loading, error };
}

export function useIdentityActions() {
  const { signAndSend, loading, error } = useGearSign();

  const bindIdentity = async (actorId: string, githubUsername: string, proofHash: string, score: number) => {
    const res = await gsApi.identity.bind({ actorId: toHex(actorId), githubUsername, proofHash, score, mode: 'payload' });
    return signAndSend('identityRegistry', getPayload(res));
  };

  return { bindIdentity, loading, error };
}
