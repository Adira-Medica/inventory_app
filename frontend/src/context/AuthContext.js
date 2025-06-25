// src/context/AuthContext.js - Fixed infinite loop issue
import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
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

  // ✅ Use refs to track timers and prevent stale closures
  const sessionTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const isInitializedRef = useRef(false);

  // ✅ Fix: Fetch settings only once when the app loads
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

  // ✅ CRITICAL FIX: Memoize parseUserFromToken to prevent recreation
  const parseUserFromToken = useCallback((token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      console.log('🔍 JWT Payload Debug:', payload);
      
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        setUser(null);
        return false;
      } else {
        // Extract user data from multiple possible JWT structures
        let userId = null;
        let username = null;
        let userRole = null;

        // Method 1: Check if it's the new structure (role in root)
        if (payload.role) {
          userId = payload.sub; // User ID is in 'sub'
          username = payload.username; // Username in root
          userRole = payload.role; // Role in root
        }
        // Method 2: Check if it's the old structure (role in sub object)
        else if (payload.sub && typeof payload.sub === 'object') {
          userId = payload.sub.id;
          username = payload.sub.username;
          userRole = payload.sub.role;
        }
        // Method 3: Fallback - sub is just user ID
        else {
          userId = payload.sub;
          username = payload.username || '';
          userRole = payload.role || '';
        }

        const userData = {
          id: userId,
          username: username || '',
          role: userRole || ''
        };

        console.log('👤 User Data Extracted:', userData);
        setUser(userData);
        return true;
      }
    } catch (error) {
      console.error('Error parsing token:', error);
      localStorage.removeItem('token');
      setUser(null);
      return false;
    }
  }, []); // Empty dependency array - this function doesn't depend on any state

  // ✅ CRITICAL FIX: Memoize setupSessionTimers and use refs
  const setupSessionTimers = useCallback(() => {
    // Clear existing timers
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }

    const { sessionTimeoutMinutes, sessionTimeoutWarningMinutes } = sessionConfig;

    // Set warning timer
    warningTimerRef.current = setTimeout(() => {
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

    // Set session timeout timer
    sessionTimerRef.current = setTimeout(() => {
      localStorage.removeItem('token');
      setUser(null);
      toast.dismiss("session-warning");
      toast.error("Your session has expired. Please log in again.");
      window.location.href = '/login';
    }, sessionTimeoutMinutes * 60 * 1000);

    // Update state for external access (optional)
    setWarningTimer(warningTimerRef.current);
    setSessionTimer(sessionTimerRef.current);
  }, [sessionConfig]); // Only depend on sessionConfig

  // ✅ CRITICAL FIX: Split initialization and activity monitoring
  useEffect(() => {
    // Initial token check - only run once
    if (!isInitializedRef.current) {
      const token = localStorage.getItem('token');
      if (token) {
        const isValid = parseUserFromToken(token);
        if (isValid) {
          setupSessionTimers();
        }
      }
      setLoading(false);
      isInitializedRef.current = true;
    }
  }, [parseUserFromToken, setupSessionTimers]);

  // ✅ SEPARATE EFFECT: Activity monitoring (only when user exists)
  useEffect(() => {
    if (!user || !isInitializedRef.current) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    
    const refreshSession = () => {
      setupSessionTimers();
    };

    // Add event listeners for user activity
    events.forEach(event => {
      window.addEventListener(event, refreshSession, { passive: true });
    });

    // Cleanup function
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, refreshSession);
      });
    };
  }, [user, setupSessionTimers]); // This is safe now because setupSessionTimers is memoized

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, []);

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
      setLoading(true);
      const response = await api.post('/auth/login', credentials);
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        // Set user data from login response (most reliable)
        const userData = {
          id: response.data.user.id,
          username: response.data.user.username,
          role: response.data.user.role
        };
        
        console.log('🔑 Login successful, user set:', userData);
        setUser(userData);
        setupSessionTimers();
        setLoading(false);
        return { success: true };
      }
      setLoading(false);
      return { success: false, message: 'Invalid response from server' };
    } catch (error) {
      setLoading(false);
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

      // Clear timers using refs
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      
      setSessionTimer(null);
      setWarningTimer(null);
    }
  };

  // ✅ Memoize context value to prevent unnecessary re-renders
  const value = React.useMemo(() => ({
    user,
    loading,
    login,
    logout,
    extendSession
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};