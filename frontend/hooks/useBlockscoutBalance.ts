import { useState, useCallback, useEffect } from 'react';

interface BalanceResponse {
  status: string;
  message: string;
  result: string;
}

interface UseBlockscoutBalanceReturn {
  balance: string;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const BLOCKSCOUT_API_BASE = 'https://basecamp.cloud.blockscout.com/api';
const PROVN_TOKEN_ADDRESS = '0xa673B3E946A64037AdBAe22a0f56916dE43c678c';

export const useBlockscoutBalance = (walletAddress: string | null): UseBlockscoutBalanceReturn => {
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async (retryCount = 0): Promise<void> => {
    if (!walletAddress) {
      setBalance('0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `${BLOCKSCOUT_API_BASE}?module=account&action=tokenbalance&contractaddress=${PROVN_TOKEN_ADDRESS}&address=${walletAddress}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Provn-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: BalanceResponse = await response.json();
      
      if (data.status === '1' && data.result) {
        // Convert from wei to PROVN tokens (18 decimals)
        const balanceInWei = BigInt(data.result);
        const balanceInEther = Number(balanceInWei) / Math.pow(10, 18);
        setBalance(balanceInEther.toFixed(4));
      } else {
        // If no balance or error, try native balance check
        if (retryCount < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchBalance(retryCount + 1);
        }
        setBalance('0');
      }
    } catch (err: any) {
      console.error('Failed to fetch balance from Blockscout:', err);
      
      // Retry logic with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchBalance(retryCount + 1);
      }
      
      setError(err.message || 'Failed to fetch balance');
      setBalance('0');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Fetch balance when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
    } else {
      setBalance('0');
      setError(null);
    }
  }, [walletAddress, fetchBalance]);

  return {
    balance,
    loading,
    error,
    refetch: () => fetchBalance()
  };
};

// Utility function to add PROVN token to wallet
export const addProvnTokenToWallet = async (): Promise<boolean> => {
  try {
  const w = window as unknown as { ethereum?: any }
  if (!w.ethereum) {
      throw new Error('No wallet detected');
    }

  const wasAdded = await w.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: PROVN_TOKEN_ADDRESS,
          symbol: 'PROVN',
          decimals: 18,
          image: 'https://raw.githubusercontent.com/provn-network/assets/main/provn-logo.png'
        },
      },
    });

    return wasAdded;
  } catch (error) {
    console.error('Failed to add PROVN token to wallet:', error);
    return false;
  }
};