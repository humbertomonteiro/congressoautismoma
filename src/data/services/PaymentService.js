// src/services/PaymentService.js
import axios from "axios";
import { auth } from "../../../firebaseConfig";

const isProduction = import.meta.env.VITE_ENV === "production";
const baseUrl = isProduction
  ? import.meta.env.VITE_BASE_URL_PRODUCTION
  : import.meta.env.VITE_BASE_URL_SANDBOX;

async function getAuthHeaders() {
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

class PaymentService {
  static WHATSAPP_NUMBER = "+559888259214";

  async processCreditCardPayment(paymentData) {
    try {
      const response = await axios.post(
        `${baseUrl}/payments/credit`,
        paymentData
      );
      const { success, message, data } = response.data;
      if (!success) throw new Error(message);
      return { success, message, ...data };
    } catch (error) {
      console.error("Erro ao processar pagamento com cartão:", error);
      throw new Error(
        error.response?.data?.error || "Erro ao processar pagamento com cartão"
      );
    }
  }

  async processPixPayment(paymentData) {
    try {
      const response = await axios.post(`${baseUrl}/payments/pix`, paymentData);
      const { success, message, data } = response.data;
      if (!success) throw new Error(message);
      return { success, message, ...data };
    } catch (error) {
      console.error("Erro ao processar Pix:", error);
      throw new Error(error.response?.data?.error || "Erro ao gerar Pix");
    }
  }

  async processBoletoPayment(paymentData) {
    try {
      console.log("Enviando requisição de boleto:", paymentData);
      const response = await axios.post(
        `${baseUrl}/payments/boleto`,
        paymentData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Resposta recebida do backend:", response.data);

      return {
        success: response.data.success,
        paymentId: response.data.paymentId,
        checkoutId: response.data.checkoutId,
        boletoLink: response.data.boletoUrl,
        linhaDigitavel: response.data.linhaDigitavel,
        qrCodePix: response.data.qrCodePix || null,
      };
    } catch (error) {
      console.error("Erro ao processar boleto:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        error.response?.data?.error || "Erro ao gerar boleto. Tente novamente."
      );
    }
  }

  async validateCoupon(coupon, allTickets) {
    try {
      const response = await axios.post(`${baseUrl}/payments/validate-coupon`, {
        coupon,
        allTickets: Number(allTickets) || 1,
      });
      const { success, message, data } = response.data;
      if (!success) throw new Error(message);
      return { success, message, ...data };
    } catch (error) {
      console.error("Erro ao validar cupom:", error);
      throw new Error(error.response?.data?.message || "Cupom inválido");
    }
  }

  async calculateTotals({ allTickets, halfTickets, socialTickets, coupon }) {
    try {
      const response = await axios.post(
        `${baseUrl}/payments/calculate-totals`,
        {
          allTickets: Number(allTickets) || 0,
          halfTickets: Number(halfTickets) || 0,
          socialTickets: Number(socialTickets) || 0,
          coupon: coupon || "",
        }
      );
      const { success, message, data } = response.data;
      if (!success) throw new Error(message);
      return {
        valueTicketsAll: data.valueTicketsAll || "0.00",
        valueTicketsHalf: data.valueTicketsHalf || "0.00",
        valueTicketsSocial: data.valueTicketsSocial || "0.00",
        discount: data.discount || "0.00",
        total: data.total || "0.00",
        totalInCents: data.totalInCents || 0,
      };
    } catch (error) {
      console.error("Erro ao calcular totais:", error);
      return {
        valueTicketsAll: "0.00",
        valueTicketsHalf: "0.00",
        valueTicketsSocial: "0.00",
        discount: "0.00",
        total: "0.00",
        totalInCents: 0,
      };
    }
  }

  async verifyPayment(paymentId) {
    try {
      const response = await axios.get(
        `${baseUrl}/payments/verify/${paymentId}`
      );
      const { success, message, data } = response.data;
      if (!success) throw new Error(message);
      return { success, message, ...data };
    } catch (error) {
      console.error("Erro ao verificar pagamento:", error);
      throw new Error(
        error.response?.data?.error || "Erro ao verificar pagamento"
      );
    }
  }

  async verifyAllPayments() {
    try {
      const response = await axios.get(`${baseUrl}/payments/verify-all`);
      const { success, message } = response.data;
      if (!success) throw new Error(message);
      return { success, message };
    } catch (error) {
      console.error("Erro ao verificar todos os pagamentos:", error);
      throw new Error(
        error.response?.data?.error || "Erro ao verificar pagamentos pendentes"
      );
    }
  }

  async sendConfirmationEmail(emailData) {
    try {
      console.log("Dados enviados para /send-confirmation-email:", emailData);
      const response = await axios.post(
        `${baseUrl}/email/send-confirmation`,
        emailData
      );
      const { success, message } = response.data;
      if (!success) throw new Error(message);
      console.log("Resposta do envio de email:", response.data);
      console.log("Mensagem de sucesso:", message);
      return { success, message };
    } catch (error) {
      console.error("Erro ao enviar email de confirmação:", error);
      throw new Error(
        error.response?.data?.error || "Erro ao enviar email de confirmação"
      );
    }
  }

  getWhatsAppLink(errorMessage) {
    return `https://wa.me/${
      PaymentService.WHATSAPP_NUMBER
    }?text=${encodeURIComponent(errorMessage)}`;
  }

  async createManualCheckout(checkoutData) {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${baseUrl}/payments/manual`,
        checkoutData,
        { headers }
      );
      const { success, message, data } = response.data;
      if (!success) throw new Error(message);
      return data; // { checkoutId, participantIds }
    } catch (error) {
      console.error("Erro ao criar checkout manual:", error);
      throw new Error(
        error.response?.data?.error || "Erro ao criar checkout manual"
      );
    }
  }

  async addAllTemplatesToPendingEmails(checkoutId, status) {
    try {
      const response = await axios.post(
        `${baseUrl}/payments/add-templates-to-pending-emails`,
        { checkoutId, status }
      );
      const { success, message } = response.data;
      if (!success) throw new Error(message);
      return { success, message };
    } catch (error) {
      console.error("Erro ao adicionar templates de email pendentes:", error);
      throw new Error(
        error.response?.data?.error ||
          "Erro ao adicionar templates de email pendentes"
      );
    }
  }
}

export default new PaymentService();
