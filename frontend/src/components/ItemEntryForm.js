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
        <h2 className="text-2xl font-bold text-center">Add New Item</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">Item Number</label>
          <input
            type="text"
            name="item_number"
            value={formData.item_number}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-200"
            placeholder="Enter Item Number"
          />
        </div>
        {/* Repeat similar blocks for each input field */}
        <button
          type="submit"
          className="w-full py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-200"
        >
          Save Item
        </button>
      </form>
    </div>
  );
};

export default ItemEntryForm;
