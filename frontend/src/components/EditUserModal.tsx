import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X } from 'lucide-react';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit: any; // UserData with teacher/student info
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, onSuccess, userToEdit }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'STUDENT',
    employeeCode: '',
    specialization: '',
    qualification: '',
    enrollmentNumber: '',
    academicYear: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && userToEdit) {
      setFormData({
        firstName: userToEdit.firstName || '',
        lastName: userToEdit.lastName || '',
        email: userToEdit.email || '',
        role: userToEdit.role || 'STUDENT',
        employeeCode: userToEdit.teacher?.employeeCode || '',
        specialization: userToEdit.teacher?.specialization || '',
        qualification: userToEdit.teacher?.qualification || '',
        enrollmentNumber: userToEdit.student?.enrollmentNumber || '',
        academicYear: userToEdit.student?.academicYear || '',
      });
    }
  }, [isOpen, userToEdit]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.put(`/users/${userToEdit.id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        employeeCode: formData.employeeCode,
        specialization: formData.specialization,
        qualification: formData.qualification,
        enrollmentNumber: formData.enrollmentNumber,
        academicYear: formData.academicYear,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" onClick={onClose} aria-hidden="true"></div>
        
        <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
              <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                Edit User Details
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full border-slate-300 rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full border-slate-300 rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full border-slate-300 rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>

              {formData.role === 'TEACHER' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Employee Code</label>
                    <input type="text" name="employeeCode" required value={formData.employeeCode} onChange={handleChange} className="w-full border-slate-300 rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
                    <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} className="w-full border-slate-300 rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
              )}

              {formData.role === 'STUDENT' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Enrollment Number</label>
                    <input type="text" name="enrollmentNumber" required value={formData.enrollmentNumber} onChange={handleChange} className="w-full border-slate-300 rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Academic Year</label>
                    <input type="text" name="academicYear" value={formData.academicYear} onChange={handleChange} className="w-full border-slate-300 rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 bg-white hover:bg-slate-50 font-medium text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm transition-colors">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
