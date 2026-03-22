// Canton JSON API Client for GrowStreams
// Connects to Canton JSON API at http://localhost:7575

const CANTON_JSON_API_URL = process.env.NEXT_PUBLIC_CANTON_JSON_API_URL || 'http://localhost:7575';

export interface Party {
  party: string;
  displayName: string;
}

export interface StreamAgreement {
  streamId: number;
  sender: string;
  receiver: string;
  admin: string;
  flowRate: string;
  startTime: string;
  lastUpdate: string;
  deposited: string;
  withdrawn: string;
  status: 'Active' | 'Paused' | 'Stopped';
}

export interface ContractResponse<T> {
  status: number;
  result: {
    contractId: string;
    templateId: string;
    payload: T;
  }[];
}

// Calculate accrued tokens (client-side calculation matching Daml formula)
export function calculateAccrued(stream: StreamAgreement, currentTime: Date): number {
  if (stream.status !== 'Active') return 0;
  
  const lastUpdate = new Date(stream.lastUpdate);
  const elapsedSeconds = Math.floor((currentTime.getTime() - lastUpdate.getTime()) / 1000);
  const flowRate = parseFloat(stream.flowRate);
  const accrued = flowRate * elapsedSeconds;
  const available = parseFloat(stream.deposited) - parseFloat(stream.withdrawn);
  
  return Math.min(accrued, available);
}

// Format time remaining
export function formatTimeRemaining(stream: StreamAgreement, currentTime: Date): string {
  if (stream.status !== 'Active') return 'Paused';
  
  const accrued = calculateAccrued(stream, currentTime);
  const remaining = parseFloat(stream.deposited) - parseFloat(stream.withdrawn) - accrued;
  const flowRate = parseFloat(stream.flowRate);
  
  if (remaining <= 0) return 'Depleted';
  if (flowRate === 0) return '∞';
  
  const secondsRemaining = remaining / flowRate;
  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${Math.floor(secondsRemaining)}s`;
}

// Canton JSON API methods
export const cantonAPI = {
  // Query active contracts
  async queryContracts<T>(templateId: string, party: string): Promise<ContractResponse<T>> {
    const response = await fetch(`${CANTON_JSON_API_URL}/v1/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateIds: [templateId],
        query: {},
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Canton API error: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Exercise choice on contract
  async exerciseChoice(contractId: string, choice: string, argument: any, party: string) {
    const response = await fetch(`${CANTON_JSON_API_URL}/v1/exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: 'StreamCore:StreamAgreement',
        contractId,
        choice,
        argument,
        meta: {
          actAs: [party],
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Canton API error: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Create contract
  async createContract(templateId: string, payload: any, party: string) {
    const response = await fetch(`${CANTON_JSON_API_URL}/v1/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId,
        payload,
        meta: {
          actAs: [party],
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Canton API error: ${response.statusText}`);
    }
    
    return response.json();
  },
};
