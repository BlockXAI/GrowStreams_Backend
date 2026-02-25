const API_BASE = process.env.NEXT_PUBLIC_GROWSTREAMS_API || 'https://growstreams-core-production.up.railway.app';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

function get<T>(path: string) {
  return request<T>(path);
}

function post<T>(path: string, body?: Record<string, unknown>) {
  return request<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

function put<T>(path: string, body: Record<string, unknown>) {
  return request<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

function del<T>(path: string) {
  return request<T>(path, { method: 'DELETE' });
}

export interface HealthData {
  status: string;
  network: string;
  account: string;
  balance: string;
  contracts: Record<string, string | null>;
  uptime: number;
}

export interface StreamConfig {
  admin: string;
  min_buffer_seconds: number;
  next_stream_id: number;
  token_vault: string;
}

export interface StreamData {
  id: number;
  sender: string;
  receiver: string;
  token: string;
  flow_rate: string;
  start_time: number;
  last_update: number;
  deposited: string;
  withdrawn: string;
  streamed: string;
  status: string;
}

export interface VaultBalance {
  deposited: string;
  allocated: string;
  available: string;
}

export interface SplitGroup {
  id: number;
  owner: string;
  recipients: { address: string; weight: number }[];
  total_weight: number;
}

export interface BountyData {
  id: number;
  title: string;
  creator: string;
  token: string;
  max_flow_rate: string;
  min_score: number;
  total_budget: string;
  status: string;
}

export interface BindingData {
  actor_id: string;
  github_username_hash: string;
  verified_at: number;
  proof_hash: string;
  score: number;
  updated_at: number;
}

export interface TxResult {
  result?: unknown;
  blockHash: string;
}

export interface PayloadResult {
  payload: string;
  value?: string;
}

export const api = {
  health: () => get<HealthData>('/health'),

  streams: {
    config: () => get<StreamConfig>('/api/streams/config'),
    total: () => get<{ total: string }>('/api/streams/total'),
    active: () => get<{ active: string }>('/api/streams/active'),
    get: (id: number) => get<StreamData>(`/api/streams/${id}`),
    bySender: (addr: string) => get<{ sender: string; streamIds: string[] }>(`/api/streams/sender/${addr}`),
    byReceiver: (addr: string) => get<{ receiver: string; streamIds: string[] }>(`/api/streams/receiver/${addr}`),
    balance: (id: number) => get<{ streamId: number; withdrawable: string }>(`/api/streams/${id}/balance`),
    buffer: (id: number) => get<{ streamId: number; remainingBuffer: string }>(`/api/streams/${id}/buffer`),

    create: (params: { receiver: string; token: string; flowRate: string; initialDeposit: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/streams', params as unknown as Record<string, unknown>),
    update: (id: number, params: { flowRate: string; mode?: string }) =>
      put<TxResult | PayloadResult>(`/api/streams/${id}`, params as unknown as Record<string, unknown>),
    pause: (id: number, mode?: string) =>
      post<TxResult | PayloadResult>(`/api/streams/${id}/pause`, mode ? { mode } : undefined),
    resume: (id: number, mode?: string) =>
      post<TxResult | PayloadResult>(`/api/streams/${id}/resume`, mode ? { mode } : undefined),
    deposit: (id: number, params: { amount: string; mode?: string }) =>
      post<TxResult | PayloadResult>(`/api/streams/${id}/deposit`, params as unknown as Record<string, unknown>),
    withdraw: (id: number, mode?: string) =>
      post<TxResult | PayloadResult>(`/api/streams/${id}/withdraw`, mode ? { mode } : undefined),
    stop: (id: number, mode?: string) =>
      post<TxResult | PayloadResult>(`/api/streams/${id}/stop`, mode ? { mode } : undefined),
    liquidate: (id: number, mode?: string) =>
      post<TxResult | PayloadResult>(`/api/streams/${id}/liquidate`, mode ? { mode } : undefined),
  },

  vault: {
    config: () => get<Record<string, unknown>>('/api/vault/config'),
    paused: () => get<{ paused: boolean }>('/api/vault/paused'),
    balance: (owner: string, token: string) => get<VaultBalance>(`/api/vault/balance/${owner}/${token}`),
    allocation: (streamId: number) => get<{ streamId: number; allocated: string }>(`/api/vault/allocation/${streamId}`),

    deposit: (params: { token: string; amount: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/vault/deposit', params as unknown as Record<string, unknown>),
    withdraw: (params: { token: string; amount: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/vault/withdraw', params as unknown as Record<string, unknown>),
    depositNative: (params: { amount: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/vault/deposit-native', params as unknown as Record<string, unknown>),
    withdrawNative: (params: { amount: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/vault/withdraw-native', params as unknown as Record<string, unknown>),
    pause: (mode?: string) =>
      post<TxResult | PayloadResult>('/api/vault/pause', mode ? { mode } : undefined),
    unpause: (mode?: string) =>
      post<TxResult | PayloadResult>('/api/vault/unpause', mode ? { mode } : undefined),
  },

  splits: {
    config: () => get<Record<string, unknown>>('/api/splits/config'),
    total: () => get<{ total: string }>('/api/splits/total'),
    get: (id: number) => get<SplitGroup>(`/api/splits/${id}`),
    byOwner: (addr: string) => get<{ owner: string; groupIds: string[] }>(`/api/splits/owner/${addr}`),
    preview: (id: number, amount: string) => get<{ groupId: number; shares: unknown[] }>(`/api/splits/${id}/preview/${amount}`),

    create: (params: { recipients: { address: string; weight: number }[]; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/splits', params as unknown as Record<string, unknown>),
    update: (id: number, params: { recipients: { address: string; weight: number }[]; mode?: string }) =>
      put<TxResult | PayloadResult>(`/api/splits/${id}`, params as unknown as Record<string, unknown>),
    delete: (id: number) => del<TxResult>(`/api/splits/${id}`),
    distribute: (id: number, params: { token: string; amount: string; mode?: string }) =>
      post<TxResult | PayloadResult>(`/api/splits/${id}/distribute`, params as unknown as Record<string, unknown>),
  },

  permissions: {
    config: () => get<Record<string, unknown>>('/api/permissions/config'),
    total: () => get<{ total: string }>('/api/permissions/total'),
    check: (granter: string, grantee: string, scope: string) =>
      get<{ hasPermission: boolean }>(`/api/permissions/check/${granter}/${grantee}/${scope}`),
    byGranter: (addr: string) => get<{ permissions: unknown[] }>(`/api/permissions/granter/${addr}`),

    grant: (params: { grantee: string; scope: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/permissions/grant', params as unknown as Record<string, unknown>),
    revoke: (params: { grantee: string; scope: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/permissions/revoke', params as unknown as Record<string, unknown>),
  },

  bounty: {
    config: () => get<Record<string, unknown>>('/api/bounty/config'),
    total: () => get<{ total: string }>('/api/bounty/total'),
    open: () => get<{ bountyIds: string[] }>('/api/bounty/open'),
    get: (id: number) => get<BountyData>(`/api/bounty/${id}`),
    byCreator: (addr: string) => get<{ bountyIds: string[] }>(`/api/bounty/creator/${addr}`),
    byClaimer: (addr: string) => get<{ bountyIds: string[] }>(`/api/bounty/claimer/${addr}`),

    create: (params: { title: string; token: string; maxFlowRate: string; minScore: number; totalBudget: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/bounty', params as unknown as Record<string, unknown>),
    claim: (id: number, mode?: string) =>
      post<TxResult | PayloadResult>(`/api/bounty/${id}/claim`, mode ? { mode } : undefined),
    verify: (id: number, params: { claimer: string; score: number; mode?: string }) =>
      post<TxResult | PayloadResult>(`/api/bounty/${id}/verify`, params as unknown as Record<string, unknown>),
    complete: (id: number, mode?: string) =>
      post<TxResult | PayloadResult>(`/api/bounty/${id}/complete`, mode ? { mode } : undefined),
    cancel: (id: number, mode?: string) =>
      post<TxResult | PayloadResult>(`/api/bounty/${id}/cancel`, mode ? { mode } : undefined),
  },

  identity: {
    config: () => get<{ oracle: string; total_bindings: number }>('/api/identity/config'),
    oracle: () => get<{ oracle: string }>('/api/identity/oracle'),
    total: () => get<{ total: string }>('/api/identity/total'),
    getBinding: (actorId: string) => get<BindingData>(`/api/identity/binding/${actorId}`),
    byGithub: (username: string) => get<{ actorId: string }>(`/api/identity/github/${username}`),

    bind: (params: { actorId: string; githubUsername: string; proofHash: string; score: number; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/identity/bind', params as unknown as Record<string, unknown>),
    revoke: (params: { actorId: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/identity/revoke', params as unknown as Record<string, unknown>),
    updateScore: (params: { actorId: string; newScore: number; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/identity/update-score', params as unknown as Record<string, unknown>),
  },
};
