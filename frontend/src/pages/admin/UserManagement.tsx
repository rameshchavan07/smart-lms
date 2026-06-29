import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import CreateUserModal from '../../components/CreateUserModal';
import EditUserModal from '../../components/EditUserModal';
import { UserPlus, MoreVertical, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge, Button, EmptyState, Modal, ConfirmDialog } from '../../components';
import toast from 'react-hot-toast';

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterRole, setFilterRole] = useState(currentUser?.role === 'TEACHER' ? 'STUDENT' : '');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserData | null>(null);
  
  // Custom Confirmation Dialog States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const roleToFetch = currentUser?.role === 'TEACHER' ? 'STUDENT' : filterRole;
      const { data } = await api.get(`/users${roleToFetch ? `?role=${roleToFetch}` : ''}`);
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users', error);
      toast.error('Failed to load users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole]);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/users/${id}/status`, { isActive: !currentStatus });
      toast.success(`User status updated to ${!currentStatus ? 'Active' : 'Inactive'}`);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update status', error);
      toast.error('Failed to update user status.');
    }
  };

  const confirmDeleteUser = (id: string) => {
    setUserIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleDeleteUserExecute = async () => {
    if (!userIdToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${userIdToDelete}`);
      toast.success('User profile deleted successfully.');
      setIsConfirmOpen(false);
      setUserIdToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user', error);
      toast.error('Failed to delete user profile.');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditClick = (userToEdit: UserData) => {
    setSelectedUserForEdit(userToEdit);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
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
          <div className="p-4 border-b border-border bg-slate-50/50 dark:bg-slate-800/40 flex gap-4">
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)}
              className="border-slate-300 dark:border-slate-705 rounded-xl text-sm focus:ring-primary-500/20 focus:border-primary-500 bg-surface shadow-sm px-3 py-2 border transition-all text-slate-750 dark:text-slate-200"
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
        ) : users.length === 0 ? (
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
              <thead className="bg-slate-50/50 dark:bg-slate-800/40 text-muted text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">User</th>
                  <th className="px-6 py-4 text-left">Role</th>
                  <th className="px-6 py-4 text-left">Joined</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-slate-200 dark:divide-slate-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-primary-100 dark:bg-primary-955/40 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-bold text-sm shadow-xs">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div className="ml-4 text-left">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.firstName} {user.lastName}</div>
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
                      <button 
                        onClick={() => toggleStatus(user.id, user.isActive)}
                        className="cursor-pointer"
                      >
                        <Badge variant={user.isActive ? 'success' : 'neutral'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {currentUser?.role === 'ADMIN' && (
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
                      <button className="text-slate-400 hover:text-primary-500 transition-colors">
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
          fetchUsers();
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
          fetchUsers();
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
          loading={deleting}
          danger
        />
      </Modal>
    </div>
  );
};

export default UserManagement;
