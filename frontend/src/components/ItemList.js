// src/components/ItemList.js
import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { toast } from 'react-toastify';

const ItemList = () => {
  const [items, setItems] = useState([]);
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
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchItems = async () => {
    try {
      const response = await axios.get('/item/get');
      setItems(response.data);
    } catch (error) {
      toast.error('Error fetching items');
    }
  };

  useEffect(() => {
    fetchItems();
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
        await axios.put(`/item/update/${editId}`, formData);
        toast.success('Item updated successfully!');
      } else {
        // Create new entry
        await axios.post('/item/create', formData);
        toast.success('Item added successfully!');
      }
      setFormData({
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
      setIsEditing(false);
      setEditId(null);
      fetchItems();
    } catch (error) {
      toast.error('Error saving item data');
    }
  };

  const handleEdit = (item) => {
    setFormData(item);
    setIsEditing(true);
    setEditId(item.id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/item/delete/${id}`);
      toast.success('Item deleted successfully!');
      fetchItems();
    } catch (error) {
      toast.error('Error deleting item');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Item List</h1>

      {/* Item Entry Form */}
      <form onSubmit={handleAddOrUpdate} className="w-full max-w-lg p-8 space-y-4 bg-white shadow-md rounded mb-8">
        <h2 className="text-2xl font-bold text-center text-gray-800">{isEditing ? 'Edit Item' : 'Add New Item'}</h2>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Item Number</label>
          <input
            type="text"
            name="item_number"
            value={formData.item_number}
            onChange={handleInputChange}
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
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter Description"
            required
          />
        </div>

        {/* Add more input fields for each property in formData */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Client</label>
          <input
            type="text"
            name="client"
            value={formData.client}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter Client Name"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-500"
        >
          {isEditing ? 'Update Item' : 'Add Item'}
        </button>
      </form>

      {/* Item List */}
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
        <ul className="divide-y divide-gray-200">
          {items.map((item) => (
            <li key={item.id} className="py-4 flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold text-gray-900">Item Number: {item.item_number}</p>
                <p className="text-gray-600">Description: {item.description}</p>
                <p className="text-gray-600">Client: {item.client}</p>
                {/* Display more fields as necessary */}
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleEdit(item)}
                  className="text-blue-500 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
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

export default ItemList;
