import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { StatCard } from '../../components/StatCard';
import { Card } from '../../components';
import {
  Building2, Clock, CheckCircle2, ShieldOff, XCircle,
  Users, ChevronRight, CheckCircle, XCircle as XIcon, Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  total: number;
  pending: number;
  approved: number;
  suspended: number;
  rejected: number;
  totalUsers: number;
}

interface PendingInstitute {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  users: { id: string; firstName: string; lastName: string; email: string }[];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['superadmin-stats'],
    queryFn: async () => {
      const res = await api.get('/institutes/stats');
      return res.data as { stats: Stats; recentPending: PendingInstitute[] };
    },
    refetchInterval: 60_000, // refresh every 60 s
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/institutes/${id}/approve`),
    onSuccess: () => {
      toast.success('Institute approved!');
      queryClient.invalidateQueries({ queryKey: ['superadmin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['institutes'] });
    },
    onError: (err) => {
      const e = err as AxiosError<{ message?: string }>;
      toast.error(e.response?.data?.message || 'Failed to approve');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/institutes/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success('Institute rejected');
      queryClient.invalidateQueries({ queryKey: ['superadmin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['institutes'] });
    },
    onError: (err) => {
      const e = err as AxiosError<{ message?: string }>;
      toast.error(e.response?.data?.message || 'Failed to reject');
    },
  });

  const { stats, recentPending } = data ?? {};
  const isBusy = approveMutation.isPending || rejectMutation.isPending;

  const handleQuickReject = (id: string, name: string) => {
    const reason = window.prompt(`Reason for rejecting "${name}":`);
    if (reason === null) return; // cancelled
    if (!reason.trim()) { toast.error('Rejection reason is required'); return; }
    rejectMutation.mutate({ id, reason });
  };

  // ── KPI config
  const kpis = [
    {
      title: 'Total Institutes',
      value: stats?.total ?? 0,
      icon: Building2,
      color: '#4361f0',
      bg: 'rgba(67,97,240,0.12)',
      subtitle: 'All statuses',
      linkTo: '/super-admin/institutes',
      linkLabel: 'View all',
    },
    {
      title: 'Pending Approvals',
      value: stats?.pending ?? 0,
      icon: Clock,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      subtitle: 'Awaiting review',
      linkTo: '/super-admin/institutes',
      linkLabel: 'Review now',
    },
    {
      title: 'Active Institutes',
      value: stats?.approved ?? 0,
      icon: CheckCircle2,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
      subtitle: 'Currently live',
      linkTo: '/super-admin/institutes',
      linkLabel: 'View active',
    },
    {
      title: 'Suspended',
      value: stats?.suspended ?? 0,
      icon: ShieldOff,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
      subtitle: 'Access blocked',
    },
    {
      title: 'Rejected',
      value: stats?.rejected ?? 0,
      icon: XCircle,
      color: '#6b7280',
      bg: 'rgba(107,114,128,0.12)',
      subtitle: 'Registration denied',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.12)',
      subtitle: 'Across all institutes',
      linkTo: '/super-admin/users',
      linkLabel: 'View users',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Platform Overview
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Real-time snapshot of all institutes and users on OpenLearnX.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <StatCard key={k.title} {...k} loading={isLoading} />
        ))}
      </div>

      {/* Pending Approvals Widget */}
      <Card className="overflow-hidden">
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              Pending Approval Requests
            </h2>
            {(stats?.pending ?? 0) > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500">
                {stats?.pending}
              </span>
            )}
          </div>
          <Link
            to="/super-admin/institutes"
            className="flex items-center gap-1 text-xs font-semibold transition-colors"
            style={{ color: 'var(--brand-500)' }}
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="px-6 py-10 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : !recentPending?.length ? (
          <div className="px-6 py-10 text-center">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>All caught up!</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              No pending institute requests right now.
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {recentPending.map((inst) => {
              const admin = inst.users[0];
              const isProcessing =
                (approveMutation.isPending && approveMutation.variables === inst.id) ||
                (rejectMutation.isPending && rejectMutation.variables?.id === inst.id);

              return (
                <div
                  key={inst.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  {/* Institute info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(245,158,11,0.12)' }}
                    >
                      <Building2 className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {inst.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {admin
                          ? `${admin.firstName} ${admin.lastName} · ${admin.email}`
                          : inst.email || 'No admin yet'}
                      </p>
                    </div>
                  </div>

                  {/* Date + actions */}
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                      {new Date(inst.createdAt).toLocaleDateString()}
                    </span>

                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                    ) : (
                      <>
                        <button
                          onClick={() => approveMutation.mutate(inst.id)}
                          disabled={isBusy}
                          title="Approve"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleQuickReject(inst.id, inst.name)}
                          disabled={isBusy}
                          title="Reject"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition disabled:opacity-50"
                        >
                          <XIcon className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Quick-nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Institutes',
            desc: 'Manage registrations & statuses',
            to: '/super-admin/institutes',
            icon: Building2,
            color: '#4361f0',
            bg: 'rgba(67,97,240,0.08)',
          },
          {
            label: 'All Users',
            desc: 'Browse platform-wide users',
            to: '/super-admin/users',
            icon: Users,
            color: '#8b5cf6',
            bg: 'rgba(139,92,246,0.08)',
          },
          {
            label: 'Settings',
            desc: 'Platform-level configuration',
            to: '/super-admin/settings',
            icon: CheckCircle2,
            color: '#10b981',
            bg: 'rgba(16,185,129,0.08)',
          },
        ].map((nav) => (
          <Link
            key={nav.label}
            to={nav.to}
            className="card card-hover flex items-center gap-4 p-5 group"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: nav.bg }}
            >
              <nav.icon className="w-6 h-6" style={{ color: nav.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                {nav.label}
              </p>
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                {nav.desc}
              </p>
            </div>
            <ChevronRight
              className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition"
              style={{ color: nav.color }}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
