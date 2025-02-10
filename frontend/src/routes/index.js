import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from '../components/LandingPage';
import AddDataForm from '../components/AddDataForm';
import EditDeleteTable from '../components/EditDeleteTable';
import Form520B from '../components/forms/Form520B';
import Form501A from '../components/forms/Form501A';
import Form519A from '../components/forms/Form519A';  
// import Form501A519A from '../components/forms/Form501A519A';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/add-data" element={<AddDataForm />} />
      <Route path="/edit-data" element={<EditDeleteTable />} />
      <Route path="/forms/520b" element={<Form520B />} />
      <Route path="/forms/501a" element={<Form501A />} />
      <Route path="/forms/519a" element={<Form519A />} />
    </Routes>
  );
};

export default AppRoutes;