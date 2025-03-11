// src/api/axios.js
import axios from 'axios';

// Create axios instance with base URL and default headers
const api = axios.create({
  // This ensures the API calls go to the right endpoint
  baseURL: process.env.REACT_APP_API_URL || '', // Remove '/api' as it might be duplicating the prefix
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Log outgoing requests for debugging
    console.log(`Making ${config.method.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request configuration error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log(`Response from ${response.config.url}:`, response.status);
    console.log('Response data:', response.data);
    return response;
  },
  (error) => {
    // Log all API errors for debugging
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    console.error('Failed request URL:', error.config?.url);
    
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      // If we get unauthorized, clear token if it exists
      const token = localStorage.getItem('token');
      if (token) {
        console.warn('Token expired or invalid, logging out');
        localStorage.removeItem('token');
        window.location.href = '/login'; // Redirect to login
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;