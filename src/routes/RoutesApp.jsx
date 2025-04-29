import { Route, Routes } from "react-router-dom";

import PaymentForm from "../pages/PaymentForm";
import Home from "../pages/Home";
import AdminDashboard from "../pages/Admin";
import Private from "./Private";
import Auth from "../pages/Auth";
import Scanner from "../components/admin/Scanner";
import ThankYouPage from "../pages/ThankYouPage";
import HomeWhastsapp from "../pages/HomeWhatsapp";

const RoutesApp = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/whatsapp" element={<HomeWhastsapp />} />
      <Route path="/checkout" element={<PaymentForm />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/thanks-you" element={<ThankYouPage />} />
      <Route path="/scanner" element={<Scanner />} />
      <Route
        path="/dashboard"
        element={
          <Private>
            <AdminDashboard />
          </Private>
        }
      />
      <Route path="*" element={<Home />} />
    </Routes>
  );
};

export default RoutesApp;
