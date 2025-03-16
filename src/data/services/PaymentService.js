import axios from "axios";

const isProduction = import.meta.env.VITE_ENV === "production";
const baseUrl = isProduction
  ? import.meta.env.VITE_BASE_URL_PRODUCTION
  : import.meta.env.VITE_BASE_URL_SANDBOX;

class PaymentService {
  static WHATSAPP_NUMBER = "+559888259214";

  async processCreditCardPayment(paymentData) {
    const response = await axios.post(`${baseUrl}/credit`, paymentData);
    return response.data;
  }

  async processPixPayment(paymentData) {
    const response = await axios.post(`${baseUrl}/pix`, paymentData);
    return response.data;
  }

  async processBoletoPayment(paymentData) {
    try {
      console.log("Enviando requisição de boleto:", paymentData);
      const response = await axios.post(`${baseUrl}/boleto`, paymentData, {
        responseType: "blob",
      });

      console.log("Resposta recebida do backend:", response);
      console.log("Tamanho do blob:", response.data.size);

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `boleto_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      console.log("Download iniciado para:", url);
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        message: "Boleto gerado e baixado com sucesso",
        paymentId: null,
      };
    } catch (error) {
      console.error("Erro ao processar boleto:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  }

  async validateCoupon(coupon, ticketQuantity) {
    const response = await axios.post(`${baseUrl}/validate-coupon`, {
      coupon,
      ticketQuantity,
    });
    return response.data;
  }

  async calculateTotals({ ticketQuantity, halfTickets, coupon }) {
    const response = await axios.post(`${baseUrl}/calculate-totals`, {
      ticketQuantity,
      halfTickets,
      coupon: coupon || "",
    });
    return response.data;
  }

  async sendConfirmationEmail(emailData) {
    console.log("Dados enviados para /send-email:", emailData);
    const response = await axios.post(`${baseUrl}/send-email`, emailData);
    return response.data;
  }

  getWhatsAppLink(errorMessage) {
    return `https://wa.me/${
      PaymentService.WHATSAPP_NUMBER
    }?text=${encodeURIComponent(errorMessage)}`;
  }
}

export default new PaymentService();
