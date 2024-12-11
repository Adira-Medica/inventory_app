// src/components/EditDeleteTable.js
import React, { useState } from 'react';
import { mockItemData, mockReceivingData } from '../mockData';
import { toast } from 'react-toastify';

const EditDeleteTable = () => {
  const [itemData, setItemData] = useState(mockItemData.map(item => ({ ...item, isVoid: false })));
  const [receivingData, setReceivingData] = useState(mockReceivingData.map(item => ({ ...item, isVoid: false })));
  const [activeTab, setActiveTab] = useState('items');
  const [selectedRows, setSelectedRows] = useState([]);

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

  const handleObsolete = (id) => {
    if (activeTab === 'items') {
      setItemData(itemData.map(item => 
        item.id === id ? { ...item, isVoid: !item.isVoid } : item
      ));
      toast.success(`Item ${itemData.find(item => item.id === id)?.item_number} ${!itemData.find(item => item.id === id)?.isVoid ? 'marked as obsolete' : 'unmarked as obsolete'}`);
    } else {
      setReceivingData(receivingData.map(item => 
        item.id === id ? { ...item, isVoid: !item.isVoid } : item
      ));
      toast.success(`Receiving data ${receivingData.find(item => item.id === id)?.receiving_no} ${!receivingData.find(item => item.id === id)?.isVoid ? 'marked as obsolete' : 'unmarked as obsolete'}`);
    }
  };

  const ItemTable = () => (
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
        {itemData.map((item) => (
          <tr key={item.id} className={item.isVoid ? 'bg-red-100' : ''}>
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
                isObsolete={item.isVoid}
                onObsolete={handleObsolete}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const ReceivingTable = () => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {[
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
        {receivingData.map((receiving) => (
          <tr key={receiving.id} className={receiving.isVoid ? 'bg-red-100' : ''}>
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
            <td className="px-6 py-4 whitespace-nowrap">{receiving.temp_device_deactivated}</td>
            <td className="px-6 py-4 whitespace-nowrap">{receiving.temp_device_returned_to_courier}</td>
            <td className="px-6 py-4 whitespace-nowrap">{receiving.comments_for_520b}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <TableActions
                id={receiving.id}
                onEdit={(id) => handleEdit(id, 'receiving')}
                isObsolete={receiving.isVoid}
                onObsolete={handleObsolete}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const handleEdit = (id, type) => {
    const message = `Editing ${type === 'items' ? 'item' : 'receiving data'} with ID: ${id}`;
    toast.info(message);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('items')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'items'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Item Data
            </button>
            <button
              onClick={() => setActiveTab('receiving')}
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
            {activeTab === 'items' ? <ItemTable /> : <ReceivingTable />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDeleteTable;