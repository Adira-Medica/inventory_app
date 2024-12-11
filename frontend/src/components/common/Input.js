// src/components/common/Input.js
import React from 'react';

const Input = ({ 
  label, 
  error, 
  ...props 
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm
          ${error ? 'border-red-300' : 'border-gray-300'}
          focus:ring-blue-500 focus:border-blue-500
          dark:bg-gray-700 dark:border-gray-600 dark:text-white
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;