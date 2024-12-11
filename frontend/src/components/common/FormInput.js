// src/components/common/FormInput.js
import React from 'react';

const FormInput = React.memo(({ 
  label, 
  name, 
  value, 
  onChange, 
  error, 
  type = 'text', 
  options = [], 
  required = false 
}) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {type === 'select' ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                   focus:border-blue-500 focus:ring-blue-500
                   ${error ? 'border-red-300' : ''}`}
      >
        <option value="">Select {label}</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    ) : type === 'textarea' ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={3}
        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                   focus:border-blue-500 focus:ring-blue-500
                   ${error ? 'border-red-300' : ''}`}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                   focus:border-blue-500 focus:ring-blue-500
                   ${error ? 'border-red-300' : ''}`}
      />
    )}
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
));

FormInput.displayName = 'FormInput';

export default FormInput;