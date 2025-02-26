// src/components/common/RoleProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';

const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    toast.error('Please log in to access this page');
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (!allowedRoles.includes(user.role)) {
    toast.error(`Unauthorized: Your role (${user.role}) doesn't have access to this feature`);
    return <Navigate to="/landing" replace />;
  }

  // User is authenticated and has the required role
  return children;
};

export default RoleProtectedRoute;