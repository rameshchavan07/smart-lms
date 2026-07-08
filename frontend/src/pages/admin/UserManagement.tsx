import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import CreateUserModal from '../../components/CreateUserModal';
import EditUserModal from '../../components/EditUserModal';
import { UserPlus, MoreVertical, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge, Button, EmptyState, Modal, ConfirmDialog } from '../../components';
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  TEACHER: 2,
  STUDENT: 1
};

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterRole, setFilterRole] = useState(currentUser?.role === 'TEACHER' ? 'STUDENT' : '');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserData | null>(null);
  
  // Custom Confirmation Dialog States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState<string | null>(null);

  const { data: users = [], isLoading: loading } = useQuery<UserData[]>({
    queryKey: ['users', filterRole],
    queryFn: async () => {
      const roleToFetch = currentUser?.role === 'TEACHER' ? 'STUDENT' : filterRole;
      const { data } = await api.get(`${API_ENDPOINTS.USERS.BASE}?limit=1000${roleToFetch ? `&role=${roleToFetch}` : ''}`);
      return data.users;
    }
  });

  const { searchQuery = '' } = useOutletContext<{ searchQuery?: string }>() || {};

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(lowerQuery) ||
      user.lastName.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery)
    );
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      return api.patch(API_ENDPOINTS.USERS.STATUS(id), { isActive });
    },
    onSuccess: (_, variables) => {
      toast.success(`User status updated to ${variables.isActive ? 'Active' : 'Inactive'}`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: unknown) => {
      console.error('Failed to update status', error);
      toast.error('Failed to update user status.');
    }
  });

  const toggleStatus = (id: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ id, isActive: !currentStatus });
  };

  const confirmDeleteUser = (id: string) => {
    setUserIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(API_ENDPOINTS.USERS.BY_ID(id));
    },
    onSuccess: () => {
      toast.success('User profile deleted successfully.');
      setIsConfirmOpen(false);
      setUserIdToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: unknown) => {
      console.error('Failed to delete user', error);
      toast.error('Failed to delete user profile.');
    }
  });

  const handleDeleteUserExecute = () => {
    if (!userIdToDelete) return;
    deleteUserMutation.mutate(userIdToDelete);
  };

  const handleEditClick = (userToEdit: UserData) => {
    setSelectedUserForEdit(userToEdit);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-extrabold text-primary">
          {currentUser?.role === 'TEACHER' ? 'My Students' : 'User Management'}
        </h1>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </Button>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-slate-205 dark:border-slate-700 overflow-hidden transition-colors">
        {currentUser?.role === 'ADMIN' && (
          <div className="p-4 border-b border-border bg-bg-subtle/50 dark:bg-slate-800/40 flex gap-4">
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)}
              className="border-border-strong dark:border-slate-705 rounded-xl text-sm focus:ring-primary-500/20 focus:border-primary-500 bg-surface shadow-sm px-3 py-2 border transition-all text-slate-750 dark:text-slate-200"
            >
              <option value="">All Roles</option>
              <option value="TEACHER">Teachers</option>
              <option value="STUDENT">Students</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        )}

        {loading ? (
          <div className="p-6 space-y-4">
            <div className="skeleton h-10 w-full rounded-xl" />
            <div className="skeleton h-10 w-full rounded-xl" />
            <div className="skeleton h-10 w-full rounded-xl" />
            <div className="skeleton h-10 w-full rounded-xl" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<ShieldAlert className="w-8 h-8 text-primary-500" />}
              title="No users found"
              description="Try adjusting your filters or add a new user to populate the list."
              actionLabel="Add New User"
              onAction={() => setIsModalOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-bg-subtle/50 dark:bg-slate-800/40 text-muted text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">User</th>
                  <th className="px-6 py-4 text-left">Role</th>
                  <th className="px-6 py-4 text-left">Joined</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-slate-200 dark:divide-slate-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-bg-subtle/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-primary-100 dark:bg-primary-955/40 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-bold text-sm shadow-xs">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div className="ml-4 text-left">
                          <div className="text-sm font-semibold text-primary">{user.firstName} {user.lastName}</div>
                          <div className="text-xs text-muted">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={user.role === 'ADMIN' ? 'danger' : user.role === 'TEACHER' ? 'warning' : 'info'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(currentUser?.role === 'SUPER_ADMIN' || (ROLE_HIERARCHY[currentUser?.role || 'STUDENT'] > ROLE_HIERARCHY[user.role])) ? (
                        <button 
                          onClick={() => toggleStatus(user.id, user.isActive)}
                          className="cursor-pointer"
                        >
                          <Badge variant={user.isActive ? 'success' : 'neutral'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      ) : (
                        <Badge variant={user.isActive ? 'success' : 'neutral'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {(currentUser?.role === 'SUPER_ADMIN' || (ROLE_HIERARCHY[currentUser?.role || 'STUDENT'] > ROLE_HIERARCHY[user.role])) && (
                        <>
                          <Button 
                            variant="ghost"
                            onClick={() => handleEditClick(user)} 
                            className="text-xs py-1.5 px-3"
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost"
                            onClick={() => confirmDeleteUser(user.id)} 
                            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 py-1.5 px-3"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                      <button className="text-muted hover:text-primary-500 transition-colors">
                        <MoreVertical className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateUserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          toast.success('New user profile created.');
          queryClient.invalidateQueries({ queryKey: ['users'] });
        }}
      />

      <EditUserModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUserForEdit(null);
        }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setSelectedUserForEdit(null);
          toast.success('User profile updated successfully.');
          queryClient.invalidateQueries({ queryKey: ['users'] });
        }}
        userToEdit={selectedUserForEdit}
      />

      {/* Custom Confirmation Modal */}
      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Delete User Profile">
        <ConfirmDialog
          title="Confirm User Deletion"
          message="Are you sure you want to delete this user profile? All course links, refresh tokens, and registrations will be deleted."
          onConfirm={handleDeleteUserExecute}
          onCancel={() => setIsConfirmOpen(false)}
          loading={deleteUserMutation.isPending}
          danger
        />
      </Modal>
    </div>
  );
};

export default UserManagement;
