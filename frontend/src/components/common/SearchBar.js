// src/components/common/SearchBar.js
import React from 'react';

const SearchBar = ({
  searchQuery,
  isLoading,
  error,
  results,
  selectedIndex,
  isOpen,
  onSearchChange,
  onKeyDown,
  onClear,
  onSelect,
  activeTab
}) => {
  return (
    <div className="relative w-full">
      {/* Search Input Field */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={onSearchChange}
          onKeyDown={onKeyDown}
          placeholder={`Search ${activeTab === 'items' ? 'items' : 'receiving data'}...`}
          className="w-full p-4 pr-12 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={`Search ${activeTab}`}
        />
        
        {/* Search Controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
          {searchQuery && (
            <button
              onClick={onClear}
              className="p-1 hover:bg-gray-200 rounded-full"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
          <span className="text-gray-400">🔍</span>
        </div>
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto z-50">
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center">Loading...</div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 text-center text-red-500 flex items-center justify-center">
              {error}
            </div>
          )}

          {/* No Results State */}
          {!isLoading && !error && results.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No results found
            </div>
          )}

          {/* Results List */}
          {!isLoading && !error && results.length > 0 && results.map((result, index) => (
            <div
              key={activeTab === 'items' ? result.item_number : result.receiving_no}
              onClick={() => onSelect(result)}
              className={`p-4 cursor-pointer hover:bg-gray-100
                ${index === selectedIndex ? 'bg-gray-100' : ''}
                ${index !== results.length - 1 ? 'border-b' : ''}`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              {activeTab === 'items' ? (
                <>
                  <div className="font-medium">{result.item_number}</div>
                  <div className="text-sm text-gray-500">{result.description}</div>
                </>
              ) : (
                <>
                  <div className="font-medium">{result.receiving_no}</div>
                  <div className="text-sm text-gray-500">
                    Item: {result.item_number} - Lot: {result.lot_no}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;