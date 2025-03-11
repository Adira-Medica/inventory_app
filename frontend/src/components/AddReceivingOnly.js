// src/components/AddReceivingOnly.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { validateReceivingData } from '../utils/formValidation';
import api from '../api/axios';
import {
  NCMR_OPTIONS,
  YES_NO_OPTIONS
} from '../constants/formOptions';
import Button from './common/Button';
import FormInput from './common/FormInput';
import BackButton from './common/BackButton';

const AddReceivingOnly = () => {
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
    ncmr2: 'N/A',
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReceivingData(prev => ({
      ...prev,
      [name]: value
    }));
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
        ncmr2: 'N/A',
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Add Receiving Data</h2>
          <BackButton />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
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
                error={errors.item_number}
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
                label="NCMR2"
                name="ncmr2"
                value={receivingData.ncmr2}
                onChange={handleInputChange}
                type="select"
                options={YES_NO_OPTIONS}
                error={errors.ncmr2}
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
                  ncmr2: 'N/A',
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
        </motion.div>
      </div>
    </div>
  );
};

export default AddReceivingOnly;