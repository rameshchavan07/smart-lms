import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, X, Users, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface PendingApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

const PendingApplications: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery<PendingApplication[]>({
    queryKey: ['pendingApplications'],
    queryFn: async () => {
      const res = await api.get('/applications/pending');
      return res.data.applications;
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/applications/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApplications'] });
      toast.success('Application approved successfully');
    },
    onError: () => toast.error('Failed to approve application')
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/applications/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApplications'] });
      toast.success('Application rejected');
    },
    onError: () => toast.error('Failed to reject application')
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Pending Student Applications</h1>
        <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Review and approve students trying to join your private institute.</p>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : applications.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-surface/5 flex items-center justify-center mb-4 text-muted">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-primary mb-1">No Pending Applications</h3>
            <p className="text-sm text-muted">You're all caught up! There are no students waiting to be approved.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-[12px] font-bold text-muted uppercase tracking-wider">Name</th>
                  <th className="pb-3 text-[12px] font-bold text-muted uppercase tracking-wider">Email</th>
                  <th className="pb-3 text-[12px] font-bold text-muted uppercase tracking-wider">Date Applied</th>
                  <th className="pb-3 text-[12px] font-bold text-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.map(app => (
                  <tr key={app.id} className="hover:bg-black/5 dark:hover:bg-surface/5 transition-colors">
                    <td className="py-4">
                      <div className="font-semibold text-[14px] text-primary">{app.firstName} {app.lastName}</div>
                    </td>
                    <td className="py-4 text-[14px] text-muted">{app.email}</td>
                    <td className="py-4 text-[14px] text-muted">{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 flex justify-end gap-2">
                      <button 
                        onClick={() => approveMutation.mutate(app.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="btn bg-green-500 hover:bg-green-600 text-white flex items-center gap-1 text-[13px] px-3 py-1.5 disabled:opacity-50"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button 
                        onClick={() => rejectMutation.mutate(app.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="btn bg-red-500 hover:bg-red-600 text-white flex items-center gap-1 text-[13px] px-3 py-1.5 disabled:opacity-50"
                      >
                        <X size={14} /> Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApplications;
