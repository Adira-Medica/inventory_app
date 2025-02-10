// src/components/forms/Form519A.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';

const Form519A = () => {
  const [formData, setFormData] = useState({
    ItemNo: '',
    ReceivingNo: '',
    itemDescription: '',
    storageConditions: '',
    otherStorageConditions: '',
    lotNo: '',
    dateTimeReceived: '',
    tempDeviceInfo: {
      onAlarm: '',
      deactivated: '',
      returnedToCourier: ''
    },
    exposureTimes: {
      maximumExposure: '',
      workingExposure: '',
      temperTime: ''
    },
    containerInfo: {
      containerNo: '',
      totalUnitsPerContainer: ''
    },
    drugMovements: [], // Array for the drug movement table entries
    recordCreatedBy: '',
    dateCreated: ''
  });

  const [itemOptions, setItemOptions] = useState([]);
  const [receivingOptions, setReceivingOptions] = useState([]);
  const [selectedItemData, setSelectedItemData] = useState(null);
  const [selectedReceivingData, setSelectedReceivingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      setIsLoading(true);
      const [itemResponse, receivingResponse] = await Promise.all([
        api.get('/item/numbers'),
        api.get('/receiving/numbers')
      ]);

      setItemOptions(itemResponse.data);
      setReceivingOptions(receivingResponse.data);
    } catch (error) {
      console.error("Error fetching options:", error);
      toast.error("Error loading data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemSelect = async (selectedItemNo) => {
    try {
      const response = await api.get(`/item/get/${selectedItemNo}`);
      setSelectedItemData(response.data);
      setFormData(prev => ({
        ...prev,
        ItemNo: selectedItemNo,
        itemDescription: response.data.description,
        storageConditions: response.data.temp_storage_conditions,
        otherStorageConditions: response.data.other_storage_conditions,
        exposureTimes: {
          ...prev.exposureTimes,
          maximumExposure: response.data.max_exposure_time,
          workingExposure: response.data.working_exposure_time,
          temperTime: response.data.temper_time
        }
      }));
    } catch (error) {
      console.error("Error fetching item details:", error);
      toast.error("Error loading item details");
    }
  };

  const handleReceivingSelect = async (selectedReceivingNo) => {
    try {
      const response = await api.get(`/receiving/get/${selectedReceivingNo}`);
      setSelectedReceivingData(response.data);
      setFormData(prev => ({
        ...prev,
        ReceivingNo: selectedReceivingNo,
        lotNo: response.data.lot_no,
        tempDeviceInfo: {
          onAlarm: response.data.temp_device_in_alarm || '',
          deactivated: response.data.temp_device_deactivated || '',
          returnedToCourier: response.data.temp_device_returned_to_courier || ''
        },
        containerInfo: {
          ...prev.containerInfo,
          totalUnitsPerContainer: response.data.total_units_vendor
        }
      }));
    } catch (error) {
      console.error("Error fetching receiving details:", error);
      toast.error("Error loading receiving details");
    }
  };

  const addDrugMovement = () => {
    setFormData(prev => ({
      ...prev,
      drugMovements: [
        ...prev.drugMovements,
        {
          destination: '',
          date: '',
          time: '',
          exposureTime: '',
          cumulativeET: '',
          completedBy: '',
          verifiedBy: ''
        }
      ]
    }));
  };

  const updateDrugMovement = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      drugMovements: prev.drugMovements.map((movement, i) => 
        i === index ? { ...movement, [field]: value } : movement
      )
    }));
  };

  const removeDrugMovement = (index) => {
    setFormData(prev => ({
      ...prev,
      drugMovements: prev.drugMovements.filter((_, i) => i !== index)
    }));
  };

  const handleGeneratePDF = async (e) => {
    e.preventDefault();
    
    if (!selectedItemData || !selectedReceivingData) {
      toast.error('Please select both Item Number and Receiving Number');
      return;
    }

    try {
      const response = await api.post('/form/generate-pdf/519A', formData, {
        responseType: 'blob'
      });

      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = `519A_${formData.ReceivingNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(fileURL);

      toast.success('PDF Generated Successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <form onSubmit={handleGeneratePDF} className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Generate Form 519A</h2>
        
        <div className="space-y-6">
          {/* Item and Receiving Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Number
              </label>
              <select
                value={formData.ItemNo}
                onChange={(e) => handleItemSelect(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Select Item Number</option>
                {itemOptions.map(item => (
                  <option key={item.item_number} value={item.item_number}>
                    {item.item_number} - {item.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receiving Number
              </label>
              <select
                value={formData.ReceivingNo}
                onChange={(e) => handleReceivingSelect(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Select Receiving Number</option>
                {receivingOptions.map(rec => (
                  <option key={rec.receiving_no} value={rec.receiving_no}>
                    {rec.receiving_no}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Lot Number</label>
                <input
                  type="text"
                  value={formData.lotNo}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date and Time Received</label>
                <input
                  type="datetime-local"
                  value={formData.dateTimeReceived}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateTimeReceived: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Temperature Device Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Temperature Device Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Device on Alarm</label>
                <select
                  value={formData.tempDeviceInfo.onAlarm}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    tempDeviceInfo: { ...prev.tempDeviceInfo, onAlarm: e.target.value }
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Device Deactivated</label>
                <select
                  value={formData.tempDeviceInfo.deactivated}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    tempDeviceInfo: { ...prev.tempDeviceInfo, deactivated: e.target.value }
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Returned to Courier</label>
                <select
                  value={formData.tempDeviceInfo.returnedToCourier}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    tempDeviceInfo: { ...prev.tempDeviceInfo, returnedToCourier: e.target.value }
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </div>

          {/* Exposure Times */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Exposure Times</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Maximum Exposure Time (min)</label>
                <input
                  type="number"
                  value={formData.exposureTimes.maximumExposure}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Working Exposure Time (min)</label>
                <input
                  type="number"
                  value={formData.exposureTimes.workingExposure}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Temper Time (min)</label>
                <input
                  type="number"
                  value={formData.exposureTimes.temperTime}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Container Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Container Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Container Number</label>
                <input
                  type="text"
                  value={formData.containerInfo.containerNo}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    containerInfo: { ...prev.containerInfo, containerNo: e.target.value }
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Units/Container</label>
                <input
                  type="number"
                  value={formData.containerInfo.totalUnitsPerContainer}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Drug Movement Table */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Drug Movement</h3>
              <button
                type="button"
                onClick={addDrugMovement}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Add Movement
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination/Comments</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ET (min)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cumulative ET</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.drugMovements.map((movement, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={movement.destination}
                          onChange={(e) => updateDrugMovement(index, 'destination', e.target.value)}
                          className="w-full border-gray-300 rounded-md"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="date"
                          value={movement.date}
                          onChange={(e) => updateDrugMovement(index, 'date', e.target.value)}
                          className="w-full border-gray-300 rounded-md"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="time"
                          value={movement.time}
                          onChange={(e) => updateDrugMovement(index, 'time', e.target.value)}
                          className="w-full border-gray-300 rounded-md"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={movement.exposureTime}
                          onChange={(e) => updateDrugMovement(index, 'exposureTime', e.target.value)}
                          className="w-full border-gray-300 rounded-md"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={movement.cumulativeET}
                          onChange={(e) => updateDrugMovement(index, 'cumulativeET', e.target.value)}
                          className="w-full border-gray-300 rounded-md"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={movement.completedBy}
                          onChange={(e) => updateDrugMovement(index, 'completedBy', e.target.value)}
                          className="w-full border-gray-300 rounded-md"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={movement.verifiedBy}
                          onChange={(e) => updateDrugMovement(index, 'verifiedBy', e.target.value)}
                          className="w-full border-gray-300 rounded-md"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => removeDrugMovement(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-yellow-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-yellow-800">Notes:</h4>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
              <li>Exposure Time MUST NOT EXCEED the Working Exposure Time</li>
              <li>Cumulative Exposure Time MUST NOT EXCEED the Maximum Exposure Time</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Generate PDF
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Form519A;