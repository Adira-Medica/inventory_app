// src/components/admin/UserManagement.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user',
    active: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchPendingUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/users');
      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        // If we get an empty response or non-array, use sample data
        setUsers(getSampleUsers());
        console.log('Using sample user data');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Use sample data as fallback
      setUsers(getSampleUsers());
      toast.warning('Could not fetch users from server, using sample data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    setPendingLoading(true);
    try {
      const response = await api.get('/admin/users/pending');
      if (response.data && Array.isArray(response.data)) {
        setPendingUsers(response.data);
      } else {
        setPendingUsers([]);
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
      setPendingUsers([]);
    } finally {
      setPendingLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/approve`);
      toast.success('User approved successfully');
      fetchPendingUsers(); // Refresh pending users
      fetchUsers(); // Refresh all users
    } catch (error) {
      toast.error('Failed to approve user');
      console.error(error);
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/reject`);
      toast.success('User registration rejected');
      fetchPendingUsers(); // Refresh pending users
    } catch (error) {
      toast.error('Failed to reject user');
      console.error(error);
    }
  };

  const getSampleUsers = () => {
    return [
      {
        id: 1,
        username: 'admin',
        role: { id: 1, name: 'admin' },
        active: true
      },
      {
        id: 2,
        username: 'manager1',
        role: { id: 2, name: 'manager' },
        active: true
      },
      {
        id: 3,
        username: 'user1',
        role: { id: 3, name: 'user' },
        active: true
      },
      {
        id: 4,
        username: 'inactiveuser',
        role: { id: 3, name: 'user' },
        active: false
      }
    ];
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      role: 'user',
      active: true
    });
    setIsEditing(false);
    setSelectedUser(null);
  };

  const handleAddNewClick = () => {
    resetForm();
    setShowAddForm(true);
  };

  const handleEditClick = (user) => {
    setFormData({
      username: user.username,
      password: '', // Don't set password when editing
      role: user.role.name,
      active: user.active
    });
    setSelectedUser(user);
    setIsEditing(true);
    setShowAddForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        // Update existing user
        await api.put(`/auth/users/${selectedUser.id}`, {
          username: formData.username,
          role: formData.role,
          active: formData.active,
          ...(formData.password ? { password: formData.password } : {})
        });
        toast.success('User updated successfully');
      } else {
        // Create new user
        await api.post('/auth/register', {
          username: formData.username,
          password: formData.password,
          role: formData.role
        });
        toast.success('User created successfully');
      }
      
      resetForm();
      setShowAddForm(false);
      fetchUsers(); // Refresh the user list
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save user');
      console.error(error);
    }
  };

  const toggleUserStatus = async (user) => {
    try {
      await api.put(`/auth/users/${user.id}/toggle-status`);
      toast.success(`User ${user.active ? 'deactivated' : 'activated'} successfully`);
      fetchUsers(); // Refresh the user list
    } catch (error) {
      toast.error('Failed to update user status');
      console.error(error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
        <button
          onClick={handleAddNewClick}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
        >
          Add New User
        </button>
      </div>

      {/* Pending Users Section */}
      {pendingUsers.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4 text-amber-700">Pending Approval Requests</h3>
          
          {pendingLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto bg-amber-50 rounded-lg p-4">
              <table className="min-w-full divide-y divide-amber-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">
                      Registration Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200">
                  {pendingUsers.map((user) => (
                    <tr key={`pending-${user.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {user.role.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(user.registration_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleApproveUser(user.id)}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="text-lg font-medium mb-4">
            {isEditing ? 'Edit User' : 'Add New User'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password {isEditing && "(leave blank to keep unchanged)"}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required={!isEditing}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="user">User</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            {isEditing && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 block text-sm text-gray-700">Active</label>
              </div>
            )}
            
            <div className="flex space-x-4">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isEditing ? 'Update User' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className={!user.active ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {user.role.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleUserStatus(user)}
                      className={`${
                        user.active 
                          ? 'text-red-600 hover:text-red-900' 
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {user.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;