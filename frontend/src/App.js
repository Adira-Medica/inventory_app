// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import LandingPage from './components/LandingPage';
import AddDataForm from './components/AddDataForm';
import EditDeleteTable from './components/EditDeleteTable';
import AddReceivingOnly from './components/AddReceivingOnly';
import Form520B from './components/forms/Form520B';
import Form501A from './components/forms/Form501A';
import Form519A from './components/forms/Form519A';
import AdminDashboard from './components/admin/AdminDashboard';
import ViewOnlyTable from './components/ViewOnlyTable';
import PrivateRoute from './components/common/PrivateRoute';
import RoleProtectedRoute from './components/common/RoleProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <ToastContainer />
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
       
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
       
        {/* Protected routes for all authenticated users */}
        <Route
          path="/landing"
          element={
            <PrivateRoute>
              <LandingPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/forms/520b"
          element={
            <PrivateRoute>
              <Form520B />
            </PrivateRoute>
          }
        />
        <Route
          path="/forms/501a"
          element={
            <PrivateRoute>
              <Form501A />
            </PrivateRoute>
          }
        />
        <Route
          path="/forms/519a"
          element={
            <PrivateRoute>
              <Form519A />
            </PrivateRoute>
          }
        />
       
        {/* User-only view data route */}
        <Route
          path="/view-data"
          element={
            <RoleProtectedRoute allowedRoles={['user']}>
              <ViewOnlyTable />
            </RoleProtectedRoute>
          }
        />
       
        {/* Admin-only route for adding both items and receiving data */}
        <Route
          path="/add-data"
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <AddDataForm />
            </RoleProtectedRoute>
          }
        />
        
        {/* Manager-only routes for view-only item access */}
        <Route
          path="/view-items"
          element={
            <RoleProtectedRoute allowedRoles={['manager']}>
              <ViewOnlyTable />
            </RoleProtectedRoute>
          }
        />
        
        {/* Manager-only route for adding receiving data */}
        <Route
          path="/add-receiving"
          element={
            <RoleProtectedRoute allowedRoles={['manager']}>
              <AddReceivingOnly />
            </RoleProtectedRoute>
          }
        />
        
        {/* Manager and admin route for data management */}
        <Route
          path="/edit-data"
          element={
            <RoleProtectedRoute allowedRoles={['manager', 'admin']}>
              <EditDeleteTable />
            </RoleProtectedRoute>
          }
        />
       
        {/* Admin-only routes */}
        <Route
          path="/admin"
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleProtectedRoute>
          }
        />
       
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;