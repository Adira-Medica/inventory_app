// src/App.js
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import AppRoutes from './routes';
import 'react-toastify/dist/ReactToastify.css';
import './styles/globals.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <ToastContainer />
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;