import React from 'react';
import { useNavigate } from 'react-router-dom';

const DataSelectionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Data Management</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => navigate('/edit-data')}
            className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl cursor-pointer"
          >
            <h2 className="text-xl font-bold mb-4">Edit/Delete Data</h2>
            <p className="text-gray-600">Modify existing inventory items and receiving data</p>
          </div>
          <div 
            onClick={() => navigate('/')}
            className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl cursor-pointer"
          >
            <h2 className="text-xl font-bold mb-4">Back to Dashboard</h2>
            <p className="text-gray-600">Return to main menu</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSelectionPage;
