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
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchPendingUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add debug headers to all requests
  useEffect(() => {
    // Add request interceptor for debugging
    const interceptor = api.interceptors.request.use(config => {
      console.log(`Making ${config.method.toUpperCase()} request to: ${config.url}`);
      return config;
    }, error => {
      console.error('Request error:', error);
      return Promise.reject(error);
    });

    // Add response interceptor for debugging
    const responseInterceptor = api.interceptors.response.use(response => {
      console.log(`Response from ${response.config.url}:`, response.status);
      return response;
    }, error => {
      console.error(`Response error from ${error.config?.url}:`, error.response?.status, error.response?.data);
      return Promise.reject(error);
    });

    return () => {
      // Clean up interceptors
      api.interceptors.request.eject(interceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('Fetching all users...');
      const response = await api.get('/admin/users');
      console.log('Users response received:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        // Filter out any pending users from the main list
        const approvedUsers = response.data.filter(user => 
          !(user.status && user.status === 'pending')
        );
        console.log(`Found ${approvedUsers.length} approved users`);
        setUsers(approvedUsers);
      } else {
        console.warn('Response is not an array, using sample data');
        setUsers(getSampleUsers());
      }
    } catch (error) {
      console.error('Error fetching users:', error.response || error);
      toast.warning('Could not fetch users from server, using sample data');
      setUsers(getSampleUsers());
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    setPendingLoading(true);
    try {
      console.log('Fetching pending users...');
      const response = await api.get('/admin/users/pending');
      console.log('Pending users response received:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`Found ${response.data.length} pending users`);
        setPendingUsers(response.data);
      } else {
        console.warn('Pending users response is not an array');
        setPendingUsers([]);
      }
    } catch (error) {
      console.error('Error fetching pending users:', error.response || error);
      setPendingUsers([]);
    } finally {
      setPendingLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      console.log(`Approving user with ID: ${userId}`);
      const response = await api.put(`/admin/users/${userId}/approve`);
      console.log('Approve response:', response.data);
      
      toast.success('User approved successfully');
      fetchPendingUsers(); // Refresh pending users
      fetchUsers(); // Refresh all users after approval
    } catch (error) {
      console.error('Error approving user:', error.response || error);
      toast.error(`Failed to approve user: ${error.response?.data?.error || 'Unknown error'}`);
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      console.log(`Rejecting user with ID: ${userId}`);
      const response = await api.put(`/admin/users/${userId}/reject`);
      console.log('Reject response:', response.data);
      
      toast.success('User registration rejected');
      fetchPendingUsers(); // Refresh pending users list
    } catch (error) {
      console.error('Error rejecting user:', error.response || error);
      toast.error(`Failed to reject user: ${error.response?.data?.error || 'Unknown error'}`);
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
    setShowPassword(false);
  };

  const handleAddNewClick = () => {
    resetForm();
    setShowAddForm(true);
  };

  const handleEditClick = (user) => {
    console.log('Editing user:', user);
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
        console.log(`Updating user ${selectedUser.id} with:`, formData);
        const response = await api.put(`/admin/users/${selectedUser.id}`, {
          username: formData.username,
          role: formData.role,
          active: formData.active,
          ...(formData.password ? { password: formData.password } : {})
        });
        console.log('Update response:', response.data);
        toast.success('User updated successfully');
      } else {
        // Create new user with approved status since it's created by admin
        console.log('Creating new user with:', formData);
        const response = await api.post('/auth/register', {
          username: formData.username,
          password: formData.password,
          role: formData.role,
          status: 'approved' // Set as approved by default when created by admin
        });
        console.log('Create response:', response.data);
        toast.success('User created successfully');
      }
      
      resetForm();
      setShowAddForm(false);
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error saving user:', error.response || error);
      toast.error(error.response?.data?.error || 'Failed to save user');
    }
  };

  const toggleUserStatus = async (user) => {
    try {
      console.log(`Toggling status for user ${user.id} to ${!user.active}`);
      
      // Use the status update endpoint instead of toggle-status
      const response = await api.put(`/admin/users/${user.id}/status`, {
        is_active: !user.active
      });
      
      console.log('Toggle status response:', response.data);
      toast.success(`User ${user.active ? 'deactivated' : 'activated'} successfully`);
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error updating user status:', error.response || error);
      toast.error(`Failed to update user status: ${error.response?.data?.error || 'Unknown error'}`);
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
                        {user.registration_date ? new Date(user.registration_date).toLocaleDateString() : 'N/A'}
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
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required={!isEditing}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
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