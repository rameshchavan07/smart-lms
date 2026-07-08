import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Button, Card, EmptyState } from '../../components';
import { Building, Building2, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';

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

export default function InstitutesManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'>('PENDING');

  const { data: institutes, isLoading } = useQuery({
    queryKey: ['institutes', activeTab],
    queryFn: async () => {
      const res = await api.get(`/institutes?status=${activeTab}`);
      return res.data.institutes as Institute[];
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string, status: string, reason?: string }) => {
      let endpoint = '';
      if (status === 'APPROVED') endpoint = `/institutes/${id}/approve`;
      if (status === 'REJECTED') endpoint = `/institutes/${id}/reject`;
      if (status === 'SUSPENDED') endpoint = `/institutes/${id}/suspend`;
      if (status === 'REACTIVATE') endpoint = `/institutes/${id}/reactivate`;
      return api.patch(endpoint, { reason });
    },
    onSuccess: () => {
      toast.success('Institute status updated');
      queryClient.invalidateQueries({ queryKey: ['institutes'] });
    },
    onError: (err) => {
      const axiosError = err as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Failed to update status');
    }
  });

  const deleteInstituteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/institutes/${id}`),
    onSuccess: () => {
      toast.success('Institute deleted');
      queryClient.invalidateQueries({ queryKey: ['institutes'] });
    },
    onError: (err) => {
      const axiosError = err as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Failed to delete institute');
    }
  });

  const handleApprove = (id: string) => {
    if (window.confirm('Approve this institute? They will be notified.')) {
      updateStatusMutation.mutate({ id, status: 'APPROVED' });
    }
  };

  const handleReject = (id: string) => {
    const reason = window.prompt('Reason for rejection (optional):');
    if (reason !== null) {
      updateStatusMutation.mutate({ id, status: 'REJECTED', reason });
    }
  };

  const handleSuspend = (id: string) => {
    if (window.confirm('Suspend this institute? Their users will not be able to log in.')) {
      updateStatusMutation.mutate({ id, status: 'SUSPENDED' });
    }
  };

  const handleReactivate = (id: string) => {
    if (window.confirm('Reactivate this institute?')) {
      updateStatusMutation.mutate({ id, status: 'REACTIVATE' });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this institute forever? This action cannot be undone.')) {
      deleteInstituteMutation.mutate(id);
    }
  };

  const tabs = [
    { id: 'PENDING', label: 'Pending Requests' },
    { id: 'APPROVED', label: 'Active Institutes' },
    { id: 'SUSPENDED', label: 'Suspended' },
    { id: 'REJECTED', label: 'Rejected' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Building className="w-6 h-6 text-brand-500" />
            Institute Registration Requests
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Manage incoming registrations and control platform access.
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED')}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === tab.id 
                ? 'border-brand-500 text-brand-500' 
                : 'border-transparent text-muted hover:text-primary hover:border-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-surface border-b border-border text-muted font-medium">
            <tr>
              <th className="px-6 py-4">Institute / Slug</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Admin Name</th>
              <th className="px-6 py-4">Requested On</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center">Loading...</td></tr>
            ) : institutes?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8">
                  <EmptyState 
                    icon={<Building size={48} />}
                    title="No institutes found" 
                    description={`There are no ${activeTab.toLowerCase()} institutes at this time.`} 
                  />
                </td>
              </tr>
            ) : (
              institutes?.map((inst: Institute) => (
                <tr key={inst.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-primary">{inst.name}</p>
                        <p className="text-xs text-brand-500">/{inst.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-primary">{inst.email || 'N/A'}</p>
                    <p className="text-xs text-muted">{inst.phone || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    {inst.users && inst.users.length > 0 ? (
                      <div>
                        <p>{inst.users[0].firstName} {inst.users[0].lastName}</p>
                        <p className="text-xs text-muted">{inst.users[0].email}</p>
                      </div>
                    ) : (
                      <span className="text-amber-600 text-xs font-medium">No Admin</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted">
                    {new Date(inst.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {activeTab === 'PENDING' && (
                        <>
                          <Button size="sm" onClick={() => handleApprove(inst.id)} className="bg-emerald-500 text-white hover:bg-emerald-600 gap-1">
                            <CheckCircle size={14} /> Approve
                          </Button>
                          <Button size="sm" onClick={() => handleReject(inst.id)} variant="secondary" className="text-red-500 hover:text-red-600 gap-1">
                            <XCircle size={14} /> Reject
                          </Button>
                        </>
                      )}
                      
                      {activeTab === 'APPROVED' && (
                        <Button size="sm" onClick={() => handleSuspend(inst.id)} variant="secondary" className="text-amber-500 gap-1">
                          <ShieldAlert size={14} /> Suspend
                        </Button>
                      )}

                      {activeTab === 'SUSPENDED' && (
                        <Button size="sm" onClick={() => handleReactivate(inst.id)} className="bg-brand-500 text-white gap-1">
                          <CheckCircle size={14} /> Reactivate
                        </Button>
                      )}

                      {(activeTab === 'REJECTED' || activeTab === 'SUSPENDED') && (
                        <Button size="sm" onClick={() => handleDelete(inst.id)} variant="ghost" className="text-red-500 hover:bg-red-50">
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
