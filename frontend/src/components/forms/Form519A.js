import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import SearchableSelect from '../common/SearchableSelect';
import { format } from 'date-fns';

const Form519A = () => {
  const [formData, setFormData] = useState({
    receiving_no: '',
    item_no: '',
    item_description: '',
    lot_no: '',
    storage_conditions: '',
    other_storage_conditions: '',
    date_time_received: '',
    temp_device_alarm: '',
    temp_device_deactivated: '',
    temp_device_returned: '',
    max_exposure_time: '',
    temper_time: '',
    working_exposure_time: '',
    container_no: '',
    total_units_per_container: '',
    record_created_by: '',
    record_created_date: format(new Date(), 'yyyy-MM-dd'),
    drug_movements: [
      {
        destination: '',
        date: '',
        time: '',
        exposure_time: '',
        cumulative_et: '',
        completed_by: '',
        verified_by: ''
      }
    ]
  });

  const [itemOptions, setItemOptions] = useState([]);
  const [receivingOptions, setReceivingOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoading(true);
        const [itemResponse, receivingResponse] = await Promise.all([
          api.get('/item/numbers'),
          api.get('/receiving/numbers')
        ]);

        const itemOpts = itemResponse.data.map(item => ({
          value: item.item_number,
          label: `${item.item_number} - ${item.description}`
        }));

        const receivingOpts = receivingResponse.data.map(rec => ({
          value: rec.receiving_no,
          label: rec.receiving_no
        }));

        setItemOptions(itemOpts);
        setReceivingOptions(receivingOpts);
      } catch (error) {
        console.error("Error fetching options:", error);
        toast.error("Error loading data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const handleReceivingSelect = async (selectedValue) => {
    try {
      const response = await api.get(`/receiving/get/${selectedValue}`);
      const receivingData = response.data;
      console.log("Receiving data:", receivingData);

      setFormData(prev => ({
        ...prev,
        receiving_no: selectedValue,
        lot_no: receivingData.lot_no,
        temp_device_alarm: receivingData.temp_device_in_alarm || 'No',
        temp_device_deactivated: receivingData.temp_device_deactivated || 'No',
        temp_device_returned: receivingData.temp_device_returned_to_courier || 'No',
        total_units_per_container: receivingData.total_units_vendor || ''
      }));
    } catch (error) {
      console.error("Error fetching receiving details:", error);
      toast.error("Error loading receiving data");
    }
  };

  const handleItemSelect = async (selectedValue) => {
    try {
      const response = await api.get(`/item/get/${selectedValue}`);
      const itemData = response.data;
      console.log("Item data:", itemData);

      setFormData(prev => ({
        ...prev,
        item_no: selectedValue,
        item_description: itemData.description,
        storage_conditions: itemData.temp_storage_conditions,
        other_storage_conditions: itemData.other_storage_conditions,
        max_exposure_time: itemData.max_exposure_time,
        temper_time: itemData.temper_time,
        working_exposure_time: itemData.working_exposure_time
      }));
    } catch (error) {
      console.error("Error fetching item details:", error);
      toast.error("Error loading item data");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDrugMovementChange = (index, field, value) => {
    const newMovements = [...formData.drug_movements];
    newMovements[index][field] = value;

    // If changing exposure time, update cumulative ET
    if (field === 'exposure_time') {
      let cumulativeTotal = 0;
      for (let i = 0; i <= index; i++) {
        cumulativeTotal += Number(i === index ? value : newMovements[i].exposure_time) || 0;
      }
      newMovements[index].cumulative_et = cumulativeTotal.toString();
    }

    setFormData(prev => ({
      ...prev,
      drug_movements: newMovements
    }));
  };

  const validateExposureTimes = () => {
    const workingExposureTime = Number(formData.working_exposure_time);
    const maxExposureTime = Number(formData.max_exposure_time);

    if (!workingExposureTime || !maxExposureTime) {
      toast.error('Working Exposure Time and Maximum Exposure Time must be set');
      return false;
    }

    let cumulativeTotal = 0;

    for (let i = 0; i < formData.drug_movements.length; i++) {
      const movement = formData.drug_movements[i];
      const exposureTime = Number(movement.exposure_time);

      if (isNaN(exposureTime) || exposureTime < 0) {
        toast.error(`Invalid exposure time in row ${i + 1}`);
        return false;
      }

      if (exposureTime > workingExposureTime) {
        toast.error(
          `Exposure time (${exposureTime} min) in row ${i + 1} exceeds working exposure time limit (${workingExposureTime} min)`
        );
        return false;
      }

      cumulativeTotal += exposureTime;

      if (cumulativeTotal > maxExposureTime) {
        toast.error(
          `Cumulative exposure time (${cumulativeTotal} min) exceeds maximum exposure time limit (${maxExposureTime} min)`
        );
        return false;
      }

      const reportedCumulative = Number(movement.cumulative_et);
      if (reportedCumulative !== cumulativeTotal) {
        movement.cumulative_et = cumulativeTotal.toString();
      }
    }

    return true;
  };

  const validateForm = () => {
    if (!formData.receiving_no) {
      toast.error('Please select a Receiving Number');
      return false;
    }
    if (!formData.item_no) {
      toast.error('Please select an Item Number');
      return false;
    }
    if (!formData.date_time_received) {
      toast.error('Please enter Date and Time Received');
      return false;
    }
    if (!formData.container_no) {
      toast.error('Please enter Container Number');
      return false;
    }
    if (!formData.record_created_by) {
      toast.error('Please enter Record Created By');
      return false;
    }
    return validateExposureTimes();
  };

  const handleSubmit = async () => {
    try {
      if (!validateForm()) {
        return;
      }
      
  // Format data for PDF generation
      const pdfData = {
        'Receiving No': formData.receiving_no,
        'Item No': formData.item_no,
        'Item Description': formData.item_description,
        'Lot No': formData.lot_no,
        'Storage Conditions': formData.storage_conditions,
        'Date and Time Received': formData.date_time_received,
        'Other Storage Conditions': formData.other_storage_conditions,
        'Temperature Device on Alarm': formData.temp_device_alarm,
        'Temperature Device Deactivated': formData.temp_device_deactivated,
        'Temperature Device Returned to Courier': formData.temp_device_returned,
        'Maximum Exposure Time': formData.max_exposure_time,
        'Temper Time': formData.temper_time,
        'Working Exposure Time': formData.working_exposure_time,
        'Container No': formData.container_no,
        'Total Units/Container': formData.total_units_per_container,
        'Record Created By': formData.record_created_by,
        'drugMovements': formData.drug_movements.map(movement => ({
            'destination': movement.destination,
            'date': movement.date,
            'time': movement.time,
            'exposure_time': movement.exposure_time,
            'cumulative_et': movement.cumulative_et,
            'completed_by': movement.completed_by,
            'verified_by': movement.verified_by
        }))
    };

      console.log("Sending data for PDF:", pdfData); // Debug log

      const response = await api.post('/form/generate-pdf/519A', formData, {
        responseType: 'blob'
      });

      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = `519A_${formData.receiving_no}.pdf`;
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
      <form className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Temperature Exposure Record (Form 519A)</h2>

        <div className="space-y-6">
          {/* Basic Information Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SearchableSelect
              label="Receiving Number *"
              options={receivingOptions}
              value={formData.receiving_no}
              onChange={handleReceivingSelect}
              placeholder="Search receiving number..."
              required
            />
            <SearchableSelect
              label="Item Number *"
              options={itemOptions}
              value={formData.item_no}
              onChange={handleItemSelect}
              placeholder="Search item number..."
              required
            />
          </div>

          {/* Item Description and Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Description</label>
              <textarea
                value={formData.item_description}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Lot Number</label>
              <input
                type="text"
                value={formData.lot_no}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date and Time Received *</label>
              <input
                type="datetime-local"
                name="date_time_received"
                value={formData.date_time_received}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Storage Conditions</label>
              <input
                type="text"
                value={formData.storage_conditions}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Other Storage Conditions</label>
              <input
                type="text"
                value={formData.other_storage_conditions}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>
          </div>

          {/* Temperature Device Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Temperature Device on Alarm</label>
              <select
                name="temp_device_alarm"
                value={formData.temp_device_alarm}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="Yes - NCMR">Yes - NCMR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Temperature Device Deactivated</label>
              <select
                name="temp_device_deactivated"
                value={formData.temp_device_deactivated}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Temperature Device Returned to Courier
              </label>
              <select
                name="temp_device_returned"
                value={formData.temp_device_returned}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>

          {/* Exposure Times */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Maximum Exposure Time (min)</label>
              <input
                type="text"
                value={formData.max_exposure_time}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Temper Time (min)</label>
              <input
                type="text"
                value={formData.temper_time}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Working Exposure Time (min)</label>
              <input
                type="text"
                value={formData.working_exposure_time}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>
          </div>

          {/* Container Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Container Number *</label>
              <input
                type="text"
                name="container_no"
                value={formData.container_no}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Total Units/Container</label>
              <input
                type="text"
                value={formData.total_units_per_container}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Record Created By/Date *</label>
              <div className="flex gap-4">
                <input
                  type="text"
                  name="record_created_by"
                  value={formData.record_created_by}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300"
                  placeholder="Name and Initials"
                  required
                />
                <input
                  type="date"
                  name="record_created_date"
                  value={formData.record_created_date}
                  onChange={handleInputChange}
                  className="mt-1 block w-40 rounded-md border-gray-300"
                  required
                />
              </div>
            </div>
          </div>

          {/* Drug Movements Table */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">DRUG MOVEMENT:</h3>
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  drug_movements: [
                    ...prev.drug_movements,
                    {
                      destination: '',
                      date: '',
                      time: '',
                      exposure_time: '',
                      cumulative_et: '',
                      completed_by: '',
                      verified_by: ''
                    }
                  ]
                }))}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Add Movement
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Destination/Comments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ET (min)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cumulative ET</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed By/Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified By/Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.drug_movements.map((movement, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={movement.destination}
                          onChange={(e) => handleDrugMovementChange(index, 'destination', e.target.value)}
                          className="w-full border-gray-300 rounded-md"
                          placeholder="Enter destination or comments"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="date"
                          value={movement.date}
                          onChange={(e) => handleDrugMovementChange(index, 'date', e.target.value)}
                          className="w-full border-gray-300 rounded-md"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="time"
                          value={movement.time}
                          onChange={(e) => handleDrugMovementChange(index, 'time', e.target.value)}
                          className="w-full border-gray-300 rounded-md"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={movement.exposure_time}
                          onChange={(e) => handleDrugMovementChange(index, 'exposure_time', e.target.value)}
                          className="w-full border-gray-300 rounded-md"
                          min="0"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={movement.cumulative_et}
                          readOnly
                          className="w-full border-gray-300 rounded-md bg-gray-50"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={movement.completed_by}
                          onChange={(e) => handleDrugMovementChange(index, 'completed_by', e.target.value)}
                          className="w-full border-gray-300 rounded-md"
                          placeholder="Name and initials"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={movement.verified_by}
                          onChange={(e) => handleDrugMovementChange(index, 'verified_by', e.target.value)}
                          className="w-full border-gray-300 rounded-md"
                          placeholder="Name and initials"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => {
                            const newMovements = formData.drug_movements.filter((_, i) => i !== index);
                            setFormData(prev => ({
                              ...prev,
                              drug_movements: newMovements
                            }));
                          }}
                          className="text-red-600 hover:text-red-800"
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
              <li>
                Exposure Time <span className="font-bold">MUST NOT EXCEED</span> the Working Exposure Time
              </li>
              <li>
                Cumulative Exposure Time <span className="font-bold">MUST NOT EXCEED</span> the Maximum Exposure Time
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={handleSubmit}
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