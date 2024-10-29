// src/components/ReceivingData.js
import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { toast } from 'react-toastify';

const ReceivingData = () => {
  const [receivingData, setReceivingData] = useState([]);
  const [formData, setFormData] = useState({
    item_number: '',
    receiving_no: '',
    tracking_number: '',
    lot_no: '',
    po_no: 'N/A',
    total_units_vendor: '',
    total_storage_containers: '',
    exp_date: 'N/A',
    ncmr: 'N/A',
    total_units_received: '',
    temp_device_in_alarm: 'N/A',
    ncmr2: 'N/A',
    temp_device_deactivated: 'N/A',
    temp_device_returned_to_courier: 'N/A',
    comments_for_520b: 'N/A'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchReceivingData = async () => {
    try {
      const response = await axios.get('/receiving/get');
      setReceivingData(response.data);
    } catch (error) {
      toast.error('Error fetching receiving data');
    }
  };

  useEffect(() => {
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
        await axios.put(`/receiving/update/${editId}`, formData);
        toast.success('Receiving data updated successfully!');
      } else {
        await axios.post('/receiving/create', formData);
        toast.success('Receiving data added successfully!');
      }
      setFormData({
        item_number: '',
        receiving_no: '',
        tracking_number: '',
        lot_no: '',
        po_no: 'N/A',
        total_units_vendor: '',
        total_storage_containers: '',
        exp_date: 'N/A',
        ncmr: 'N/A',
        total_units_received: '',
        temp_device_in_alarm: 'N/A',
        ncmr2: 'N/A',
        temp_device_deactivated: 'N/A',
        temp_device_returned_to_courier: 'N/A',
        comments_for_520b: 'N/A'
      });
      setIsEditing(false);
      setEditId(null);
      fetchReceivingData();
    } catch (error) {
      toast.error('Error saving receiving data');
    }
  };

  const handleEdit = (entry) => {
    setFormData(entry);
    setIsEditing(true);
    setEditId(entry.id);
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
      
      {/* Form */}
      <form onSubmit={handleAddOrUpdate} className="w-full max-w-lg p-8 space-y-4 bg-white shadow-md rounded mb-8">
        <h2 className="text-2xl font-bold text-center text-gray-800">{isEditing ? 'Edit Receiving Data' : 'Add New Receiving Data'}</h2>
        
        {/* Input fields here, similar to ItemEntryForm */}
        
        <button
          type="submit"
          className="w-full py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-500"
        >
          {isEditing ? 'Update Receiving Data' : 'Add Receiving Data'}
        </button>
      </form>
      
      {/* List */}
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
        <ul className="divide-y divide-gray-200">
          {receivingData.map((entry) => (
            <li key={entry.id} className="py-4 flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold text-gray-900">Receiving No: {entry.receiving_no}</p>
                <p className="text-gray-600">Tracking No: {entry.tracking_number}</p>
                <p className="text-gray-600">Lot No: {entry.lot_no}</p>
                {/* Other fields */}
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleEdit(entry)}
                  className="text-blue-500 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
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
