// src/api/axios.js
import axios from 'axios';

// Configure Axios instance with base URL for backend API
const instance = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;
