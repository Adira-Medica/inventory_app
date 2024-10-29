// src/components/ItemEntryForm.js
import React, { useState } from 'react';
import axios from '../api/axios';
import { toast } from 'react-toastify';

const ItemEntryForm = () => {
  const [formData, setFormData] = useState({
    item_number: '',
    description: '',
    client: '',
    protocol_number: '',
    vendor: '',
    uom: '',
    controlled: '',
    temp_storage_conditions: '',
    max_exposure_time: '',
    temper_time: '',
    working_exposure_time: '',
    vendor_code_rev: '',
    randomized: '',
    sequential_numbers: '',
    study_type: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/item/create', formData);
      toast.success('Item created successfully!');
    } catch (error) {
      toast.error('Error creating item. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg p-8 space-y-4 bg-white shadow-md rounded"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Add New Item</h2>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Item Number</label>
          <input
            type="text"
            name="item_number"
            value={formData.item_number}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter Item Number"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter Description"
            required
          />
        </div>

        {/* Add more input fields for each property in formData */}
        
        <button
          type="submit"
          className="w-full py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-500"
        >
          Save Item
        </button>
      </form>
    </div>
  );
};

export default ItemEntryForm;
