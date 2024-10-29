// src/components/LandingPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../api/axios';

const LandingPage = ({ userRole }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  // Toggle dropdown menu
  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout');
      toast.success('Logged out successfully!');
      navigate('/login'); // Redirect to login page
    } catch (error) {
      toast.error('Error logging out. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      {/* Top Bar with User Role and Dropdown */}
      <div className="w-full bg-blue-600 shadow-md p-4 flex justify-end">
        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="text-white font-medium hover:text-gray-200 focus:outline-none"
          >
            {userRole} <span className="text-sm text-gray-300">(User)</span>
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-xl space-y-6 text-center mt-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">AdiraMedica</h2>
        <p className="text-gray-600 mb-6">Choose a functionality below to proceed:</p>

        <button
          onClick={() => navigate('/itemdata')}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md shadow-md font-medium"
        >
          Enter/Update/Delete data in ItemData table
        </button>

        <button
          onClick={() => navigate('/receivingdata')}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md shadow-md font-medium"
        >
          Enter/Update/Delete data in ReceivingData table
        </button>

        <button
          onClick={() => navigate('/generate-pdf/520B')}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-md shadow-md font-medium"
        >
          Generate form 520B
        </button>

        <button
          onClick={() => navigate('/generate-pdf/501A')}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md shadow-md font-medium"
        >
          Generate form 501A
        </button>

        <button
          onClick={() => navigate('/generate-pdf/519A')}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-md shadow-md font-medium"
        >
          Generate form 519A
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
