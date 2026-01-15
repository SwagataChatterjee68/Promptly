import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Register from "./components/register/Register";
import Login from "./components/login/Login";
import Home from "./components/home/Home";

export const AppRoutes = () => {
  return (
   
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
  );
};
