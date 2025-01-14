// src/App.js
import React from 'react';  // Removed useEffect since we'll handle auth differently
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import EditDeleteTable from './components/EditDeleteTable';
import AddDataForm from './components/AddDataForm';
import Form520B from './components/forms/Form520B';
import Form501A519A from './components/forms/Form501A519A';
import 'react-toastify/dist/ReactToastify.css';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        {/* Root route */}
        <Route 
          path="/" 
          element={<Navigate to="/login" replace />} 
        />
        
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
          path="/edit-data" 
          element={
            <PrivateRoute>
              <EditDeleteTable />
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
              <Form501A519A />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/forms/519a" 
          element={
            <PrivateRoute>
              <Form501A519A />
            </PrivateRoute>
          } 
        />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;