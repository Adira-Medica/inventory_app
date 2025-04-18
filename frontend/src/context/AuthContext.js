// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimer, setSessionTimer] = useState(null);
  const [warningTimer, setWarningTimer] = useState(null);

  const [sessionConfig, setSessionConfig] = useState({
    sessionTimeoutMinutes: 30,
    sessionTimeoutWarningMinutes: 5
  });

  // ✅ Fix: Fetch settings only once when the app loads (not every time `user` changes)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchSessionConfig = async () => {
      try {
        const response = await api.get('/admin/settings');
        if (response.data && response.data.sessionTimeout) {
          setSessionConfig({
            sessionTimeoutMinutes: response.data.sessionTimeout,
            sessionTimeoutWarningMinutes: Math.min(5, response.data.sessionTimeout / 4)
          });
        }
      } catch (error) {
        console.error('Error fetching session settings:', error);
      }
    };

    fetchSessionConfig();
  }, []); // ✅ Only run once on initial mount

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      parseUserFromToken(token);
      setupSessionTimers();
    } else {
      setLoading(false);
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    const refreshSession = () => {
      if (user) {
        setupSessionTimers();
      }
    };

    events.forEach(event => {
      window.addEventListener(event, refreshSession, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, refreshSession);
      });

      if (sessionTimer) clearTimeout(sessionTimer);
      if (warningTimer) clearTimeout(warningTimer);
    };
  }, [user]);

  const parseUserFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        setUser(null);
      } else {
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

  const setupSessionTimers = () => {
    if (sessionTimer) clearTimeout(sessionTimer);
    if (warningTimer) clearTimeout(warningTimer);

    const { sessionTimeoutMinutes, sessionTimeoutWarningMinutes } = sessionConfig;

    const newWarningTimer = setTimeout(() => {
      toast.warning(`Your session will expire in ${sessionTimeoutWarningMinutes} minutes.`, {
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        draggable: false,
        position: "top-center",
        toastId: "session-warning",
        action: () => (
          <button
            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            onClick={extendSession}
          >
            Extend Session
          </button>
        )
      });
    }, (sessionTimeoutMinutes - sessionTimeoutWarningMinutes) * 60 * 1000);

    const newSessionTimer = setTimeout(() => {
      localStorage.removeItem('token');
      setUser(null);
      toast.dismiss("session-warning");
      toast.error("Your session has expired. Please log in again.");
      window.location.href = '/login';
    }, sessionTimeoutMinutes * 60 * 1000);

    setWarningTimer(newWarningTimer);
    setSessionTimer(newSessionTimer);
  };

  const extendSession = async () => {
    try {
      const response = await api.post('/auth/extend-session');
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        toast.dismiss("session-warning");
        toast.success("Session extended successfully");
        setupSessionTimers();
      }
    } catch (error) {
      console.error('Error extending session:', error);
      toast.dismiss("session-warning");
    }
  };

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
        setupSessionTimers();
        return { success: true };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (error) {
      console.error('Login error:', error);

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

      if (error.response?.status === 429) {
        return {
          success: false,
          lockout: true,
          message: error.response.data.error || 'Too many failed attempts. Account temporarily locked.'
        };
      }

      toast.error(error.response?.data?.error || 'Login failed');
      return {
        success: false,
        message: error.response?.data?.error || 'Login failed. Please check your credentials.'
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      console.log('Logged out on server');
    } catch (error) {
      console.error('Error logging out on server:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);

      if (sessionTimer) clearTimeout(sessionTimer);
      if (warningTimer) clearTimeout(warningTimer);
      setSessionTimer(null);
      setWarningTimer(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    extendSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
