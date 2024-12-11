import * as Yup from 'yup';
import { validateDateFormat } from './dateUtils';


export const itemValidationSchema = Yup.object({
  item_number: Yup.string()
    .required('Item number is required')
    .matches(/^[A-Za-z0-9-]+$/, 'Only alphanumeric characters and hyphens allowed'),
  description: Yup.string()
    .required('Description is required')
    .max(200, 'Description must be 200 characters or less'),
  client: Yup.string().required('Client is required'),
  protocol_number: Yup.string().required('Protocol number is required'),
  vendor: Yup.string().required('Vendor is required'),
  controlled: Yup.string().required('Controlled status is required'),
  study_type: Yup.string().required('Study type is required'),
});

export const receivingValidationSchema = Yup.object({
  receiving_no: Yup.string()
    .required('Receiving number is required')
    .matches(/^L\d{9}$/, 'Must start with L followed by 9 digits'),
  tracking_number: Yup.string().required('Tracking number is required'),
  lot_no: Yup.string().required('Lot number is required'),
  total_units_vendor: Yup.number()
    .required('Total units is required')
    .min(0, 'Must be 0 or greater'),
});

export const validateForm520B = (values) => {
  const errors = {};
  
  if (!values.ItemNo) errors.ItemNo = 'Item number is required';
  if (!values.ReceivingNo) errors.ReceivingNo = 'Receiving number is required';
  if (!values.TrackingNo) errors.TrackingNo = 'Tracking number is required';
  if (!values.ClientName) errors.ClientName = 'Client name is required';
  
  if (values.dateType && !values.dateValue) {
    errors.dateValue = `${values.dateType} is required`;
  }
  
  if (values.dateValue && !validateDateFormat(values.dateValue)) {
    errors.dateValue = 'Date must be in MM/DD/YYYY format';
  }
  
  return errors;
};