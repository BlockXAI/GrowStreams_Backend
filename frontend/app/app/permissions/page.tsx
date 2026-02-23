'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useAccount } from '@gear-js/react-hooks';
import { api } from '@/lib/growstreams-api';
import { usePermissionActions } from '@/hooks/useGrowStreams';
import { toast } from 'sonner';
import { Shield, Plus, RefreshCw, Trash2 } from 'lucide-react';

interface PermissionEntry {
  grantee: string;
  scope: string;
}

export default function PermissionsPage() {
  const { account } = useAccount();
  const [permissions, setPermissions] = useState<PermissionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGrant, setShowGrant] = useState(false);
  const { grantPermission, revokePermission, loading: signing } = usePermissionActions();
  const [busy, setBusy] = useState(false);

  const [grantee, setGrantee] = useState('');
  const [scope, setScope] = useState('');

  const loadPermissions = async () => {
    if (!account?.decodedAddress) return;
    setLoading(true);
    try {
      const hex = account.decodedAddress;
      const data = await api.permissions.byGranter(hex);
      setPermissions((data.permissions || []) as PermissionEntry[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, [account]);

  const handleGrant = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await grantPermission(grantee, scope);
      toast.success('Permission granted!');
      setShowGrant(false);
      setGrantee('');
      setScope('');
      setTimeout(loadPermissions, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Grant failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (target: string, targetScope: string) => {
    setBusy(true);
    try {
      await revokePermission(target, targetScope);
      toast.success('Permission revoked');
      setTimeout(loadPermissions, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Revoke failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-400" /> Permissions
          </h1>
          <p className="text-provn-muted text-sm mt-1">Delegate on-chain permissions to other accounts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadPermissions} className="p-2 rounded-lg border border-provn-border hover:bg-provn-surface transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowGrant(!showGrant)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Grant
          </button>
        </div>
      </div>

      {showGrant && (
        <form onSubmit={handleGrant} className="bg-provn-surface border border-provn-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">Grant Permission</h2>
          <div>
            <label className="block text-xs text-provn-muted mb-1">Grantee Address (0x...)</label>
            <input
              value={grantee} onChange={(e) => setGrantee(e.target.value)} required
              className="w-full px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm font-mono focus:border-indigo-500/50 focus:outline-none"
              placeholder="0x0000...0001"
            />
          </div>
          <div>
            <label className="block text-xs text-provn-muted mb-1">Scope</label>
            <select
              value={scope} onChange={(e) => setScope(e.target.value)} required
              className="w-full px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-indigo-500/50 focus:outline-none"
            >
              <option value="">Select a scope...</option>
              <option value="stream:create">stream:create</option>
              <option value="stream:pause">stream:pause</option>
              <option value="stream:resume">stream:resume</option>
              <option value="stream:stop">stream:stop</option>
              <option value="vault:deposit">vault:deposit</option>
              <option value="vault:withdraw">vault:withdraw</option>
              <option value="splits:create">splits:create</option>
              <option value="splits:distribute">splits:distribute</option>
              <option value="bounty:create">bounty:create</option>
              <option value="bounty:verify">bounty:verify</option>
            </select>
          </div>
          <button
            type="submit" disabled={busy || signing}
            className="px-6 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {busy || signing ? 'Signing...' : 'Grant Permission'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
        </div>
      ) : permissions.length === 0 ? (
        <div className="text-center py-16 text-provn-muted">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No permissions granted yet.</p>
        </div>
      ) : (
        <div className="bg-provn-surface border border-provn-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-5 py-3 border-b border-provn-border text-xs text-provn-muted font-medium">
            <span>Grantee</span>
            <span>Scope</span>
            <span>Action</span>
          </div>
          {permissions.map((p, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-4 px-5 py-3 border-b border-provn-border/50 last:border-0 items-center">
              <span className="text-sm font-mono truncate">{p.grantee}</span>
              <span className="text-sm">
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-xs font-medium">{p.scope}</span>
              </span>
              <button
                onClick={() => handleRevoke(p.grantee, p.scope)} disabled={busy}
                className="p-1.5 rounded-lg border border-provn-border hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
                title="Revoke"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
