// src/components/UpdateItem.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { toast } from 'react-toastify';

const UpdateItem = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [itemData, setItemData] = useState({
    item_number: '',
    description: '',
    client: '',
    vendor: '',
  });

  useEffect(() => {
    axios.get(`/item/${itemId}`)
      .then(response => setItemData(response.data))
      .catch(error => {
        console.error("Error fetching item data:", error);
        toast.error("Failed to load item data");
      });
  }, [itemId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setItemData({ ...itemData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.put(`/item/update/${itemId}`, itemData)
      .then(() => {
        toast.success("Item updated successfully!");
        navigate('/items');
      })
      .catch(error => {
        console.error("Error updating item:", error);
        toast.error("Error updating item. Please try again.");
      });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="w-full max-w-lg p-8 bg-white shadow-md rounded-lg space-y-4">
        <h2 className="text-2xl font-bold text-center text-gray-800">Update Item</h2>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Item Number</label>
          <input
            type="text"
            name="item_number"
            value={itemData.item_number}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <input
            type="text"
            name="description"
            value={itemData.description}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        {/* Add more input fields as necessary */}

        <button
          type="submit"
          className="w-full py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-500"
        >
          Update Item
        </button>
      </form>
    </div>
  );
};

export default UpdateItem;
