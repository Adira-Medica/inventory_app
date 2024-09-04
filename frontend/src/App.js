// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/Login';
import ItemList from './components/ItemList';
import ItemEntryForm from './components/ItemEntryForm';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [auth, setAuth] = useState(false);

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={5000} />
      <Routes>
        <Route path="/login" element={<Login setAuth={setAuth} />} />
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
      </Routes>
    </Router>
  );
}

export default App;
