// src/components/common/FormElements.js
import React from 'react';

export const FormSection = ({ title, children, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {title && (
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
        {title}
      </h3>
    )}
    {children}
  </div>
);

export const CheckboxGroup = ({ 
  items, 
  values, 
  onChange, 
  showNA = false,
  className = '' 
}) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
    {Object.entries(items).map(([key, label]) => (
      <div key={key} className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={values[key] || false}
            onChange={() => onChange(key)}
            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
            {label}
          </label>
        </div>
        {showNA && (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={values[`${key}_NA`] || false}
              onChange={() => onChange(`${key}_NA`)}
              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label className="ml-2 text-sm text-gray-900 dark:text-gray-100">
              N/A
            </label>
          </div>
        )}
      </div>
    ))}
  </div>
);

export const FormInput = ({ 
  label, 
  error, 
  required = false, 
  ...props 
}) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <input
      className={`
        block w-full rounded-md shadow-sm 
        ${error 
          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
          : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
        }
        dark:bg-gray-700 dark:border-gray-600 dark:text-white
      `}
      {...props}
    />
    {error && (
      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
    )}
  </div>
);