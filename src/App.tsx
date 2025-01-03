import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import Login from './pages/Login';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import PayrollGeneration from './pages/PayrollGeneration';
import Advances from './pages/Advances';
import Users from './pages/Users';
import { UserRole } from './types/domain/user';
import RoleGuard from './components/RoleGuard';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
          <Route index element={<Navigate to="/employees" replace />} />
          <Route path="employees" element={<Employees />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="payroll" element={<PayrollGeneration />} />
          <Route path="advances" element={<Advances />} />
          <Route 
            path="users" 
            element={
              <RoleGuard requiredRole={UserRole.ADMIN}>
                <Users />
              </RoleGuard>
            } 
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;