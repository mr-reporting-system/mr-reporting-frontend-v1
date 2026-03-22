import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  // Check if a login token exists in localStorage
  // (Adjust 'authToken' to whatever key you used when saving the token during login)
  const isAuthenticated = localStorage.getItem('authToken');

  // If there is no token, kick them back to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If they have a token, let them access the child routes (like AdminLayout)
  return <Outlet />;
}