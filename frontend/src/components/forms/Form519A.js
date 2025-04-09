import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { format, differenceInMinutes, parse } from 'date-fns';
import api from '../../api/axios';
import SearchableSelect from '../common/SearchableSelect';
import BackButton from "../common/BackButton";

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
        transactionType: 'Out',  // First row is always "Out"
        exposure_time: '0',      // Exposure time for "Out" is always 0
        cumulative_et: '0',
        completed_by: '',
        verified_by: ''
      }
    ]
  });

  const [itemOptions, setItemOptions] = useState([]);
  const [receivingOptions, setReceivingOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [warnings, setWarnings] = useState({});
  const [errors, setErrors] = useState({});

  // Fetch data when component mounts
  useEffect(() => {
    fetchData();
  }, []);

  // Load example data when an item is selected (for demo purposes)
  useEffect(() => {
    if (formData.item_no && !formData.temper_time) {
      loadExampleData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.item_no]);

  // Fetch available item and receiving numbers
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [itemResponse, receivingResponse] = await Promise.all([
        api.get('/item/numbers'),
        api.get('/receiving/numbers')
      ]);

      // Format item options
      const itemOpts = itemResponse.data
        .filter(item => !item.is_obsolete)
        .map(item => ({
          value: item.item_number,
          label: `${item.item_number} - ${item.description}`
        }));

      // Format receiving options
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

  // Load example data for demonstration
  const loadExampleData = () => {
    setFormData(prev => ({
      ...prev,
      temper_time: '30',              // TT: 30 minutes
      working_exposure_time: '120',   // WET: 120 minutes
      max_exposure_time: '480',       // MET: 480 minutes
      drug_movements: [
        {
          destination: 'Initial removal',
          date: '2025-03-24',
          time: '08:00',
          transactionType: 'Out',
          exposure_time: '0',
          cumulative_et: '0',
          completed_by: '',
          verified_by: ''
        }
      ]
    }));
  };

  // Handle item selection
  const handleItemSelect = async (selectedValue) => {
    try {
      const response = await api.get(`/item/get/${selectedValue}`);
      const itemData = response.data;
      
      setFormData(prev => ({
        ...prev,
        item_no: selectedValue,
        item_description: itemData.description || '',
        storage_conditions: itemData.temp_storage_conditions || '',
        other_storage_conditions: itemData.other_storage_conditions || '',
        max_exposure_time: itemData.max_exposure_time || '',
        temper_time: itemData.temper_time || '',
        working_exposure_time: itemData.working_exposure_time || ''
      }));
    } catch (error) {
      console.error("Error fetching item details:", error);
      toast.error("Error loading item data");
    }
  };

  // Handle receiving selection
  const handleReceivingSelect = async (selectedValue) => {
    try {
      const response = await api.get(`/receiving/get/${selectedValue}`);
      const receivingData = response.data;
      
      setFormData(prev => ({
        ...prev,
        receiving_no: selectedValue,
        lot_no: receivingData.lot_no || '',
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

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create Date object from date and time strings
  const getDateTimeObject = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    
    try {
      const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
      const [hours, minutes] = timeStr.split(':').map(num => parseInt(num, 10));
      
      return new Date(year, month - 1, day, hours, minutes);
    } catch (error) {
      console.error("Error parsing date/time:", error);
      return null;
    }
  };

  // Format time for display (24-hour format to 12-hour format)
  // eslint-disable-next-line no-unused-vars
  const formatTimeForDisplay = (timeStr) => {
    if (!timeStr) return '';
    
    try {
      const time = parse(timeStr, 'HH:mm', new Date());
      return format(time, 'hh:mm a');
    } catch (error) {
      return timeStr;
    }
  };

  // Handle changes in drug movement rows
  const handleDrugMovementChange = (index, field, value) => {
    const newMovements = [...formData.drug_movements];
    
    // Update the field
    newMovements[index][field] = value;
    
    // Special handling based on field type
    if (field === 'transactionType') {
      // Force exposure time to 0 for Out transactions
      if (value === 'Out') {
        newMovements[index].exposure_time = '0';
      } else if (value === 'In') {
        // Try to calculate exposure time for In transactions
        calculateExposureTime(newMovements, index);
      }
    } else if (field === 'date' || field === 'time') {
      // Recalculate exposure time when date or time changes (for In transactions)
      if (newMovements[index].transactionType === 'In') {
        calculateExposureTime(newMovements, index);
      }
    } else if (field === 'exposure_time') {
      // User is manually overriding exposure time for an In transaction
      // Just update the value directly (already done above)
    }
    
    // Calculate cumulative ET for all rows
    calculateCumulativeExposureTimes(newMovements);
    
    // Validate the data and update any warnings
    validateMovements(newMovements);
    
    // Update the state
    setFormData(prev => ({
      ...prev,
      drug_movements: newMovements
    }));
  };

  // Calculate exposure time for an In transaction based on time difference from previous Out
  const calculateExposureTime = (movements, index) => {
    // Skip for first row or Out transactions
    if (index === 0 || movements[index].transactionType !== 'In') {
      return;
    }
    
    // Find the previous Out transaction
    let previousOutIndex = -1;
    for (let i = index - 1; i >= 0; i--) {
      if (movements[i].transactionType === 'Out') {
        previousOutIndex = i;
        break;
      }
    }
    
    // If no previous Out found, we can't calculate
    if (previousOutIndex === -1) return;
    
    // Get date/time objects for calculation
    const currentDateTime = getDateTimeObject(movements[index].date, movements[index].time);
    const previousDateTime = getDateTimeObject(movements[previousOutIndex].date, movements[previousOutIndex].time);
    
    // Only calculate if both dates are valid
    if (currentDateTime && previousDateTime) {
      // Calculate time difference in minutes
      const diffMinutes = differenceInMinutes(currentDateTime, previousDateTime);
      
      // Ensure positive value
      const exposureTime = Math.max(0, diffMinutes);
      movements[index].exposure_time = exposureTime.toString();
    }
  };

  // Calculate cumulative exposure times for all rows
  const calculateCumulativeExposureTimes = (movements) => {
    let cumulativeET = 0;
    
    for (let i = 0; i < movements.length; i++) {
      // Add current exposure time to cumulative total
      cumulativeET += parseInt(movements[i].exposure_time) || 0;
      
      // Update the cumulative ET for this row
      movements[i].cumulative_et = cumulativeET.toString();
    }
  };

  // Validate movement data and generate warnings
  const validateMovements = (movements) => {
    const newWarnings = {};
    const newErrors = {};
    
    // Get limit values
    const temperTime = parseInt(formData.temper_time) || 0;
    const workingET = parseInt(formData.working_exposure_time) || 0;
    const maxET = parseInt(formData.max_exposure_time) || 0;
    
    let cumulativeET = 0;
    
    // Check each movement row
    for (let i = 0; i < movements.length; i++) {
      const movement = movements[i];
      const exposureTime = parseInt(movement.exposure_time) || 0;
      
      // Skip validation for incomplete rows
      if (!movement.date || !movement.time) continue;
      
      // For In transactions
      if (movement.transactionType === 'In') {
        // Check temper time (warning)
        if (exposureTime < temperTime && exposureTime > 0) {
          newWarnings[`movement_${i}_temper`] = `Exposure time (${exposureTime} min) is less than temper time (${temperTime} min)`;
        }
        
        // Check working exposure time (warning)
        if (exposureTime > workingET) {
          newWarnings[`movement_${i}_wet`] = `Exposure time (${exposureTime} min) exceeds working exposure time (${workingET} min)`;
        }
        
        // For Out transactions, exposure time must be 0 (error)
      } else if (movement.transactionType === 'Out' && exposureTime !== 0) {
        newErrors[`movement_${i}_out`] = `Exposure time for Out transactions must be 0`;
      }
      
      // Update cumulative ET
      cumulativeET += exposureTime;
      
      // Check cumulative exposure time against maximum (warning)
      if (cumulativeET > maxET) {
        newWarnings[`movement_${i}_cumulative`] = `Cumulative exposure time (${cumulativeET} min) exceeds maximum exposure time (${maxET} min)`;
      }
      
      // Check chronological order (error)
      if (i > 0) {
        const prevDateTime = getDateTimeObject(movements[i-1].date, movements[i-1].time);
        const currDateTime = getDateTimeObject(movement.date, movement.time);
        
        if (prevDateTime && currDateTime && currDateTime < prevDateTime) {
          newErrors[`movement_${i}_chrono`] = `Date/time must be after the previous entry`;
        }
      }
    }
    
    // Update state with new warnings and errors
    setWarnings(newWarnings);
    setErrors(newErrors);
  };

  // Add a new movement row
  const addDrugMovement = () => {
    // Get last movement
    const lastMovement = formData.drug_movements[formData.drug_movements.length - 1];
    
    // Default new transaction type to opposite of last one
    const nextType = lastMovement.transactionType === 'In' ? 'Out' : 'In';
    
    // Create new row with smart defaults
    const newMovement = {
      destination: '',
      date: lastMovement.date || '', // Use same date as last row
      time: '',
      transactionType: nextType,
      exposure_time: nextType === 'Out' ? '0' : '', // 0 for Out, blank for In
      cumulative_et: '',
      completed_by: '',
      verified_by: ''
    };
    
    // Add to state
    const updatedMovements = [...formData.drug_movements, newMovement];
    
    // Update state
    setFormData(prev => ({
      ...prev,
      drug_movements: updatedMovements
    }));
    
    // Recalculate and validate
    calculateCumulativeExposureTimes(updatedMovements);
    validateMovements(updatedMovements);
  };

  // Remove a movement row
  const removeDrugMovement = (index) => {
    // Don't allow removing the last or first row
    if (formData.drug_movements.length <= 1 || index === 0) {
      toast.warning(index === 0 
        ? "Cannot remove the first Out transaction"
        : "You need at least one drug movement row");
      return;
    }
    
    // Remove the row
    const updatedMovements = formData.drug_movements.filter((_, i) => i !== index);
    
    // Recalculate cumulative times
    calculateCumulativeExposureTimes(updatedMovements);
    
    // Revalidate
    validateMovements(updatedMovements);
    
    // Update state
    setFormData(prev => ({
      ...prev,
      drug_movements: updatedMovements
    }));
  };

  // Validate the entire form
  const validateForm = () => {
    let formIsValid = true;
    const formErrors = {};
    
    // Check required fields
    if (!formData.receiving_no) {
      formErrors.receiving_no = 'Please select a Receiving Number';
      formIsValid = false;
    }
    
    if (!formData.item_no) {
      formErrors.item_no = 'Please select an Item Number';
      formIsValid = false;
    }
    
    if (!formData.date_time_received) {
      formErrors.date_time_received = 'Please enter Date and Time Received';
      formIsValid = false;
    }
    
    if (!formData.container_no) {
      formErrors.container_no = 'Please enter Container Number';
      formIsValid = false;
    }
    
    if (!formData.record_created_by) {
      formErrors.record_created_by = 'Please enter Record Created By';
      formIsValid = false;
    }
    
    // Check drug movements for required fields
    formData.drug_movements.forEach((movement, index) => {
      if (!movement.date || !movement.time) {
        formErrors[`movement_${index}_datetime`] = 'Date and time required';
        formIsValid = false;
      }
    });
    
    // Update errors state
    setErrors({...errors, ...formErrors});
    
    // Show first error as toast
    if (!formIsValid) {
      const firstError = Object.values(formErrors)[0];
      toast.error(firstError);
      return false;
    }
    
    // If there are warnings, show confirmation
    if (Object.keys(warnings).length > 0) {
      toast.warning("There are warnings in your data. Please review before submitting.", {
        autoClose: 5000
      });
    }
    
    return formIsValid;
  };

  // Generate PDF
  const handleSubmit = async () => {
    // Validate form before submission
    if (!validateForm()) return;
    
    try {
      // Prepare data for PDF generation
      const pdfData = {
        'receiving_no': formData.receiving_no,
        'item_no': formData.item_no,
        'item_description': formData.item_description,
        'lot_no': formData.lot_no,
        'storage_conditions': formData.storage_conditions,
        'date_time_received': formData.date_time_received,
        'other_storage_conditions': formData.other_storage_conditions,
        'temp_device_alarm': formData.temp_device_alarm,
        'temp_device_deactivated': formData.temp_device_deactivated,
        'temp_device_returned': formData.temp_device_returned,
        'max_exposure_time': formData.max_exposure_time,
        'temper_time': formData.temper_time,
        'working_exposure_time': formData.working_exposure_time,
        'container_no': formData.container_no,
        'total_units_per_container': formData.total_units_per_container,
        'record_created_by': formData.record_created_by,
        'record_created_date': formData.record_created_date,
        'drug_movements': formData.drug_movements.filter(movement => 
          // Only include movements that have at least some data
          movement.date && movement.time
        )
      };

      // Call API to generate PDF
      const response = await api.post('/form/generate-pdf/519A', pdfData, {
        responseType: 'blob'
      });

      // Download PDF
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

  // Loading state
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
        <BackButton />
        
        {/* Basic Information Section */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SearchableSelect
              label="Receiving Number *"
              options={receivingOptions}
              value={formData.receiving_no}
              onChange={handleReceivingSelect}
              placeholder="Search receiving number..."
              required
              error={errors.receiving_no}
            />
            <SearchableSelect
              label="Item Number *"
              options={itemOptions}
              value={formData.item_no}
              onChange={handleItemSelect}
              placeholder="Search item number..."
              required
              error={errors.item_no}
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
                className={`mt-1 block w-full rounded-md border-gray-300 ${errors.date_time_received ? 'border-red-300' : ''}`}
                required
              />
              {errors.date_time_received && (
                <p className="text-red-500 text-sm mt-1">{errors.date_time_received}</p>
              )}
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
                className={`mt-1 block w-full rounded-md border-gray-300 ${errors.container_no ? 'border-red-300' : ''}`}
                required
              />
              {errors.container_no && (
                <p className="text-red-500 text-sm mt-1">{errors.container_no}</p>
              )}
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
                  className={`mt-1 block w-full rounded-md border-gray-300 ${errors.record_created_by ? 'border-red-300' : ''}`}
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
              {errors.record_created_by && (
                <p className="text-red-500 text-sm mt-1">{errors.record_created_by}</p>
              )}
            </div>
          </div>
          
          {/* Drug Movements Table */}
          <div className="border rounded-lg overflow-hidden shadow-sm mt-6">
            <div className="flex justify-between items-center bg-gray-100 px-4 py-3">
              <h3 className="text-lg font-medium text-gray-900">DRUG MOVEMENT:</h3>
              <button
                type="button"
                onClick={addDrugMovement}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Movement
              </button>
            </div>
            
            {/* Display current time limits for reference */}
            <div className="grid grid-cols-3 gap-2 bg-blue-50 p-3">
              <div className="text-blue-800">
                <span className="font-semibold">Temper Time:</span> {formData.temper_time} minutes
              </div>
              <div className="text-blue-800">
                <span className="font-semibold">Working Exposure Time:</span> {formData.working_exposure_time} minutes
              </div>
              <div className="text-blue-800">
                <span className="font-semibold">Maximum Exposure Time:</span> {formData.max_exposure_time} minutes
              </div>
            </div>
            
            {/* Table with horizontal scrolling */}
            <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
              <table className="w-full" style={{ tableLayout: 'fixed', minWidth: '1200px' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-64 p-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                      Destination/Comments
                    </th>
                    <th className="w-32 p-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                      In/Out
                    </th>
                    <th className="w-40 p-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                      Date
                    </th>
                    <th className="w-36 p-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                      Time
                    </th>
                    <th className="w-36 p-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                      ET (min)
                    </th>
                    <th className="w-36 p-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                      Cumulative ET
                    </th>
                    <th className="w-52 p-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                      Completed By/Date
                    </th>
                    <th className="w-52 p-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                      Verified By/Date
                    </th>
                    <th className="w-24 p-3 text-center text-xs font-medium border-gray-200">
                      Verified By/Date
                    </th>
                    <th className="w-24 p-3 text-center text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {formData.drug_movements.map((movement, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      {/* Destination */}
                      <td className="p-3 border-b border-gray-200">
                        <input
                          type="text"
                          value={movement.destination}
                          onChange={(e) => handleDrugMovementChange(index, 'destination', e.target.value)}
                          className="w-full border-gray-300 rounded-md"
                          placeholder="Enter destination or comments"
                        />
                      </td>
                      
                      {/* Transaction Type (In/Out) */}
                      <td className="p-3 border-b border-gray-200">
                        <select
                          value={movement.transactionType}
                          onChange={(e) => handleDrugMovementChange(index, 'transactionType', e.target.value)}
                          className={`w-full border-gray-300 rounded-md ${index === 0 ? 'bg-gray-100' : ''}`}
                          disabled={index === 0} // First row is always "Out"
                        >
                          <option value="Out">Out</option>
                          <option value="In">In</option>
                        </select>
                      </td>
                      
                      {/* Date */}
                      <td className="p-3 border-b border-gray-200">
                        <input
                          type="date"
                          value={movement.date}
                          onChange={(e) => handleDrugMovementChange(index, 'date', e.target.value)}
                          className={`w-full border-gray-300 rounded-md ${
                            errors[`movement_${index}_datetime`] || errors[`movement_${index}_chrono`] 
                              ? 'border-red-300' 
                              : ''
                          }`}
                        />
                        {errors[`movement_${index}_chrono`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`movement_${index}_chrono`]}</p>
                        )}
                      </td>
                      
                      {/* Time */}
                      <td className="p-3 border-b border-gray-200">
                        <input
                          type="time"
                          value={movement.time}
                          onChange={(e) => handleDrugMovementChange(index, 'time', e.target.value)}
                          className={`w-full border-gray-300 rounded-md ${
                            errors[`movement_${index}_datetime`] ? 'border-red-300' : ''
                          }`}
                        />
                      </td>
                      
                      {/* Exposure Time */}
                      <td className="p-3 border-b border-gray-200">
                        <input
                          type="number"
                          value={movement.exposure_time}
                          onChange={(e) => handleDrugMovementChange(index, 'exposure_time', e.target.value)}
                          className={`w-full border-gray-300 rounded-md ${
                            errors[`movement_${index}_out`] ? 'border-red-300' : ''
                          }`}
                          min="0"
                          readOnly={movement.transactionType === 'Out'} // Readonly for Out transactions
                        />
                        {errors[`movement_${index}_out`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`movement_${index}_out`]}</p>
                        )}
                        {warnings[`movement_${index}_wet`] && (
                          <p className="text-orange-500 text-xs mt-1">{warnings[`movement_${index}_wet`]}</p>
                        )}
                        {warnings[`movement_${index}_temper`] && (
                          <p className="text-yellow-500 text-xs mt-1">{warnings[`movement_${index}_temper`]}</p>
                        )}
                      </td>
                      
                      {/* Cumulative ET */}
                      <td className="p-3 border-b border-gray-200">
                        <input
                          type="text"
                          value={movement.cumulative_et}
                          readOnly
                          className={`w-full border-gray-300 rounded-md bg-gray-50 ${
                            warnings[`movement_${index}_cumulative`] ? 'border-orange-300 bg-orange-50' : ''
                          }`}
                        />
                        {warnings[`movement_${index}_cumulative`] && (
                          <p className="text-orange-500 text-xs mt-1">{warnings[`movement_${index}_cumulative`]}</p>
                        )}
                      </td>
                      
                      {/* Completed By */}
                      <td className="p-3 border-b border-gray-200">
                        <input
                          type="text"
                          value={movement.completed_by}
                          onChange={(e) => handleDrugMovementChange(index, 'completed_by', e.target.value)}
                          className="w-full border-gray-300 rounded-md"
                          placeholder="Name and initials"
                        />
                      </td>
                      
                      {/* Verified By */}
                      <td className="p-3 border-b border-gray-200">
                        <input
                          type="text"
                          value={movement.verified_by}
                          onChange={(e) => handleDrugMovementChange(index, 'verified_by', e.target.value)}
                          className="w-full border-gray-300 rounded-md"
                          placeholder="Name and initials"
                        />
                      </td>
                      
                      {/* Actions */}
                      <td className="p-3 border-b border-gray-200 text-center">
                        <button
                          type="button"
                          onClick={() => removeDrugMovement(index)}
                          className={`text-red-600 hover:text-red-800 ${index === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={index === 0} // Can't remove first row
                          title={index === 0 ? "Cannot remove initial Out transaction" : "Remove row"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Warning and instructional box */}
            <div className="bg-yellow-50 p-4 rounded-md mt-3 mb-3 mx-3">
              <h4 className="text-sm font-medium text-yellow-800">Notes:</h4>
              <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                <li>
                  Exposure Time <span className="font-bold">MUST NOT EXCEED</span> the Working Exposure Time
                </li>
                <li>
                  Cumulative Exposure Time <span className="font-bold">MUST NOT EXCEED</span> the Maximum Exposure Time
                </li>
                <li>
                  Out transactions occur when removing the product from storage
                </li>
                <li>
                  In transactions occur when returning the product to storage
                </li>
              </ul>
            </div>
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