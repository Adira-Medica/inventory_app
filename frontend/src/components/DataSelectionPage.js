// src/components/DataSelectionPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const DataSelectionPage = ({ dataType }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Manage {dataType} Data</h1>
      <button
        onClick={() => navigate(`/add-${dataType.toLowerCase()}`)}
        className="w-64 py-3 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none"
      >
        Add Data
      </button>
      <button
        onClick={() => navigate(`/edit-${dataType.toLowerCase()}`)}
        className="w-64 py-3 bg-green-500 text-white font-medium rounded-md hover:bg-green-600 focus:outline-none"
      >
        Edit/Delete Data
      </button>
    </div>
  );
};

export default DataSelectionPage;
