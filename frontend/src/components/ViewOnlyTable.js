// src/components/ViewOnlyTable.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import SearchBar from './common/SearchBar';
import { useAuth } from '../hooks/useAuth';

const ITEMS_PER_PAGE = 10;

const ViewOnlyTable = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [itemData, setItemData] = useState([]);
  const [receivingData, setReceivingData] = useState([]);
  const [activeTab, setActiveTab] = useState('items');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchError, setSearchError] = useState('');

  // If the user is a manager or admin, redirect them to the edit table
  useEffect(() => {
    if (!user) {
      return; // Wait for user data to load
    }
    
    if (user.role !== 'user') {
      navigate('/landing', { replace: true });
      toast.error('Unauthorized access. Redirecting to dashboard.');
    }
  }, [user, navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'items') {
        const response = await api.get('/item/get');
        if (response.data && Array.isArray(response.data)) {
          const itemsWithOrder = response.data.map((item, index) => ({
            ...item,
            originalIndex: index
          }));
          setItemData(itemsWithOrder);
          setFilteredData(itemsWithOrder);
        }
      } else {
        const response = await api.get('/receiving/get');
        if (response.data && Array.isArray(response.data)) {
          const receivingWithOrder = response.data.map((item, index) => ({
            ...item,
            originalIndex: index
          }));
          setReceivingData(receivingWithOrder);
          setFilteredData(receivingWithOrder);
        }
      }
      setSearchError('');
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
      setSearchError('Error loading data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setCurrentPage(1);
  }, [activeTab]);

  const handleResultSelect = (result) => {
    const elementId = activeTab === 'items' ?
      `item-${result.id}` :
      `receiving-${result.id}`;
     
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-row');
      setTimeout(() => {
        if (element) {
          element.classList.remove('highlight-row');
        }
      }, 2000);
    }
    setIsSearchOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isSearchOpen) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredData.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredData.length) {
          handleResultSelect(filteredData[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsSearchOpen(false);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const data = activeTab === 'items' ? itemData : receivingData;
    if (searchTerm.trim() === '') {
      setFilteredData(data);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const filtered = data.filter(item => {
      if (activeTab === 'items') {
        return (
          (item.item_number || '').toLowerCase().includes(searchTermLower) ||
          (item.description || '').toLowerCase().includes(searchTermLower) ||
          (item.client || '').toLowerCase().includes(searchTermLower) ||
          (item.protocol_number || '').toLowerCase().includes(searchTermLower) ||
          (item.vendor || '').toLowerCase().includes(searchTermLower) ||
          (item.uom || '').toLowerCase().includes(searchTermLower) ||
          (item.controlled || '').toLowerCase().includes(searchTermLower) ||
          (item.study_type || '').toLowerCase().includes(searchTermLower)
        );
      } else {
        return (
          (item.receiving_no || '').toLowerCase().includes(searchTermLower) ||
          (item.item_number || '').toLowerCase().includes(searchTermLower) ||
          (item.tracking_number || '').toLowerCase().includes(searchTermLower) ||
          (item.lot_no || '').toLowerCase().includes(searchTermLower) ||
          (item.po_no || '').toLowerCase().includes(searchTermLower)
        );
      }
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, itemData, receivingData, activeTab]);

  const getCurrentData = () => {
    if (!filteredData?.length) return [];
   
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const sortedData = [...filteredData].sort((a, b) =>
      (a.display_order || 0) - (b.display_order || 0)
    );
   
    return sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const PaginationControls = () => (
    <div className="flex justify-between items-center mt-4 py-4 px-6">
      <div className="text-sm text-gray-700">
        Showing page {currentPage} of {totalPages || 1}
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded ${
            currentPage === 1
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-700 text-white'
          }`}
        >
          Previous
        </button>
        <div className="flex space-x-1">
          {[...Array(Math.min(totalPages, 5) || 0)].map((_, index) => {
            let pageNum;
            if (totalPages <= 5) {
              // Show all pages if 5 or fewer
              pageNum = index + 1;
            } else if (currentPage <= 3) {
              // Near the start
              pageNum = index + 1;
            } else if (currentPage >= totalPages - 2) {
              // Near the end
              pageNum = totalPages - 4 + index;
            } else {
              // In the middle
              pageNum = currentPage - 2 + index;
            }
           
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1 rounded ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages || 1))}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded ${
            currentPage === totalPages
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-700 text-white'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );

  const ItemTable = () => {
    const data = getCurrentData();
    if (!data?.length) {
      return <div className="p-4 text-center text-gray-500">No items found</div>;
    }
    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[
              'Item Number',
              'Description',
              'Client',
              'Protocol Number',
              'Vendor',
              'UOM',
              'Controlled',
              'Temp Storage Conditions',
              'Other Storage Conditions',
              'Max Exposure Time',
              'Temper Time',
              'Working Exposure Time',
              'Vendor Code Rev',
              'Randomized',
              'Sequential Numbers',
              'Study Type'
            ].map((header) => (
              <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr
              key={item.id}
              id={`item-${item.id}`}
              className={`transition-colors duration-200 ${item.is_obsolete ? 'bg-red-100' : ''}`}
            >
              <td className="px-6 py-4 whitespace-nowrap">{item.item_number}</td>
              <td className="px-6 py-4 whitespace-nowrap">{item.description}</td>
              <td className="px-6 py-4 whitespace-nowrap">{item.client}</td>
              <td className="px-6 py-4 whitespace-nowrap">{item.protocol_number}</td>
              <td className="px-6 py-4 whitespace-nowrap">{item.vendor}</td>
              <td className="px-6 py-4 whitespace-nowrap">{item.uom}</td>
              <td className="px-6 py-4 whitespace-nowrap">{item.controlled}</td>
              <td className="px-6 py-4 whitespace-nowrap">{item.temp_storage_conditions}</td>
              <td className="px-6 py-4 whitespace-nowrap">{item.other_storage_conditions}</td>
              <td className="px-6 py-4 whitespace-nowrap">{item.max_exposure_time}</td>
              <td className="px-6 py-4 whitespace-nowrap">{item.temper_time}</td>
              <td className="px-6 py-4 whitespace-nowrap">{item.working_exposure_time}</td>
              <td className="px-6 py-4 whitespace-nowrap">{item.vendor_code_rev}</td>
              <td className="px-6 py-4 whitespace-nowrap">{item.randomized}</td>
              <td className="px-6 py-4 whitespace-nowrap">{item.sequential_numbers}</td>
              <td className="px-6 py-4 whitespace-nowrap">{item.study_type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const ReceivingTable = () => {
    const data = getCurrentData();
    if (!data?.length) {
      return <div className="p-4 text-center text-gray-500">No receiving data found</div>;
    }
    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[
              'Item No',
              'Receiving No',
              'Tracking Number',
              'Lot No',
              'PO No',
              'Total Units Vendor',
              'Total Storage Containers',
              'Exp Date',
              'NCMR',
              'Total Units Received',
              'Temp Device in Alarm',
              'NCMR2',
              'Temp Device Deactivated',
              'Temp Device Returned to Courier',
              'Comments for 520B'
            ].map((header) => (
              <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((receiving) => (
            <tr
              key={receiving.id}
              id={`receiving-${receiving.id}`}
              className={`transition-colors duration-200 ${receiving.is_obsolete ? 'bg-red-100' : ''}`}
            >
              <td className="px-6 py-4 whitespace-nowrap">{receiving.item_number}</td>
              <td className="px-6 py-4 whitespace-nowrap">{receiving.receiving_no}</td>
              <td className="px-6 py-4 whitespace-nowrap">{receiving.tracking_number}</td>
              <td className="px-6 py-4 whitespace-nowrap">{receiving.lot_no}</td>
              <td className="px-6 py-4 whitespace-nowrap">{receiving.po_no}</td>
              <td className="px-6 py-4 whitespace-nowrap">{receiving.total_units_vendor}</td>
              <td className="px-6 py-4 whitespace-nowrap">{receiving.total_storage_containers}</td>
              <td className="px-6 py-4 whitespace-nowrap">{receiving.exp_date}</td>
              <td className="px-6 py-4 whitespace-nowrap">{receiving.ncmr}</td>
              <td className="px-6 py-4 whitespace-nowrap">{receiving.total_units_received}</td>
              <td className="px-6 py-4 whitespace-nowrap">{receiving.temp_device_in_alarm}</td>
              <td className="px-6 py-4 whitespace-nowrap">{receiving.ncmr2}</td>
              <td className="px-6 py-4 whitespace-nowrap">{receiving.temp_device_deactivated}</td>
              <td className="px-6 py-4 whitespace-nowrap">{receiving.temp_device_returned_to_courier}</td>
              <td className="px-6 py-4 whitespace-nowrap">{receiving.comments_for_520b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">View Data</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setActiveTab('items');
                setCurrentPage(1);
                setSearchTerm('');
                setIsSearchOpen(false);
              }}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'items'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Item Data
            </button>
            <button
              onClick={() => {
                setActiveTab('receiving');
                setCurrentPage(1);
                setSearchTerm('');
                setIsSearchOpen(false);
              }}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'receiving'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Receiving Data
            </button>
          </div>
        </div>
        <div className="mb-4">
          <SearchBar
            searchQuery={searchTerm}
            isLoading={isLoading}
            error={searchError}
            results={filteredData.slice(0, 10)} // Limit to first 10 for performance
            selectedIndex={selectedIndex}
            isOpen={isSearchOpen && searchTerm.length > 0}
            onSearchChange={(e) => {
              setSearchTerm(e.target.value);
              setIsSearchOpen(true);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onClear={() => {
              setSearchTerm('');
              setIsSearchOpen(false);
              setSelectedIndex(-1);
            }}
            onSelect={handleResultSelect}
            activeTab={activeTab}
          />
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {activeTab === 'items' ? <ItemTable /> : <ReceivingTable />}
                {filteredData.length > 0 && <PaginationControls />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewOnlyTable;