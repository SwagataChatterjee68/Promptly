import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/authContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  // 1. Show loading spinner while checking API
  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={40} color="#0fbda6" />
      </div>
    );
  }

  // 2. If user exists, show content. If not, login.
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export const PublicRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or a spinner
  }

  // If user exists, prevent access to Login/Register
  return user ? <Navigate to="/" replace /> : <Outlet />;
};