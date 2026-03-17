import type {
  GrowStreamsConfig,
  HealthResponse,
  StreamConfig,
  Stream,
  VaultConfig,
  VaultBalance,
  SplitGroup,
  SplitRecipient,
  Permission,
  Bounty,
  Binding,
  TxResult,
  PayloadResult,
} from './types.js';

export class GrowStreams {
  private baseUrl: string;
  private timeout: number;

  constructor(config: GrowStreamsConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.timeout = config.timeout || 30000;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...options?.headers },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      return data as T;
    } finally {
      clearTimeout(id);
    }
  }

  private get<T>(path: string) {
    return this.request<T>(path);
  }

  private post<T>(path: string, body?: Record<string, unknown>) {
    return this.request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  }

  private put<T>(path: string, body: Record<string, unknown>) {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  }

  private del<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }

  // ---- Health ----

  health() {
    return this.get<HealthResponse>('/health');
  }

  // ---- StreamCore ----

  readonly streams = {
    config: () => this.get<StreamConfig>('/api/streams/config'),

    total: () => this.get<{ total: string }>('/api/streams/total'),

    active: () => this.get<{ active: string }>('/api/streams/active'),

    get: (id: number) => this.get<Stream>(`/api/streams/${id}`),

    balance: (id: number) => this.get<{ streamId: number; withdrawable: string }>(`/api/streams/${id}/balance`),

    buffer: (id: number) => this.get<{ streamId: number; remainingBuffer: string }>(`/api/streams/${id}/buffer`),

    bySender: (address: string) => this.get<{ sender: string; streamIds: string[] }>(`/api/streams/sender/${address}`),

    byReceiver: (address: string) => this.get<{ receiver: string; streamIds: string[] }>(`/api/streams/receiver/${address}`),

    create: (params: { receiver: string; token: string; flowRate: string; initialDeposit: string; mode?: 'payload' }) =>
      this.post<TxResult | PayloadResult>('/api/streams', params as unknown as Record<string, unknown>),

    update: (id: number, params: { flowRate: string; mode?: 'payload' }) =>
      this.put<TxResult | PayloadResult>(`/api/streams/${id}`, params as unknown as Record<string, unknown>),

    pause: (id: number, mode?: 'payload') =>
      this.post<TxResult | PayloadResult>(`/api/streams/${id}/pause`, mode ? { mode } : undefined),

    resume: (id: number, mode?: 'payload') =>
      this.post<TxResult | PayloadResult>(`/api/streams/${id}/resume`, mode ? { mode } : undefined),

    deposit: (id: number, params: { amount: string; mode?: 'payload' }) =>
      this.post<TxResult | PayloadResult>(`/api/streams/${id}/deposit`, params as unknown as Record<string, unknown>),

    withdraw: (id: number, mode?: 'payload') =>
      this.post<TxResult | PayloadResult>(`/api/streams/${id}/withdraw`, mode ? { mode } : undefined),

    stop: (id: number, mode?: 'payload') =>
      this.post<TxResult | PayloadResult>(`/api/streams/${id}/stop`, mode ? { mode } : undefined),

    liquidate: (id: number, mode?: 'payload') =>
      this.post<TxResult | PayloadResult>(`/api/streams/${id}/liquidate`, mode ? { mode } : undefined),
  };

  // ---- TokenVault ----

  readonly vault = {
    config: () => this.get<VaultConfig>('/api/vault/config'),

    paused: () => this.get<{ paused: boolean }>('/api/vault/paused'),

    balance: (owner: string, token: string) => this.get<VaultBalance>(`/api/vault/balance/${owner}/${token}`),

    allocation: (streamId: number) => this.get<{ streamId: number; allocated: string }>(`/api/vault/allocation/${streamId}`),

    deposit: (params: { token: string; amount: string; mode?: 'payload' }) =>
      this.post<TxResult | PayloadResult>('/api/vault/deposit', params as unknown as Record<string, unknown>),

    withdraw: (params: { token: string; amount: string; mode?: 'payload' }) =>
      this.post<TxResult | PayloadResult>('/api/vault/withdraw', params as unknown as Record<string, unknown>),

    depositNative: (params: { amount: string; mode?: 'payload' }) =>
      this.post<TxResult | PayloadResult>('/api/vault/deposit-native', params as unknown as Record<string, unknown>),

    withdrawNative: (params: { amount: string; mode?: 'payload' }) =>
      this.post<TxResult | PayloadResult>('/api/vault/withdraw-native', params as unknown as Record<string, unknown>),

    pause: (mode?: 'payload') =>
      this.post<TxResult | PayloadResult>('/api/vault/pause', mode ? { mode } : undefined),

    unpause: (mode?: 'payload') =>
      this.post<TxResult | PayloadResult>('/api/vault/unpause', mode ? { mode } : undefined),
  };

  // ---- SplitsRouter ----

  readonly splits = {
    config: () => this.get<{ admin: string; total_groups: string }>('/api/splits/config'),

    total: () => this.get<{ total: string }>('/api/splits/total'),

    get: (id: number) => this.get<SplitGroup>(`/api/splits/${id}`),

    byOwner: (address: string) => this.get<{ owner: string; groupIds: string[] }>(`/api/splits/owner/${address}`),

    preview: (id: number, amount: string) => this.get<{ groupId: number; amount: string; shares: unknown[] }>(`/api/splits/${id}/preview/${amount}`),

    create: (params: { recipients: SplitRecipient[]; mode?: 'payload' }) =>
      this.post<TxResult | PayloadResult>('/api/splits', params as unknown as Record<string, unknown>),

    update: (id: number, params: { recipients: SplitRecipient[]; mode?: 'payload' }) =>
      this.put<TxResult | PayloadResult>(`/api/splits/${id}`, params as unknown as Record<string, unknown>),

    delete: (id: number) => this.del<TxResult>(`/api/splits/${id}`),

    distribute: (id: number, params: { token: string; amount: string; mode?: 'payload' }) =>
      this.post<TxResult | PayloadResult>(`/api/splits/${id}/distribute`, params as unknown as Record<string, unknown>),
  };

  // ---- PermissionManager ----

  readonly permissions = {
    config: () => this.get<{ admin: string; stream_core: string }>('/api/permissions/config'),

    total: () => this.get<{ total: string }>('/api/permissions/total'),

    check: (granter: string, grantee: string, scope: string) =>
      this.get<{ granter: string; grantee: string; scope: string; hasPermission: boolean }>(`/api/permissions/check/${granter}/${grantee}/${scope}`),

    byGranter: (address: string) => this.get<{ granter: string; permissions: Permission[] }>(`/api/permissions/granter/${address}`),

    byGrantee: (address: string) => this.get<{ grantee: string; permissions: Permission[] }>(`/api/permissions/grantee/${address}`),

    grant: (params: { grantee: string; scope: string; expiresAt?: number; mode?: 'payload' }) =>
      this.post<TxResult | PayloadResult>('/api/permissions/grant', params as unknown as Record<string, unknown>),

    revoke: (params: { grantee: string; scope: string; mode?: 'payload' }) =>
      this.post<TxResult | PayloadResult>('/api/permissions/revoke', params as unknown as Record<string, unknown>),

    revokeAll: (params: { grantee: string; mode?: 'payload' }) =>
      this.post<TxResult | PayloadResult>('/api/permissions/revoke-all', params as unknown as Record<string, unknown>),
  };

  // ---- BountyAdapter ----

  readonly bounty = {
    config: () => this.get<{ admin: string; stream_core: string; identity_registry: string }>('/api/bounty/config'),

    total: () => this.get<{ total: string }>('/api/bounty/total'),

    open: () => this.get<{ bountyIds: string[] }>('/api/bounty/open'),

    get: (id: number) => this.get<Bounty>(`/api/bounty/${id}`),

    byCreator: (address: string) => this.get<{ creator: string; bountyIds: string[] }>(`/api/bounty/creator/${address}`),

    byClaimer: (address: string) => this.get<{ claimer: string; bountyIds: string[] }>(`/api/bounty/claimer/${address}`),

    create: (params: { title: string; token: string; maxFlowRate: string; minScore: number; totalBudget: string; mode?: 'payload' }) =>
      this.post<TxResult | PayloadResult>('/api/bounty', params as unknown as Record<string, unknown>),

    claim: (id: number, mode?: 'payload') =>
      this.post<TxResult | PayloadResult>(`/api/bounty/${id}/claim`, mode ? { mode } : undefined),

    verify: (id: number, params: { claimer: string; score: number; mode?: 'payload' }) =>
      this.post<TxResult | PayloadResult>(`/api/bounty/${id}/verify`, params as unknown as Record<string, unknown>),

    complete: (id: number, mode?: 'payload') =>
      this.post<TxResult | PayloadResult>(`/api/bounty/${id}/complete`, mode ? { mode } : undefined),

    cancel: (id: number, mode?: 'payload') =>
      this.post<TxResult | PayloadResult>(`/api/bounty/${id}/cancel`, mode ? { mode } : undefined),
  };

  // ---- IdentityRegistry ----

  readonly identity = {
    config: () => this.get<{ oracle: string; total_bindings: number }>('/api/identity/config'),

    oracle: () => this.get<{ oracle: string }>('/api/identity/oracle'),

    total: () => this.get<{ total: string }>('/api/identity/total'),

    getBinding: (actorId: string) => this.get<Binding>(`/api/identity/binding/${actorId}`),

    byGithub: (username: string) => this.get<{ github: string; actorId: string }>(`/api/identity/github/${username}`),

    bind: (params: { actorId: string; githubUsername: string; proofHash: string; score: number; mode?: 'payload' }) =>
      this.post<TxResult | PayloadResult>('/api/identity/bind', params as unknown as Record<string, unknown>),

    revoke: (params: { actorId: string; mode?: 'payload' }) =>
      this.post<TxResult | PayloadResult>('/api/identity/revoke', params as unknown as Record<string, unknown>),

    updateScore: (params: { actorId: string; newScore: number; mode?: 'payload' }) =>
      this.post<TxResult | PayloadResult>('/api/identity/update-score', params as unknown as Record<string, unknown>),
  };
}
