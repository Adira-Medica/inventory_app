// src/utils/dateUtils.js
export const validateDateFormat = (dateString) => {
  const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
  return regex.test(dateString);
};

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
};