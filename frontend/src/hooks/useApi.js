import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';

export const useApi = () => {
  const navigate = useNavigate();

  const handleError = useCallback((error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      navigate('/login');
      toast.error('Session expired. Please login again.');
    }
    throw error;
  }, [navigate]);

  const get = useCallback(async (url, config = {}) => {
    try {
      const response = await api.get(url, config);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }, [handleError]);

  const post = useCallback(async (url, data, config = {}) => {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }, [handleError]);

  const put = useCallback(async (url, data, config = {}) => {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }, [handleError]);

  const del = useCallback(async (url, config = {}) => {
    try {
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }, [handleError]);

  return { get, post, put, delete: del };
};