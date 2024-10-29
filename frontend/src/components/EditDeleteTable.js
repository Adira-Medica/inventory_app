// src/components/EditDeleteTable.js
import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { toast } from 'react-toastify';

const EditDeleteTable = ({ dataType, fields }) => {
  const [data, setData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`/api/${dataType.toLowerCase()}/get`);
      setData(response.data);
    } catch (error) {
      toast.error(`Error fetching ${dataType} data.`);
    }
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
  };

  const handleDeleteToggle = () => {
    const confirmed = window.confirm(`Are you sure you want to delete the selected ${dataType} entries?`);
    if (confirmed) {
      deleteSelectedData();
    }
  };

  const deleteSelectedData = async () => {
    try {
      await Promise.all(selectedIds.map((id) => axios.delete(`/api/${dataType.toLowerCase()}/delete/${id}`)));
      toast.success(`${dataType} entries deleted successfully!`);
      fetchData();
    } catch (error) {
      toast.error(`Error deleting ${dataType} entries.`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Edit/Delete {dataType} Data</h1>
      <div className="flex justify-between w-full max-w-2xl mb-4">
        <button onClick={handleEditToggle} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
          {isEditMode ? 'Save Changes' : 'Edit Data'}
        </button>
        <button
          onClick={handleDeleteToggle}
          disabled={selectedIds.length === 0}
          className={`bg-red-500 text-white py-2 px-4 rounded ${selectedIds.length ? 'hover:bg-red-600' : 'opacity-50 cursor-not-allowed'}`}
        >
          Delete Selected
        </button>
      </div>
      <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-4">
              <input
                type="checkbox"
                onChange={(e) => setSelectedIds(e.target.checked ? data.map((d) => d.id) : [])}
              />
            </th>
            {fields.map((field) => (
              <th key={field.name} className="p-4 text-left text-sm font-semibold text-gray-700">
                {field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td className="p-4">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(row.id)}
                  onChange={() => {
                    setSelectedIds((prev) =>
                      prev.includes(row.id) ? prev.filter((id) => id !== row.id) : [...prev, row.id]
                    );
                  }}
                />
              </td>
              {fields.map((field) => (
                <td key={field.name} className="p-4 text-sm">
                  {isEditMode ? (
                    <input
                      type="text"
                      value={row[field.name]}
                      onChange={(e) => setData(data.map((item) => (item.id === row.id ? { ...item, [field.name]: e.target.value } : item)))}
                      className="w-full px-2 py-1 border rounded"
                    />
                  ) : (
                    row[field.name]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EditDeleteTable;
