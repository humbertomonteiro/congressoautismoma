import { Route, Routes } from "react-router-dom";

import PaymentForm from "../pages/PaymentForm";
import Home from "../pages/Home";
import AdminDashboard from "../pages/Admin";
import Private from "./Private";
import Auth from "../pages/Auth";

const RoutesApp = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/checkout" element={<PaymentForm />} />
      <Route path="/login" element={<Auth />} />
      <Route
        path="/dashboard"
        element={
          <Private>
            <AdminDashboard />
          </Private>
        }
      />
    </Routes>
  );
};

export default RoutesApp;
