import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import toast from 'react-hot-toast';
import { Button, EmptyState, Card } from '../../components';
import { Plus, Trash2, Shield, Building, Building2, Loader2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

interface Institute {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  users: User[];
  _count: { users: number; courses: number; };
  createdAt: string;
}

export default function InstitutesManagement() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignAdminModalOpen, setIsAssignAdminModalOpen] = useState(false);
  const [selectedInstituteId, setSelectedInstituteId] = useState<string | null>(null);
  
  const [assignMode, setAssignMode] = useState<'new' | 'existing'>('new');
  const [existingUserId, setExistingUserId] = useState('');

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['allUsersForAdmin'],
    queryFn: async () => {
      const res = await api.get(`${API_ENDPOINTS.USERS.BASE}?limit=1000`);
      return res.data.users as User[];
    },
    enabled: isAssignAdminModalOpen && assignMode === 'existing'
  });

  const assignExistingAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.put(API_ENDPOINTS.USERS.BY_ID(userId), { role: 'ADMIN', instituteId: selectedInstituteId });
    },
    onSuccess: () => {
      toast.success('Admin assigned successfully!');
      setIsAssignAdminModalOpen(false);
      setExistingUserId('');
      queryClient.invalidateQueries({ queryKey: ['institutes'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to assign admin');
    }
  });

  const handleAssignExistingAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstituteId || !existingUserId) return;
    assignExistingAdminMutation.mutate(existingUserId);
  };

  const [instituteForm, setInstituteForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: ''
  });

  const [adminForm, setAdminForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: ''
  });

  const { data: institutes, isLoading } = useQuery({
    queryKey: ['institutes'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.INSTITUTES.BASE);
      return res.data.institutes as Institute[];
    }
  });

  const createInstituteMutation = useMutation({
    mutationFn: (newInstitute: Record<string, unknown>) => api.post(API_ENDPOINTS.INSTITUTES.BASE, newInstitute),
    onSuccess: () => {
      toast.success('Institute created successfully');
      setIsCreateModalOpen(false);
      setInstituteForm({ name: '', address: '', phone: '', email: '', website: '' });
      queryClient.invalidateQueries({ queryKey: ['institutes'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create institute');
    }
  });

  const deleteInstituteMutation = useMutation({
    mutationFn: (id: string) => api.delete(API_ENDPOINTS.INSTITUTES.BY_ID(id)),
    onSuccess: () => {
      toast.success('Institute deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['institutes'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete institute');
    }
  });

  const assignAdminMutation = useMutation({
    mutationFn: (adminData: Record<string, unknown>) => api.post(API_ENDPOINTS.USERS.ADMIN, adminData),
    onSuccess: () => {
      toast.success('Admin assigned successfully');
      setIsAssignAdminModalOpen(false);
      setAdminForm({ firstName: '', lastName: '', email: '', password: '', phoneNumber: '' });
      queryClient.invalidateQueries({ queryKey: ['institutes'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to assign admin');
    }
  });


  if (isLoading) return <div>Loading institutes...</div>;

  const handleCreateInstitute = (e: React.FormEvent) => {
    e.preventDefault();
    createInstituteMutation.mutate(instituteForm);
  };

  const handleAssignAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstituteId) return;
    assignAdminMutation.mutate({ ...adminForm, instituteId: selectedInstituteId });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Building className="w-6 h-6 text-brand-500" />
            Institutes
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Manage platform institutes and their administrative access. {institutes?.length || 0} total active.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add Institute
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-surface border-b border-border text-muted font-medium">
            <tr>
              <th className="px-6 py-4">Institute</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Admin</th>
              <th className="px-6 py-4">Stats</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {institutes?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8">
                  <EmptyState 
                    icon={<Building size={48} />}
                    title="No institutes found" 
                    description="Get started by adding your first institute" 
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
                        <Link to={`/admin/institutes/${inst.id}`} className="font-semibold text-primary hover:text-brand-600 transition-colors">
                          {inst.name}
                        </Link>
                        <p className="text-xs text-muted max-w-[200px] truncate" title={inst.address}>{inst.address || 'No address'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-primary">{inst.email || 'N/A'}</p>
                    <p className="text-xs text-muted">{inst.phone || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    {inst.users && inst.users.length > 0 ? (
                      <div className="flex -space-x-2">
                        {inst.users.map((u) => (
                          <div key={u.id} className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold border-2 border-white dark:border-gray-800" title={`${u.firstName} ${u.lastName} (${u.email})`}>
                            {u.firstName[0]}{u.lastName[0]}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-amber-600 text-xs font-medium bg-amber-50 px-2 py-1 rounded-md">No Admin</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <p><span className="font-medium text-primary">{inst._count?.users || 0}</span> Users</p>
                    <p><span className="font-medium text-primary">{inst._count?.courses || 0}</span> Courses</p>
                  </td>
                  <td className="px-6 py-4 text-muted">
                    {new Date(inst.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/admin/institutes/${inst.id}`}
                        className="btn btn-ghost btn-sm gap-2 text-primary hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedInstituteId(inst.id);
                          setIsAssignAdminModalOpen(true);
                        }}
                        className="gap-2"
                      >
                        <Shield className="w-4 h-4 text-emerald-600" />
                        Assign Admin
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this institute?')) {
                            deleteInstituteMutation.mutate(inst.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Create Institute Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Add New Institute</h2>
            <form onSubmit={handleCreateInstitute} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-muted">Institute Name *</label>
                <input required type="text" className="input" value={instituteForm.name} onChange={e => setInstituteForm({...instituteForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted">Email Address</label>
                <input type="email" className="input" value={instituteForm.email} onChange={e => setInstituteForm({...instituteForm, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted">Phone Number</label>
                <input type="text" className="input" value={instituteForm.phone} onChange={e => setInstituteForm({...instituteForm, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted">Address</label>
                <textarea className="input" rows={2} value={instituteForm.address} onChange={e => setInstituteForm({...instituteForm, address: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-muted">Website</label>
                <input type="url" className="input" placeholder="https://" value={instituteForm.website} onChange={e => setInstituteForm({...instituteForm, website: e.target.value})} />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="btn-primary" disabled={createInstituteMutation.isPending}>
                  {createInstituteMutation.isPending ? 'Creating...' : 'Create Institute'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Assign Admin Modal */}
      {isAssignAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Assign Institute Admin</h2>
            <p className="text-sm text-muted mb-6">Assign an administrator to manage this institute's courses and users.</p>
            
            <div className="flex gap-2 mb-6 p-1 bg-black/5 dark:bg-white/5 rounded-lg">
              <button
                type="button"
                onClick={() => setAssignMode('new')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${assignMode === 'new' ? 'bg-white dark:bg-slate-800 shadow text-primary' : 'text-muted hover:text-primary'}`}
              >
                Create New
              </button>
              <button
                type="button"
                onClick={() => setAssignMode('existing')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${assignMode === 'existing' ? 'bg-white dark:bg-slate-800 shadow text-primary' : 'text-muted hover:text-primary'}`}
              >
                Select Existing
              </button>
            </div>

            {assignMode === 'new' ? (
              <form onSubmit={handleAssignAdmin} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted">First Name *</label>
                    <input required type="text" className="input" value={adminForm.firstName} onChange={e => setAdminForm({...adminForm, firstName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted">Last Name *</label>
                    <input required type="text" className="input" value={adminForm.lastName} onChange={e => setAdminForm({...adminForm, lastName: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted">Email Address *</label>
                  <input required type="email" className="input" value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted">Password *</label>
                  <input required type="password" minLength={6} className="input" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted">Phone Number</label>
                  <input type="text" className="input" value={adminForm.phoneNumber} onChange={e => setAdminForm({...adminForm, phoneNumber: e.target.value})} />
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="secondary" type="button" onClick={() => setIsAssignAdminModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="btn-primary" disabled={assignAdminMutation.isPending}>
                    {assignAdminMutation.isPending ? 'Assigning...' : 'Assign Admin'}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAssignExistingAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted">Select User *</label>
                  {loadingUsers ? (
                    <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-brand-500" /></div>
                  ) : (
                    <select 
                      required 
                      className="input" 
                      value={existingUserId} 
                      onChange={e => setExistingUserId(e.target.value)}
                    >
                      <option value="">-- Choose a user --</option>
                      {usersData?.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.firstName} {u.lastName} ({u.email}) - {u.role}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="secondary" type="button" onClick={() => setIsAssignAdminModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="btn-primary" disabled={assignExistingAdminMutation.isPending || !existingUserId}>
                    {assignExistingAdminMutation.isPending ? 'Assigning...' : 'Assign Admin'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
