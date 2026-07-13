import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Button, Card, EmptyState, Modal } from '../../components';
import {
  Building, Building2, CheckCircle, XCircle, ShieldAlert,
  RotateCcw, Trash2, Loader2, AlertCircle, Info,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Institute {
  id: string;
  name: string;
  slug: string;
  address: string;
  email: string;
  phone: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  rejectionReason: string | null;
  users: User[];
  createdAt: string;
}

type TabId = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

// ─── Action modal state ───────────────────────────────────────────────────────
interface ActionModal {
  type: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete';
  institute: Institute;
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const statusConfig = {
  PENDING:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   label: 'Pending' },
  APPROVED:  { color: '#10b981', bg: 'rgba(16,185,129,0.12)',   label: 'Active' },
  REJECTED:  { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', label: 'Rejected' },
  SUSPENDED: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: 'Suspended' },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InstitutesManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('PENDING');
  const [actionModal, setActionModal] = useState<ActionModal | null>(null);
  const [reason, setReason] = useState('');

  // Fetch institutes per tab
  const { data: institutes, isLoading } = useQuery({
    queryKey: ['institutes', activeTab],
    queryFn: async () => {
      const res = await api.get(`/institutes?status=${activeTab}`);
      return res.data.institutes as Institute[];
    },
  });

  // Fetch counts for tab badges
  const { data: statsData } = useQuery({
    queryKey: ['superadmin-stats'],
    queryFn: async () => {
      const res = await api.get('/institutes/stats');
      return res.data.stats as Record<string, number>;
    },
  });

  const tabCounts: Record<TabId, number> = {
    PENDING:   statsData?.pending   ?? 0,
    APPROVED:  statsData?.approved  ?? 0,
    SUSPENDED: statsData?.suspended ?? 0,
    REJECTED:  statsData?.rejected  ?? 0,
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['institutes'] });
    queryClient.invalidateQueries({ queryKey: ['superadmin-stats'] });
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const endpoint =
        status === 'APPROVED'    ? `/institutes/${id}/approve`    :
        status === 'REJECTED'    ? `/institutes/${id}/reject`     :
        status === 'SUSPENDED'   ? `/institutes/${id}/suspend`    :
        status === 'REACTIVATE'  ? `/institutes/${id}/reactivate` : '';
      return api.patch(endpoint, { reason });
    },
    onSuccess: () => {
      toast.success('Institute status updated');
      setActionModal(null);
      setReason('');
      invalidate();
    },
    onError: (err) => {
      const e = err as AxiosError<{ message?: string }>;
      toast.error(e.response?.data?.message || 'Failed to update status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/institutes/${id}`),
    onSuccess: () => {
      toast.success('Institute deleted permanently');
      setActionModal(null);
      invalidate();
    },
    onError: (err) => {
      const e = err as AxiosError<{ message?: string }>;
      toast.error(e.response?.data?.message || 'Failed to delete');
    },
  });

  const isBusy = updateStatusMutation.isPending || deleteMutation.isPending;

  // ── Confirm action in modal
  const handleConfirm = () => {
    if (!actionModal) return;
    const { type, institute } = actionModal;

    if (type === 'reject' && !reason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }
    if (type === 'delete') {
      deleteMutation.mutate(institute.id);
    } else {
      const statusMap = {
        approve:    'APPROVED',
        reject:     'REJECTED',
        suspend:    'SUSPENDED',
        reactivate: 'REACTIVATE',
      } as const;
      updateStatusMutation.mutate({
        id: institute.id,
        status: statusMap[type],
        reason: reason.trim() || undefined,
      });
    }
  };

  // ── Modal config
  const modalConfig = actionModal && {
    approve:    { title: 'Approve Institute', color: '#10b981', icon: <CheckCircle className="w-5 h-5 text-emerald-400" /> },
    reject:     { title: 'Reject Institute',  color: '#ef4444', icon: <XCircle    className="w-5 h-5 text-red-400" /> },
    suspend:    { title: 'Suspend Institute', color: '#ef4444', icon: <ShieldAlert className="w-5 h-5 text-red-400" /> },
    reactivate: { title: 'Reactivate Institute', color: '#10b981', icon: <RotateCcw className="w-5 h-5 text-emerald-400" /> },
    delete:     { title: 'Delete Institute', color: '#ef4444', icon: <Trash2      className="w-5 h-5 text-red-400" /> },
  }[actionModal.type];

  const tabs: { id: TabId; label: string }[] = [
    { id: 'PENDING',   label: 'Pending' },
    { id: 'APPROVED',  label: 'Active' },
    { id: 'SUSPENDED', label: 'Suspended' },
    { id: 'REJECTED',  label: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1
          className="text-2xl font-bold flex items-center gap-2"
          style={{ color: 'var(--text-primary)' }}
        >
          <Building className="w-6 h-6" style={{ color: 'var(--brand-500)' }} />
          Institute Management
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Manage registrations, review requests, and control platform access.
        </p>
      </div>

      {/* Tabs with badge counts */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border)' }}>
        {tabs.map((tab) => {
          const count = tabCounts[tab.id];
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 font-medium text-sm transition-colors border-b-2 -mb-px"
              style={{
                borderColor: active ? 'var(--brand-500)' : 'transparent',
                color: active ? 'var(--brand-500)' : 'var(--text-muted)',
              }}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                  style={{
                    background: active ? 'var(--brand-500)' : 'var(--border)',
                    color: active ? 'white' : 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead
            className="text-xs uppercase tracking-wider font-semibold border-b"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <tr>
              <th className="px-6 py-4">Institute</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Admin</th>
              <th className="px-6 py-4">Registered</th>
              {activeTab === 'REJECTED' && <th className="px-6 py-4">Reason</th>}
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Loader2
                    className="w-6 h-6 animate-spin mx-auto"
                    style={{ color: 'var(--text-muted)' }}
                  />
                </td>
              </tr>
            ) : !institutes?.length ? (
              <tr>
                <td colSpan={6} className="px-6 py-12">
                  <EmptyState
                    icon={<Building size={48} />}
                    title="No institutes found"
                    description={`There are no ${activeTab.toLowerCase()} institutes at this time.`}
                  />
                </td>
              </tr>
            ) : (
              institutes.map((inst) => {
                const admin = inst.users?.[0];
                const sc = statusConfig[inst.status];
                return (
                  <tr
                    key={inst.id}
                    className="transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    {/* Institute */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: sc.bg }}
                        >
                          <Building2 className="w-5 h-5" style={{ color: sc.color }} />
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {inst.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--brand-500)' }}>
                            /{inst.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <p style={{ color: 'var(--text-primary)' }}>{inst.email || '—'}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {inst.phone || '—'}
                      </p>
                      {inst.address && (
                        <p className="text-xs mt-0.5 max-w-[180px] truncate" style={{ color: 'var(--text-muted)' }}>
                          {inst.address}
                        </p>
                      )}
                    </td>

                    {/* Admin */}
                    <td className="px-6 py-4">
                      {admin ? (
                        <div>
                          <p style={{ color: 'var(--text-primary)' }}>
                            {admin.firstName} {admin.lastName}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {admin.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-amber-500">No Admin</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {new Date(inst.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>

                    {/* Rejection reason column */}
                    {activeTab === 'REJECTED' && (
                      <td className="px-6 py-4 max-w-[200px]">
                        {inst.rejectionReason ? (
                          <span
                            className="text-xs px-2 py-1 rounded-lg inline-block max-w-full truncate"
                            title={inst.rejectionReason}
                            style={{
                              background: 'rgba(239,68,68,0.08)',
                              color: '#ef4444',
                            }}
                          >
                            {inst.rejectionReason}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    )}

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {activeTab === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => setActionModal({ type: 'approve', institute: inst })}
                              className="bg-emerald-500 text-white hover:bg-emerald-600 gap-1"
                            >
                              <CheckCircle size={14} /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => { setReason(''); setActionModal({ type: 'reject', institute: inst }); }}
                              className="text-red-500 hover:text-red-600 gap-1"
                            >
                              <XCircle size={14} /> Reject
                            </Button>
                          </>
                        )}

                        {activeTab === 'APPROVED' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setActionModal({ type: 'suspend', institute: inst })}
                            className="text-amber-500 gap-1"
                          >
                            <ShieldAlert size={14} /> Suspend
                          </Button>
                        )}

                        {activeTab === 'SUSPENDED' && (
                          <Button
                            size="sm"
                            onClick={() => setActionModal({ type: 'reactivate', institute: inst })}
                            className="bg-blue-500 text-white hover:bg-blue-600 gap-1"
                          >
                            <RotateCcw size={14} /> Reactivate
                          </Button>
                        )}

                        {(activeTab === 'REJECTED' || activeTab === 'SUSPENDED') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setActionModal({ type: 'delete', institute: inst })}
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 gap-1"
                          >
                            <Trash2 size={14} /> Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {/* ── Action Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => { setActionModal(null); setReason(''); }}
        title={modalConfig?.title}
        size="sm"
      >
        {actionModal && (
          <div className="space-y-4">
            {/* Institute name banner */}
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {modalConfig?.icon}
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {actionModal.institute.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  /{actionModal.institute.slug}
                </p>
              </div>
            </div>

            {/* Context message */}
            {actionModal.type === 'approve' && (
              <div className="flex gap-2 p-3 rounded-xl text-sm text-emerald-600 bg-emerald-500/10">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                The institute admin will be notified by email and can start using the platform immediately.
              </div>
            )}
            {actionModal.type === 'suspend' && (
              <div className="flex gap-2 p-3 rounded-xl text-sm text-amber-600 bg-amber-500/10">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                All users from this institute will lose access until the institute is reactivated.
              </div>
            )}
            {actionModal.type === 'delete' && (
              <div className="flex gap-2 p-3 rounded-xl text-sm text-red-600 bg-red-500/10">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>This is permanent.</strong> All courses, users, and data for this institute
                  will be deleted and cannot be recovered.
                </span>
              </div>
            )}
            {actionModal.type === 'reactivate' && (
              <div className="flex gap-2 p-3 rounded-xl text-sm text-blue-600 bg-blue-500/10">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                The institute and its users will regain full platform access.
              </div>
            )}

            {/* Reason textarea for reject */}
            {actionModal.type === 'reject' && (
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Rejection Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  className="input w-full resize-none text-sm"
                  placeholder="Explain why this institute is being rejected…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  This reason will be emailed to the institute admin.
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => { setActionModal(null); setReason(''); }}
                className="px-4 py-2 text-sm rounded-xl transition"
                style={{ color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isBusy}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white transition disabled:opacity-60"
                style={{
                  background:
                    actionModal.type === 'approve' || actionModal.type === 'reactivate'
                      ? '#10b981'
                      : '#ef4444',
                }}
              >
                {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                {actionModal.type === 'approve'    && 'Approve'}
                {actionModal.type === 'reject'     && 'Reject'}
                {actionModal.type === 'suspend'    && 'Suspend'}
                {actionModal.type === 'reactivate' && 'Reactivate'}
                {actionModal.type === 'delete'     && 'Delete Forever'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
