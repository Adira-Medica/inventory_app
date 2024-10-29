// src/components/AddDataForm.js
import React, { useState } from 'react';
import axios from '../api/axios';
import { toast } from 'react-toastify';

const AddDataForm = ({ dataType, fields, dropdownOptions }) => {
  const [formData, setFormData] = useState({});
  const [dropdowns, setDropdowns] = useState(dropdownOptions);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddNewOption = (field) => {
    const newOption = prompt(`Enter new ${field} option:`);
    if (newOption) {
      setDropdowns((prev) => ({
        ...prev,
        [field]: [...prev[field], newOption],
      }));
      setFormData({ ...formData, [field]: newOption });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/${dataType.toLowerCase()}/create`, formData);
      toast.success(`${dataType} data added successfully!`);
      setFormData({});
    } catch (error) {
      toast.error('Error adding data.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-lg space-y-4 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Add {dataType} Data</h2>
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{field.label}</label>
            {dropdowns[field.name] ? (
              <div className="flex space-x-2">
                <select
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {dropdowns[field.name].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleAddNewOption(field.name)}
                  className="text-blue-500 underline"
                >
                  Add New
                </button>
              </div>
            ) : (
              <input
                type="text"
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder={`Enter ${field.label}`}
              />
            )}
          </div>
        ))}
        <button type="submit" className="w-full py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
          Save Data
        </button>
      </form>
    </div>
  );
};

export default AddDataForm;
