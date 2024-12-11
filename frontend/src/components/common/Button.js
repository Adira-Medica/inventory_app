// src/components/common/Button.js
import React from 'react';

const Button = ({ 
  children, 
  type = 'button', 
  variant = 'primary', 
  isLoading = false, 
  onClick,
  ...props 
}) => {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-colors duration-200";
  
  const variants = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-500"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Loading...
        </div>
      ) : children}
    </button>
  );
};

export default Button;