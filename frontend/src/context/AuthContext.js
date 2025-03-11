// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user data from JWT on startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      parseUserFromToken(token);
    } else {
      setLoading(false);
    }
  }, []);
  
  // Parse user data from JWT token
  const parseUserFromToken = (token) => {
    try {
      // Simple parsing of JWT payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      if (payload.exp * 1000 < Date.now()) {
        // Token expired
        localStorage.removeItem('token');
        setUser(null);
      } else {
        // Valid token, set user data
        setUser({
          id: payload.sub?.id || payload.sub,
          username: payload.sub?.username || '',
          role: payload.sub?.role || ''
        });
      }
    } catch (error) {
      console.error('Error parsing token:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Login function
  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        setUser({
          id: response.data.user.id,
          username: response.data.user.username,
          role: response.data.user.role
        });
        return { success: true };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        const errorMessage = error.response.data.error;
        
        if (errorMessage.includes('pending admin approval')) {
          return { 
            success: false, 
            status: 'pending', 
            message: 'Your account is pending approval from an administrator. Please try again later.' 
          };
        } else if (errorMessage.includes('deactivated')) {
          return { 
            success: false, 
            status: 'inactive', 
            message: 'Your account has been deactivated. Please contact an administrator.' 
          };
        }
      }
      
      toast.error(error.response?.data?.error || 'Login failed');
      return { 
        success: false, 
        message: error.response?.data?.error || 'Login failed. Please check your credentials.' 
      };
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      // Call the backend logout endpoint
      await api.post('/auth/logout');
      console.log('Logged out on server');
    } catch (error) {
      console.error('Error logging out on server:', error);
      // Continue with logout even if the server request fails
    } finally {
      // Remove token and user data from local storage
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};