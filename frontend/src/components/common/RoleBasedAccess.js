// src/components/common/RoleBasedAccess.js
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const RoleBasedAccess = ({ allowedRoles, children, fallback = null }) => {
  const { user } = useAuth();
  
  // If no user or role, don't render children
  if (!user || !user.role) {
    return fallback;
  }
  
  // Check if user role is included in allowedRoles
  if (allowedRoles.includes(user.role)) {
    return children;
  }
  
  // Not authorized, render fallback
  return fallback;
};

export default RoleBasedAccess;