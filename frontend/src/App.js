// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import ItemList from './components/ItemList';
import ItemEntryForm from './components/ItemEntryForm';
import UpdateItem from './components/UpdateItem';
import ReceivingData from './components/ReceivingData';
import GeneratePDF from './components/GeneratePDF';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [auth, setAuth] = useState(false);

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={5000} />
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<Login setAuth={setAuth} />} />

        {/* Landing Page as Dashboard after login */}
        <Route path="/" element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />

        {/* Item CRUD Routes */}
        <Route
          path="/items"
          element={
            <ProtectedRoute>
              <ItemList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-item"
          element={
            <ProtectedRoute roleRequired="Admin">
              <ItemEntryForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/update-item/:itemId"
          element={
            <ProtectedRoute roleRequired="Manager">
              <UpdateItem />
            </ProtectedRoute>
          }
        />

        {/* ReceivingData CRUD Route */}
        <Route
          path="/receiving"
          element={
            <ProtectedRoute>
              <ReceivingData />
            </ProtectedRoute>
          }
        />

        {/* Generate PDF Routes */}
        <Route
          path="/generate-pdf/520B"
          element={
            <ProtectedRoute>
              <GeneratePDF formType="520B" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/generate-pdf/501A"
          element={
            <ProtectedRoute>
              <GeneratePDF formType="501A" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/generate-pdf/519A"
          element={
            <ProtectedRoute>
              <GeneratePDF formType="519A" />
            </ProtectedRoute>
          }
        />

        {/* Registration Route */}
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
