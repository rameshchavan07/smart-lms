import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import CreateUserModal from '../../components/CreateUserModal';
import EditUserModal from '../../components/EditUserModal';
import { UserPlus, MoreVertical, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // If teacher, force fetch only students
      const roleToFetch = currentUser?.role === 'TEACHER' ? 'STUDENT' : filterRole;
      const { data } = await api.get(`/users${roleToFetch ? `?role=${roleToFetch}` : ''}`);
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterRole]);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/users/${id}/status`, { isActive: !currentStatus });
      fetchUsers();
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user profile? All course links, refresh tokens, and registrations will be deleted.')) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user', error);
        alert('Failed to delete user.');
      }
    }
  };

  const handleEditClick = (userToEdit: any) => {
    setSelectedUserForEdit(userToEdit);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">{currentUser?.role === 'TEACHER' ? 'My Students' : 'User Management'}</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {currentUser?.role === 'ADMIN' && (
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4">
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)}
              className="border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm px-3 py-2 border"
            >
              <option value="">All Roles</option>
              <option value="TEACHER">Teachers</option>
              <option value="STUDENT">Students</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No users found</h3>
            <p className="text-slate-500 mt-1">Try adjusting your filters or adding a new user.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">User</th>
                  <th className="px-6 py-4 text-left">Role</th>
                  <th className="px-6 py-4 text-left">Joined</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'TEACHER' ? 'bg-amber-100 text-amber-800' :
                        'bg-sky-100 text-sky-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => toggleStatus(user.id, user.isActive)}
                        className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors cursor-pointer ${
                          user.isActive ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {currentUser?.role === 'ADMIN' && (
                        <>
                          <button 
                            onClick={() => handleEditClick(user)} 
                            className="text-blue-500 hover:text-blue-700 transition-colors mr-3"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)} 
                            className="text-red-400 hover:text-red-600 transition-colors mr-3"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      <button className="text-slate-400 hover:text-blue-600 transition-colors">
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
          fetchUsers();
        }}
        userToEdit={selectedUserForEdit}
      />
    </div>
  );
};

export default UserManagement;
