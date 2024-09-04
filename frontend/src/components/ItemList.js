// src/components/ItemList.js
import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { toast } from 'react-toastify';

const ItemList = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get('/item/get');
        setItems(response.data);
      } catch (error) {
        toast.error('Error fetching items');
      }
    };

    fetchItems();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Item List</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <ul className="divide-y divide-gray-200">
          {items.map((item) => (
            <li key={item.id} className="py-4 flex justify-between items-center">
              <div>
                <p className="text-xl font-semibold">{item.item_number}</p>
                <p className="text-gray-600">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ItemList;
