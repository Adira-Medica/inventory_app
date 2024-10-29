// src/components/ReceivingData.js
import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const ReceivingData = () => {
  const [receivingData, setReceivingData] = useState([]);
  const [formData, setFormData] = useState({
    receiving_no: '',
    vendor: '',
    date_received: '',
    condition: '',
    comments: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReceivingData = async () => {
      try {
        const response = await axios.get('/receiving/get');
        setReceivingData(response.data);
      } catch (error) {
        toast.error('Error fetching receiving data');
      }
    };

    fetchReceivingData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // Update existing entry
        await axios.put(`/receiving/update/${editId}`, formData);
        toast.success('Receiving data updated successfully!');
      } else {
        // Create new entry
        await axios.post('/receiving/create', formData);
        toast.success('Receiving data added successfully!');
      }
      setFormData({ receiving_no: '', vendor: '', date_received: '', condition: '', comments: '' });
      setIsEditing(false);
      setEditId(null);
      fetchReceivingData();
    } catch (error) {
      toast.error('Error saving receiving data');
    }
  };

  const handleEdit = (receiving) => {
    setFormData(receiving);
    setIsEditing(true);
    setEditId(receiving.id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/receiving/delete/${id}`);
      toast.success('Receiving data deleted successfully!');
      fetchReceivingData();
    } catch (error) {
      toast.error('Error deleting receiving data');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Receiving Data</h1>

      {/* Receiving Data Form */}
      <form onSubmit={handleAddOrUpdate} className="w-full max-w-lg p-8 space-y-4 bg-white shadow-md rounded mb-8">
        <h2 className="text-2xl font-bold text-center text-gray-800">{isEditing ? 'Edit Receiving Data' : 'Add New Receiving Data'}</h2>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Receiving No.</label>
          <input
            type="text"
            name="receiving_no"
            value={formData.receiving_no}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter Receiving No."
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Vendor</label>
          <input
            type="text"
            name="vendor"
            value={formData.vendor}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter Vendor Name"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Date Received</label>
          <input
            type="date"
            name="date_received"
            value={formData.date_received}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Condition</label>
          <input
            type="text"
            name="condition"
            value={formData.condition}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter Condition"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Comments</label>
          <textarea
            name="comments"
            value={formData.comments}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter Comments"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-500"
        >
          {isEditing ? 'Update Receiving Data' : 'Add Receiving Data'}
        </button>
      </form>

      {/* Receiving Data List */}
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
        <ul className="divide-y divide-gray-200">
          {receivingData.map((receiving) => (
            <li key={receiving.id} className="py-4 flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold text-gray-900">Receiving No: {receiving.receiving_no}</p>
                <p className="text-gray-600">Vendor: {receiving.vendor}</p>
                <p className="text-gray-600">Date Received: {receiving.date_received}</p>
                <p className="text-gray-600">Condition: {receiving.condition}</p>
                <p className="text-gray-600">Comments: {receiving.comments}</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleEdit(receiving)}
                  className="text-blue-500 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(receiving.id)}
                  className="text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ReceivingData;
