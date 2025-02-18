// src/components/AddDataForm.js
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { validateItemData, validateReceivingData } from '../utils/formValidation';
import api from '../api/axios';
import {
  CONTROLLED_OPTIONS,
  STUDY_TYPE_OPTIONS,
  UOM_OPTIONS,
  TEMP_CONDITIONS_OPTIONS,
  NCMR_OPTIONS,
  YES_NO_OPTIONS
} from '../constants/formOptions';
import Button from './common/Button';
import FormInput from './common/FormInput';

const AddDataForm = () => {
  const [activeTab, setActiveTab] = useState('items');
  const [itemData, setItemData] = useState({
    item_number: '',
    description: '',
    client: '',
    protocol_number: '',
    vendor: '',
    uom: '',
    controlled: '',
    temp_storage_conditions: '',
    other_storage_conditions: '',
    max_exposure_time: '',
    temper_time: '',
    working_exposure_time: '',
    vendor_code_rev: '',
    randomized: 'No',
    sequential_numbers: 'No',
    study_type: ''
  });
  const [receivingData, setReceivingData] = useState({
    receiving_no: '',
    item_id: '',
    tracking_number: '',
    lot_no: '',
    po_no: '',
    total_units_vendor: '',
    total_storage_containers: '',
    exp_date: '',
    ncmr: 'N/A',
    total_units_received: '',
    temp_device_in_alarm: 'No',
    temp_device_deactivated: 'No',
    temp_device_returned_to_courier: 'No',
    comments_for_520b: ''
  });
  const [errors, setErrors] = useState({});
  const [availableItems, setAvailableItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOptions = async () => {
    try {
      const response = await api.get('/item/numbers');

      const transformedItems = response.data.map(item => ({
          value: item.item_number,
          label: `${item.item_number} - ${item.description}`
        })) ;
      setAvailableItems(transformedItems);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Error loading item data');
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    if (activeTab === 'items') {
      setItemData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setReceivingData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }, [activeTab]);

  const checkDescription = useCallback(async (description) => {
    try {
      const response = await api.post('/item/check-description', { description });
      if (response.data.exists) {
        setErrors(prev => ({
          ...prev,
          description: 'This description already exists'
        }));
        return false;
      }
      setErrors(prev => ({
        ...prev,
        description: null
      }));
      return true;
    } catch (error) {
      console.error('Error checking description:', error);
      return false;
    }
  }, []);

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateItemData(itemData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fill in all required fields correctly');
      return;
    }

    if (itemData.description.length > 2) {
      const isDescriptionUnique = await checkDescription(itemData.description);
      if (!isDescriptionUnique) {
        toast.error('An item with this description already exists');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await api.post('/item/create', itemData);
      toast.success('Item added successfully');
      setItemData({
        item_number: '',
        description: '',
        client: '',
        protocol_number: '',
        vendor: '',
        uom: '',
        controlled: '',
        temp_storage_conditions: '',
        other_storage_conditions: '',
        max_exposure_time: '',
        temper_time: '',
        working_exposure_time: '',
        vendor_code_rev: '',
        randomized: 'No',
        sequential_numbers: 'No',
        study_type: ''
      });
      setErrors({});
      fetchOptions(); // Refresh available items after adding a new one
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceivingSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateReceivingData(receivingData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/receiving/create', receivingData);
      toast.success('Receiving data added successfully');
      setReceivingData({
        receiving_no: '',
        item_id: '',
        tracking_number: '',
        lot_no: '',
        po_no: '',
        total_units_vendor: '',
        total_storage_containers: '',
        exp_date: '',
        ncmr: 'N/A',
        total_units_received: '',
        temp_device_in_alarm: 'No',
        temp_device_deactivated: 'No',
        temp_device_returned_to_courier: 'No',
        comments_for_520b: ''
      });
      setErrors({});
    } catch (error) {
      toast.error('Failed to add receiving data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center space-x-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'items'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Add Item Data
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('receiving')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'receiving'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Add Receiving Data
          </motion.button>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            {activeTab === 'items' ? (
              <form onSubmit={handleItemSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    label="Item Number"
                    name="item_number"
                    value={itemData.item_number}
                    onChange={handleInputChange}
                    error={errors.item_number}
                    required
                  />
                  <FormInput
                    label="Description"
                    name="description"
                    value={itemData.description}
                    onChange={handleInputChange}
                    error={errors.description}
                    type="textarea"
                    required
                  />
                  <FormInput
                    label="Client"
                    name="client"
                    value={itemData.client}
                    onChange={handleInputChange}
                    error={errors.client}
                    required
                  />
                  <FormInput
                    label="Protocol Number"
                    name="protocol_number"
                    value={itemData.protocol_number}
                    onChange={handleInputChange}
                    error={errors.protocol_number}
                    required
                  />
                  <FormInput
                    label="Vendor"
                    name="vendor"
                    value={itemData.vendor}
                    onChange={handleInputChange}
                    error={errors.vendor}
                    required
                  />
                  <FormInput
                    label="UOM"
                    name="uom"
                    value={itemData.uom}
                    onChange={handleInputChange}
                    error={errors.uom}
                    type="select"
                    options={UOM_OPTIONS}
                    required
                  />
                  <FormInput
                    label="Controlled"
                    name="controlled"
                    value={itemData.controlled}
                    onChange={handleInputChange}
                    error={errors.controlled}
                    type="select"
                    options={CONTROLLED_OPTIONS}
                    required
                  />
                  <FormInput
                    label="Temperature Storage Conditions"
                    name="temp_storage_conditions"
                    value={itemData.temp_storage_conditions}
                    onChange={handleInputChange}
                    error={errors.temp_storage_conditions}
                    type="select"
                    options={TEMP_CONDITIONS_OPTIONS}
                    required
                  />
                  <FormInput
                    label="Other Storage Conditions"
                    name="other_storage_conditions"
                    value={itemData.other_storage_conditions}
                    onChange={handleInputChange}
                    error={errors.other_storage_conditions}
                  />
                  <FormInput
                    label="Max Exposure Time (hours)"
                    name="max_exposure_time"
                    type="number"
                    value={itemData.max_exposure_time}
                    onChange={handleInputChange}
                    error={errors.max_exposure_time}
                    required
                  />
                  <FormInput
                    label="Temper Time (hours)"
                    name="temper_time"
                    type="number"
                    value={itemData.temper_time}
                    onChange={handleInputChange}
                    error={errors.temper_time}
                    required
                  />
                  <FormInput
                    label="Working Exposure Time (hours)"
                    name="working_exposure_time"
                    type="number"
                    value={itemData.working_exposure_time}
                    onChange={handleInputChange}
                    error={errors.working_exposure_time}
                    required
                  />
                  <FormInput
                    label="Vendor Code Rev"
                    name="vendor_code_rev"
                    value={itemData.vendor_code_rev}
                    onChange={handleInputChange}
                    error={errors.vendor_code_rev}
                    required
                  />
                  <FormInput
                    label="Randomized"
                    name="randomized"
                    value={itemData.randomized}
                    onChange={handleInputChange}
                    error={errors.randomized}
                    type="select"
                    options={YES_NO_OPTIONS}
                    required
                  />
                  <FormInput
                    label="Sequential Numbers"
                    name="sequential_numbers"
                    value={itemData.sequential_numbers}
                    onChange={handleInputChange}
                    error={errors.sequential_numbers}
                    type="select"
                    options={YES_NO_OPTIONS}
                    required
                  />
                  <FormInput
                    label="Study Type"
                    name="study_type"
                    value={itemData.study_type}
                    onChange={handleInputChange}
                    error={errors.study_type}
                    type="select"
                    options={STUDY_TYPE_OPTIONS}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setItemData({
                      item_number: '',
                      description: '',
                      client: '',
                      protocol_number: '',
                      vendor: '',
                      uom: '',
                      controlled: '',
                      temp_storage_conditions: '',
                      other_storage_conditions: '',
                      max_exposure_time: '',
                      temper_time: '',
                      working_exposure_time: '',
                      vendor_code_rev: '',
                      randomized: 'No',
                      sequential_numbers: 'No',
                      study_type: ''
                    })}
                    disabled={isSubmitting}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                  >
                    Add Item
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleReceivingSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    label="Receiving Number"
                    name="receiving_no"
                    value={receivingData.receiving_no}
                    onChange={handleInputChange}
                    error={errors.receiving_no}
                    required
                  />
                  <FormInput
                    label="Item Number"
                    name="item_id"
                    value={receivingData.item_id}
                    onChange={handleInputChange}
                    type="select"
                    options={availableItems}
                    error={errors.item_id}
                    required
                  />
                  <FormInput
                    label="Tracking Number"
                    name="tracking_number"
                    value={receivingData.tracking_number}
                    onChange={handleInputChange}
                    error={errors.tracking_number}
                    required
                  />
                  <FormInput
                    label="Lot Number"
                    name="lot_no"
                    value={receivingData.lot_no}
                    onChange={handleInputChange}
                    error={errors.lot_no}
                    required
                  />
                  <FormInput
                    label="PO Number"
                    name="po_no"
                    value={receivingData.po_no}
                    onChange={handleInputChange}
                    error={errors.po_no}
                  />
                  <FormInput
                    label="Total Units (Vendor Count)"
                    name="total_units_vendor"
                    type="number"
                    value={receivingData.total_units_vendor}
                    onChange={handleInputChange}
                    error={errors.total_units_vendor}
                    required
                  />
                  <FormInput
                    label="Total Storage Containers"
                    name="total_storage_containers"
                    type="number"
                    value={receivingData.total_storage_containers}
                    onChange={handleInputChange}
                    error={errors.total_storage_containers}
                    required
                  />
                  <FormInput
                    label="Expiration Date"
                    name="exp_date"
                    type="date"
                    value={receivingData.exp_date}
                    onChange={handleInputChange}
                    error={errors.exp_date}
                  />
                  <FormInput
                    label="NCMR"
                    name="ncmr"
                    value={receivingData.ncmr}
                    onChange={handleInputChange}
                    type="select"
                    options={NCMR_OPTIONS}
                    error={errors.ncmr}
                  />
                  <FormInput
                    label="Total Units Received"
                    name="total_units_received"
                    type="number"
                    value={receivingData.total_units_received}
                    onChange={handleInputChange}
                    error={errors.total_units_received}
                    required
                  />
                  <FormInput
                    label="Temperature Device in Alarm"
                    name="temp_device_in_alarm"
                    value={receivingData.temp_device_in_alarm}
                    onChange={handleInputChange}
                    type="select"
                    options={YES_NO_OPTIONS}
                    error={errors.temp_device_in_alarm}
                  />
                  <FormInput
                    label="Temperature Device Deactivated"
                    name="temp_device_deactivated"
                    value={receivingData.temp_device_deactivated}
                    onChange={handleInputChange}
                    type="select"
                    options={YES_NO_OPTIONS}
                    error={errors.temp_device_deactivated}
                  />
                  <FormInput
                    label="Temperature Device Returned to Courier"
                    name="temp_device_returned_to_courier"
                    value={receivingData.temp_device_returned_to_courier}
                    onChange={handleInputChange}
                    type="select"
                    options={YES_NO_OPTIONS}
                    error={errors.temp_device_returned_to_courier}
                  />
                  <FormInput
                    label="Comments for 520B"
                    name="comments_for_520b"
                    value={receivingData.comments_for_520b}
                    onChange={handleInputChange}
                    type="textarea"
                    error={errors.comments_for_520b}
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setReceivingData({
                      receiving_no: '',
                      item_id: '',
                      tracking_number: '',
                      lot_no: '',
                      po_no: '',
                      total_units_vendor: '',
                      total_storage_containers: '',
                      exp_date: '',
                      ncmr: 'N/A',
                      total_units_received: '',
                      temp_device_in_alarm: 'No',
                      temp_device_deactivated: 'No',
                      temp_device_returned_to_courier: 'No',
                      comments_for_520b: ''
                    })}
                    disabled={isSubmitting}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                  >
                    Add Receiving Data
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default React.memo(AddDataForm);