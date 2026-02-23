'use client';

import { useState, useCallback } from 'react';
import { useApi, useAccount } from '@gear-js/react-hooks';
import { web3FromSource } from '@polkadot/extension-dapp';
import { api as gsApi, type PayloadResult, type TxResult } from '@/lib/growstreams-api';

const PROGRAM_IDS: Record<string, string> = {
  streamCore: '0xf8e1e0ab81434b94357c1203b681206931c2e30ef350c0aac8fcfac45c2ea249',
  tokenVault: '0x25e433af499bd4428c8bf9b190722e8f9b66339d08df3d7b84bc31565d997d3e',
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

function decodePayload(hex: string): string {
  if (!hex.startsWith('0x')) return hex;
  try {
    const bytes = new Uint8Array(
      (hex.slice(2).match(/.{2}/g) || []).map((b) => parseInt(b, 16))
    );
    const text = new TextDecoder().decode(bytes);
    if (text.startsWith('0x') && /^0x[0-9a-fA-F]+$/.test(text)) {
      return text;
    }
  } catch { /* not double-encoded, use as-is */ }
  return hex;
}

function getPayload(res: TxResult | PayloadResult): string {
  if (!isPayload(res)) throw new Error('Expected payload from API');
  return decodePayload(res.payload);
}

export function useGearSign() {
  const { api } = useApi();
  const { account } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signAndSend = useCallback(
    async (contract: keyof typeof PROGRAM_IDS, payloadHex: string): Promise<SendResult> => {
      if (!api || !account) throw new Error('Wallet not connected');

      setLoading(true);
      setError(null);

      try {
        const programId = PROGRAM_IDS[contract] as `0x${string}`;
        const injector = await web3FromSource(account.meta.source);

        const gas = await api.program.calculateGas.handle(
          account.decodedAddress as `0x${string}`,
          programId,
          payloadHex as `0x${string}`,
          0,
          true,
        );

        return new Promise((resolve, reject) => {
          const tx = api.message.send({
            destination: programId,
            payload: payloadHex as `0x${string}`,
            gasLimit: gas.min_limit,
            value: 0,
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tx.signAndSend(account.address, { signer: injector.signer as any }, ({ status }) => {
            if (status.isInBlock) {
              resolve({ blockHash: status.asInBlock.toHex(), success: true });
            } else if (status.isFinalized) {
              resolve({ blockHash: status.asFinalized.toHex(), success: true });
            } else if (status.isInvalid) {
              reject(new Error('Transaction invalid'));
            }
          }).catch(reject);
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
    const res = await gsApi.streams.create({ receiver, token, flowRate, initialDeposit, mode: 'payload' });
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

  return {
    createStream, pauseStream, resumeStream, depositToStream,
    withdrawFromStream, stopStream, updateStream,
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

  return { depositTokens, withdrawTokens, loading, error };
}

export function useSplitsActions() {
  const { signAndSend, loading, error } = useGearSign();

  const createGroup = async (recipients: { address: string; weight: number }[]) => {
    const res = await gsApi.splits.create({ recipients, mode: 'payload' });
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
    const res = await gsApi.permissions.grant({ grantee, scope, mode: 'payload' });
    return signAndSend('permissionManager', getPayload(res));
  };

  const revokePermission = async (grantee: string, scope: string) => {
    const res = await gsApi.permissions.revoke({ grantee, scope, mode: 'payload' });
    return signAndSend('permissionManager', getPayload(res));
  };

  return { grantPermission, revokePermission, loading, error };
}

export function useIdentityActions() {
  const { signAndSend, loading, error } = useGearSign();

  const bindIdentity = async (actorId: string, githubUsername: string, proofHash: string, score: number) => {
    const res = await gsApi.identity.bind({ actorId, githubUsername, proofHash, score, mode: 'payload' });
    return signAndSend('identityRegistry', getPayload(res));
  };

  return { bindIdentity, loading, error };
}
