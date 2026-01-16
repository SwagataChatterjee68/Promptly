import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import AuthProvider
import { AuthProvider } from "./context/authContext";

import Register from "./components/register/Register";
import Login from "./components/login/Login";
import Home from "./components/home/Home";
import { ProtectedRoute, PublicRoute } from "./AuthWrapper";

const AppRoutes = () => {
  return (
    // Wrap everything in AuthProvider
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" />
        <Routes>
          
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
          </Route>

          <Route path="*" element={<Login />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRoutes;