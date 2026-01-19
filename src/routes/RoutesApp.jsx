import { Route, Routes } from "react-router-dom";

import PaymentForm from "../pages/PaymentForm";
import Home from "../pages/Home";
import AdminDashboard from "../pages/Admin";
import Private from "./Private";
import Auth from "../pages/Auth";
import Scanner from "../components/admin/Scanner";
import ThankYouPage from "../pages/ThankYouPage";
// import HomeWhastsapp from "../pages/HomeWhatsapp";
import Tickets from "../pages/Tickets";
import CertificateHome from "../components/certificateGenerator/CertificateHome";
import Certificate from "../pages/Certificate";

import FormRegisterSalud from "../pages/FormRegisterSalud";

const RoutesApp = () => {
  return (
    <Routes>
      <Route path="/" element={<Home wpp={false} />} />
      <Route path="/whatsapp" element={<Home wpp={true} />} />
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
      <Route
        path="/certificate"
        element={
          <Private>
            <Certificate />
          </Private>
        }
      />
      <Route path="/ingressos" element={<Tickets />} />
      <Route path="/certificado" element={<CertificateHome />} />
      <Route
        path="/certificado-comissao-cientifica"
        element={<CertificateHome />}
      />
      <Route path="/certificado-monitoria" element={<CertificateHome />} />
      <Route
        path="/certificado-comissao-organizadora"
        element={<CertificateHome />}
      />
      <Route path="/formulario-pre-inscricao" element={<FormRegisterSalud />} />

      <Route path="*" element={<Home />} />
    </Routes>
  );
};

export default RoutesApp;
