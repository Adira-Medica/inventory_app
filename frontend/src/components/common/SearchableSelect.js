import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  label, 
  placeholder = "Search...",
  error,
  displayKey = "label",
  valueKey = "value",
  required = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const wrapperRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    const optionLabel = typeof option === 'string' ? option : option[displayKey];
    return optionLabel.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update selected label when value changes
  useEffect(() => {
    if (value) {
      const selectedOption = options.find(option => 
        (typeof option === 'string' ? option : option[valueKey]) === value
      );
      if (selectedOption) {
        setSelectedLabel(typeof selectedOption === 'string' ? 
          selectedOption : 
          selectedOption[displayKey]
        );
        setSearchTerm(typeof selectedOption === 'string' ? 
          selectedOption : 
          selectedOption[displayKey]
        );
      }
    } else {
      setSelectedLabel('');
      setSearchTerm('');
    }
  }, [value, options, displayKey, valueKey]);

  const handleOptionClick = (option) => {
    const optionValue = typeof option === 'string' ? option : option[valueKey];
    const optionLabel = typeof option === 'string' ? option : option[displayKey];
    
    onChange(optionValue);
    setSelectedLabel(optionLabel);
    setSearchTerm(optionLabel);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
          ${error ? 'border-red-300' : 'border-gray-300'}`}
        placeholder={placeholder}
      />

      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.map((option, index) => {
            const optionValue = typeof option === 'string' ? option : option[valueKey];
            const optionLabel = typeof option === 'string' ? option : option[displayKey];
            
            return (
              <li
                key={index}
                className={`px-3 py-2 cursor-pointer hover:bg-blue-50 
                  ${optionValue === value ? 'bg-blue-100' : ''}`}
                onClick={() => handleOptionClick(option)}
              >
                {optionLabel}
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default SearchableSelect;