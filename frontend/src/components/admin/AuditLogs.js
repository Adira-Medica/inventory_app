// src/components/admin/AuditLogs.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    username: '',
    action: ''
  });

  const actionTypes = ['All', 'Login', 'Logout', 'Create', 'Update', 'Delete', 'View', 'Generate Form', 'Obsolete'];

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // src/components/admin/AuditLogs.js - update the fetchLogs function

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Apply any current filters to the request
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.username) queryParams.append('username', filters.username);
      if (filters.action) queryParams.append('action', filters.action);
      
      const url = `/admin/audit-logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`Fetched ${response.data.length} audit logs`);
        setLogs(response.data);
      } else {
        console.warn('Received invalid data format:', response.data);
        setLogs(getSampleAuditLogs());
        toast.warning('Invalid log data format, using sample data');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs(getSampleAuditLogs());
      toast.warning('Could not fetch audit logs from server, using sample data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    // In a real implementation, this would trigger a new API call with filters
    toast.info('Filters applied');
    console.log('Applied filters:', filters);
    fetchLogs();
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      username: '',
      action: ''
    });
    fetchLogs();
  };

  // Sample data for demonstration purposes
  const getSampleAuditLogs = () => {
    return [
      { 
        id: 1, 
        timestamp: '2025-02-20T08:32:15', 
        username: 'admin', 
        action: 'Login', 
        details: 'User logged in successfully', 
        ipAddress: '192.168.1.1' 
      },
      { 
        id: 2, 
        timestamp: '2025-02-20T09:15:22', 
        username: 'manager1', 
        action: 'Create', 
        details: 'Created new item: D200005', 
        ipAddress: '192.168.1.2' 
      },
      { 
        id: 3, 
        timestamp: '2025-02-20T10:45:33', 
        username: 'user1', 
        action: 'Generate Form', 
        details: 'Generated 520B form for item D200001', 
        ipAddress: '192.168.1.3' 
      },
      { 
        id: 4, 
        timestamp: '2025-02-20T11:22:45', 
        username: 'manager1', 
        action: 'Update', 
        details: 'Updated item: D200003', 
        ipAddress: '192.168.1.2' 
      },
      { 
        id: 5, 
        timestamp: '2025-02-20T13:10:05', 
        username: 'admin', 
        action: 'Delete', 
        details: 'Deleted receiving data: L102522001', 
        ipAddress: '192.168.1.1' 
      },
      { 
        id: 6, 
        timestamp: '2025-02-20T14:25:18', 
        username: 'user1', 
        action: 'Logout', 
        details: 'User logged out', 
        ipAddress: '192.168.1.3' 
      },
      { 
        id: 7, 
        timestamp: '2025-02-20T15:30:22', 
        username: 'admin', 
        action: 'Update', 
        details: 'Updated user role: manager1 to admin', 
        ipAddress: '192.168.1.1' 
      }
    ];
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Audit Logs</h2>
      
      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <h3 className="text-lg font-medium mb-4">Filter Logs</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              name="username"
              value={filters.username}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Filter by username"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Action Type</label>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {actionTypes.map(action => (
                <option key={action} value={action === 'All' ? '' : action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end space-x-4">
          <button
            onClick={resetFilters}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset Filters
          </button>
          <button
            onClick={applyFilters}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Apply Filters
          </button>
        </div>
      </div>
      
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
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      log.action === 'Create' ? 'bg-green-100 text-green-800' :
                      log.action === 'Update' ? 'bg-blue-100 text-blue-800' :
                      log.action === 'Delete' ? 'bg-red-100 text-red-800' :
                      log.action === 'Login' || log.action === 'Logout' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.details}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ipAddress}
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

export default AuditLogs;