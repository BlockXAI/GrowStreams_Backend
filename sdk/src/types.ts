export interface HealthResponse {
  status: 'healthy' | 'degraded';
  network: string | null;
  account: string | null;
  balance: string | null;
  contracts: Record<string, string | null>;
  uptime: number;
  timestamp: string;
}

export interface StreamConfig {
  admin: string;
  min_buffer_seconds: number;
  next_stream_id: number;
}

export interface Stream {
  id: number;
  sender: string;
  receiver: string;
  token: string;
  flow_rate: number;
  start_time: number;
  last_update: number;
  deposited: number;
  withdrawn: number;
  streamed: number;
  status: 'Active' | 'Paused' | 'Stopped';
}

export interface VaultConfig {
  admin: string;
  stream_core: string;
  paused: boolean;
}

export interface VaultBalance {
  owner: string;
  token: string;
  total_deposited: number;
  total_allocated: number;
  available: number;
}

export interface SplitRecipient {
  address: string;
  weight: number;
}

export interface SplitGroup {
  id: number;
  owner: string;
  recipients: SplitRecipient[];
  total_weight: number;
  created_at: number;
  updated_at: number;
}

export interface Permission {
  granter: string;
  grantee: string;
  scope: string;
  granted_at: number;
  expires_at: number | null;
  active: boolean;
}

export interface Bounty {
  id: number;
  creator: string;
  title: string;
  token: string;
  max_flow_rate: number;
  min_score: number;
  total_budget: number;
  spent: number;
  active_stream: number | null;
  claimer: string | null;
  status: 'Open' | 'Claimed' | 'Streaming' | 'Completed' | 'Cancelled';
  created_at: number;
}

export interface Binding {
  actor_id: string;
  github_username_hash: string;
  verified_at: number;
  proof_hash: string;
  score: number;
  updated_at: number;
}

export interface TxResult {
  result?: unknown;
  blockHash?: string;
}

export interface PayloadResult {
  payload: string;
}

export interface GrowStreamsConfig {
  baseUrl: string;
  timeout?: number;
}
