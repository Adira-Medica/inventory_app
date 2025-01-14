// src/components/modals/EditModal.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';

const EditModal = ({ isOpen, onClose, data, type, onUpdate }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    // Remove unnecessary fields and prepare form data
    const { id, isVoid, type: dataType, ...rest } = data;
    setFormData(rest);
  }, [data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = type === 'items' ? `/item/update/${data.id}` : `/receiving/update/${data.id}`;
      await api.put(endpoint, formData);
      toast.success(`${type === 'items' ? 'Item' : 'Receiving data'} updated successfully`);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update data');
    }
  };

  const renderField = (key, value) => {
    // Fields to exclude from editing
    if (['id', 'isVoid', 'type', 'created_at', 'updated_at', 'created_by', 'updated_by'].includes(key)) {
      return null;
    }

    // Determine field type
    const isDateField = key === 'exp_date';
    const isNumberField = [
      'max_exposure_time', 
      'temper_time', 
      'working_exposure_time', 
      'total_units_vendor', 
      'total_units_received', 
      'total_storage_containers'
    ].includes(key);
    const isSelectField = ['controlled', 'randomized', 'sequential_numbers', 'ncmr', 'ncmr2'].includes(key);

    // Format label
    const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    return (
      <div key={key} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        {isSelectField ? (
          <select
            value={formData[key] || ''}
            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select {label}</option>
            {['Yes', 'No', 'N/A'].map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input
            type={isDateField ? 'date' : isNumberField ? 'number' : 'text'}
            value={formData[key] || ''}
            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Edit {type === 'items' ? 'Item' : 'Receiving Data'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(formData).map(([key, value]) => renderField(key, value))}
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;