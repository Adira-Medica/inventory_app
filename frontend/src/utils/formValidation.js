// src/utils/formValidation.js

export const validateItemData = (values) => {
  const errors = {};
  
  // Item number validation
  if (!values.item_number) {
    errors.item_number = 'Item number is required';
  } else if (!/^[A-Z]{1,2}\d{6}$/.test(values.item_number)) {
    errors.item_number = 'Item number format should be like D200001 or NP200002';
  }
  
  // Description validation
  if (!values.description) {
    errors.description = 'Description is required';
  } else if (values.description.trim().length < 3) {
    errors.description = 'Description must be at least 3 characters long';
  } else if (values.description.trim().length > 200) {
    errors.description = 'Description must be 200 characters or less';
  }
  
  // Client validation
  if (!values.client) {
    errors.client = 'Client is required';
  } else if (values.client.trim().length > 100) {
    errors.client = 'Client name must be 100 characters or less';
  }
  
  // Protocol number validation
  if (!values.protocol_number) {
    errors.protocol_number = 'Protocol number is required';
  } else if (values.protocol_number.trim().length > 50) {
    errors.protocol_number = 'Protocol number must be 50 characters or less';
  }
  
  // Vendor validation
  if (!values.vendor) {
    errors.vendor = 'Vendor is required';
  } else if (values.vendor.trim().length > 100) {
    errors.vendor = 'Vendor name must be 100 characters or less';
  }
  
  // UOM validation
  if (!values.uom) {
    errors.uom = 'UOM is required';
  } else if (values.uom.trim().length > 50) {
    errors.uom = 'UOM must be 50 characters or less';
  }
  
  // Controlled status validation
  if (!values.controlled) {
    errors.controlled = 'Controlled status is required';
  } else if (values.controlled.trim().length > 50) {
    errors.controlled = 'Controlled status must be 50 characters or less';
  }
  
  // Temperature storage conditions validation
  if (!values.temp_storage_conditions) {
    errors.temp_storage_conditions = 'Temperature storage conditions are required';
  } else if (values.temp_storage_conditions.trim().length > 50) {
    errors.temp_storage_conditions = 'Temperature storage conditions must be 50 characters or less';
  }
  
  // Other storage conditions validation (optional field)
  if (values.other_storage_conditions && values.other_storage_conditions.trim().length > 50) {
    errors.other_storage_conditions = 'Other storage conditions must be 50 characters or less';
  }
  
  // Numeric fields validation
  if (!values.max_exposure_time) {
    errors.max_exposure_time = 'Max exposure time is required';
  } else if (isNaN(values.max_exposure_time) || parseInt(values.max_exposure_time) < 0) {
    errors.max_exposure_time = 'Max exposure time must be a positive number';
  }
  
  if (!values.temper_time) {
    errors.temper_time = 'Temper time is required';
  } else if (isNaN(values.temper_time) || parseInt(values.temper_time) < 0) {
    errors.temper_time = 'Temper time must be a positive number';
  }
  
  if (!values.working_exposure_time) {
    errors.working_exposure_time = 'Working exposure time is required';
  } else if (isNaN(values.working_exposure_time) || parseInt(values.working_exposure_time) < 0) {
    errors.working_exposure_time = 'Working exposure time must be a positive number';
  }
  
  // Vendor code revision validation
  if (!values.vendor_code_rev) {
    errors.vendor_code_rev = 'Vendor code revision is required';
  } else if (values.vendor_code_rev.trim().length > 50) {
    errors.vendor_code_rev = 'Vendor code revision must be 50 characters or less';
  }
  
  // Study type validation
  if (!values.study_type) {
    errors.study_type = 'Study type is required';
  } else if (values.study_type.trim().length > 50) {
    errors.study_type = 'Study type must be 50 characters or less';
  }
  
  return errors;
};

export const validateReceivingData = (values) => {
  const errors = {};
  
  // Receiving number validation
  if (!values.receiving_no) {
    errors.receiving_no = 'Receiving number is required';
  } else if (!/^L\d{9}$/.test(values.receiving_no)) {
    errors.receiving_no = 'Receiving number must start with L followed by 9 digits';
  }
  
  // Item ID validation
  if (!values.item_id) {
    errors.item_id = 'Item number is required';
  }
  
  // Tracking number validation
  if (!values.tracking_number) {
    errors.tracking_number = 'Tracking number is required';
  } else if (values.tracking_number.trim().length > 50) {
    errors.tracking_number = 'Tracking number must be 50 characters or less';
  }
  
  // Lot number validation
  if (!values.lot_no) {
    errors.lot_no = 'Lot number is required';
  } else if (values.lot_no.trim().length > 50) {
    errors.lot_no = 'Lot number must be 50 characters or less';
  }
  
  // PO number validation (optional)
  if (values.po_no && values.po_no.trim().length > 50) {
    errors.po_no = 'PO number must be 50 characters or less';
  }
  
  // Total units vendor validation
  if (!values.total_units_vendor) {
    errors.total_units_vendor = 'Total units (vendor count) is required';
  } else if (isNaN(values.total_units_vendor) || parseInt(values.total_units_vendor) < 0) {
    errors.total_units_vendor = 'Total units must be a positive number';
  }
  
  // Total storage containers validation
  if (!values.total_storage_containers) {
    errors.total_storage_containers = 'Total storage containers is required';
  } else if (isNaN(values.total_storage_containers) || parseInt(values.total_storage_containers) < 0) {
    errors.total_storage_containers = 'Total storage containers must be a positive number';
  }
  
  // Total units received validation
  if (!values.total_units_received) {
    errors.total_units_received = 'Total units received is required';
  } else if (isNaN(values.total_units_received) || parseInt(values.total_units_received) < 0) {
    errors.total_units_received = 'Total units received must be a positive number';
  } else if (parseInt(values.total_units_received) > parseInt(values.total_units_vendor)) {
    errors.total_units_received = 'Total units received cannot exceed total units from vendor';
  }
  
  // Expiration date validation
  if (values.exp_date) {
    const expDate = new Date(values.exp_date);
    const today = new Date();
    if (isNaN(expDate.getTime())) {
      errors.exp_date = 'Invalid date format';
    } else if (expDate < today) {
      errors.exp_date = 'Expiration date cannot be in the past';
    }
  }
  
  // Comments validation (optional)
  if (values.comments_for_520b && values.comments_for_520b.trim().length > 200) {
    errors.comments_for_520b = 'Comments must be 200 characters or less';
  }
  
  return errors;
};