// src/components/EditDeleteTable.js
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import EditModal from './modals/EditModal';

const ITEMS_PER_PAGE = 10;

const EditDeleteTable = () => {
  const [itemData, setItemData] = useState([]);
  const [receivingData, setReceivingData] = useState([]);
  const [activeTab, setActiveTab] = useState('items');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingData, setEditingData] = useState({});

  const fetchData = useCallback(async () => {
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
        }
      } else {
        const response = await api.get('/receiving/get');
        if (response.data && Array.isArray(response.data)) {
          const receivingWithOrder = response.data.map((item, index) => ({
            ...item,
            originalIndex: index
          }));
          setReceivingData(receivingWithOrder);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
    setCurrentPage(1);
  }, [fetchData, activeTab]);

  const handleObsolete = async (id) => {
    try {
      const endpoint = activeTab === 'items' 
        ? `/item/toggle-obsolete/${id}`
        : `/receiving/toggle-obsolete/${id}`;
      
      await api.put(endpoint);
      
      if (activeTab === 'items') {
        setItemData(prevData => 
          prevData.map(item => 
            item.id === id 
              ? { ...item, is_obsolete: !item.is_obsolete }
              : item
          )
        );
      } else {
        setReceivingData(prevData => 
          prevData.map(item => 
            item.id === id 
              ? { ...item, is_obsolete: !item.is_obsolete }
              : item
          )
        );
      }

      toast.success(`${activeTab === 'items' ? 'Item' : 'Receiving data'} obsolete status updated`);
    } catch (error) {
      console.error('Error updating obsolete status:', error);
      toast.error('Failed to update obsolete status');
    }
  };

  const handleEdit = (id, type) => {
    const data = type === 'items'
      ? itemData.find(item => item.id === id)
      : receivingData.find(item => item.id === id);
   
    setEditingData({ ...data, type });
    setEditModalOpen(true);
  };

  const handleUpdate = (updatedData) => {
    if (!updatedData?.id) return;

    if (activeTab === 'items') {
      setItemData(prevData => 
        prevData.map(item => 
          item.id === updatedData.id ? { ...updatedData, display_order: item.display_order } : item
        )
      );
    } else {
      setReceivingData(prevData => 
        prevData.map(item => 
          item.id === updatedData.id ? { ...updatedData, display_order: item.display_order } : item
        )
      );
    }
  };

  const getCurrentData = () => {
    const data = activeTab === 'items' ? itemData : receivingData;
    if (!data?.length) return [];
    
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const sortedData = [...data].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)
  );
    return sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const totalPages = Math.ceil(
    (activeTab === 'items' ? itemData.length : receivingData.length) / ITEMS_PER_PAGE
  );

  const TableActions = ({ id, onEdit, isObsolete, onObsolete }) => (
    <div className="flex space-x-2">
      <button
        onClick={() => onEdit(id)}
        className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded"
      >
        Edit
      </button>
      <button
        onClick={() => onObsolete(id)}
        className={`px-3 py-1 rounded text-white ${
          isObsolete
            ? 'bg-gray-500 hover:bg-gray-700'
            : 'bg-red-500 hover:bg-red-700'
        }`}
      >
        {isObsolete ? 'Obsoleted' : 'Obsolete'}
      </button>
    </div>
  );

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
          {[...Array(totalPages || 0)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === index + 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
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
              'Study Type',
              'Actions'
            ].map((header) => (
              <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={item.id} className={item.is_obsolete ? 'bg-red-100' : ''}>
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
              <td className="px-6 py-4 whitespace-nowrap">
                <TableActions
                  id={item.id}
                  onEdit={(id) => handleEdit(id, 'items')}
                  isObsolete={item.is_obsolete}
                  onObsolete={handleObsolete}
                />
              </td>
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
              'Comments for 520B',
              'Actions'
            ].map((header) => (
              <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((receiving) => (
            <tr key={receiving.id} className={receiving.is_obsolete ? 'bg-red-100' : ''}>
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
              <td className="px-6 py-4 whitespace-nowrap">
                <TableActions
                  id={receiving.id}
                  onEdit={(id) => handleEdit(id, 'receiving')}
                  isObsolete={receiving.is_obsolete}
                  onObsolete={handleObsolete}
                />
              </td>
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
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setActiveTab('items');
                setCurrentPage(1);
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

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {activeTab === 'items' ? <ItemTable /> : <ReceivingTable />}
                {(activeTab === 'items' ? itemData : receivingData).length > 0 && <PaginationControls />}
              </>
            )}

            {editModalOpen && (
              <EditModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                data={editingData}
                type={activeTab}
                onUpdate={handleUpdate}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDeleteTable;