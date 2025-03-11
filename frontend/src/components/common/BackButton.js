// src/components/common/BackButton.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const BackButton = () => {
  const navigate = useNavigate();
  
  const handleGoBack = () => {
    navigate('/landing');
  };
  
  return (
    <button
      onClick={handleGoBack}
      className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg shadow-sm hover:bg-indigo-600 transition-colors"
    >
      <ArrowLeftIcon className="h-5 w-5 mr-2" />
      Back to Dashboard
    </button>
  );
};

export default BackButton;