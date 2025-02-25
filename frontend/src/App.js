// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './components/Login';
import LandingPage from './components/LandingPage';
import AddDataForm from './components/AddDataForm';
import EditDeleteTable from './components/EditDeleteTable';
import Form520B from './components/forms/Form520B';
import Form501A from './components/forms/Form501A';
import Form519A from './components/forms/Form519A';
import PrivateRoute from './components/common/PrivateRoute';

function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Public route */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route 
          path="/landing" 
          element={
            <PrivateRoute>
              <LandingPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/add-data" 
          element={
            <PrivateRoute>
              <AddDataForm />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/edit-data" 
          element={
            <PrivateRoute>
              <EditDeleteTable />
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
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;