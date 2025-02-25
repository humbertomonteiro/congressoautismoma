import axios from "axios";

class PaymentMethods {
  constructor(calculateTotal, participants) {
    this.calculateTotal = calculateTotal;
    this.participants = participants;
    this.baseURL = "http://localhost:5000/api/payments";
  }

  async processCreditCard({
    cardNumber,
    cardName,
    Maturity,
    cardCode,
    QuantityInstalment,
  }) {
    if (!this.participants.length) {
      return {
        success: false,
        message: "Adicione pelo menos um participante!",
        type: "error",
      };
    }

    if (
      !cardNumber ||
      !cardName ||
      !Maturity ||
      !cardCode ||
      !QuantityInstalment
    ) {
      return {
        success: false,
        message: "Preencha todos os campos do cartão de crédito!",
        type: "error",
      };
    }

    const transactionData = {
      MerchantOrderId: `ORDER_${Date.now()}`,
      Customer: {
        Name: this.participants[0].name,
      },
      Payment: {
        Type: "CreditCard",
        Amount: parseInt(this.calculateTotal().total * 100),
        Installments: parseInt(QuantityInstalment),
        CreditCard: {
          CardNumber: cardNumber.replace(/\s/g, ""),
          Holder: cardName,
          ExpirationDate: Maturity,
          SecurityCode: cardCode,
          Brand: "Visa",
        },
      },
    };

    try {
      console.log("Enviando para o backend (Credit):", transactionData);
      const response = await axios.post(
        `${this.baseURL}/credit`,
        transactionData
      );
      const {
        Payment: { Status, ReturnMessage },
      } = response.data;

      switch (Status) {
        case 1:
        case 2:
          return {
            success: true,
            message: "Parabéns! Sua compra foi aprovada com sucesso.",
            type: "success",
          };
        case 3:
          return {
            success: false,
            message: `Erro: ${ReturnMessage || "Pagamento não autorizado."}`,
            type: "error",
          };
        default:
          return {
            success: false,
            message: "Pagamento em análise. Aguarde a confirmação.",
            type: "pending",
            pending: true,
          };
      }
    } catch (error) {
      console.error("Erro:", error.response?.data || error);
      return {
        success: false,
        message:
          error.response?.data?.error ||
          "Erro ao processar o pagamento. Tente novamente.",
        type: "error",
      };
    }
  }

  async processPix() {
    if (!this.participants.length) {
      return {
        success: false,
        message: "Adicione pelo menos um participante!",
        type: "error",
      };
    }

    const paymentData = {
      MerchantOrderId: `ORDER_${Date.now()}`,
      Customer: {
        Name: this.participants[0]?.name || "Cliente",
      },
      Payment: {
        Type: "Pix",
        Amount: parseInt(this.calculateTotal().total * 100),
        Provider: "Cielo",
      },
    };

    try {
      const response = await axios.post(`${this.baseURL}/pix`, paymentData);
      if (!response.data.success) {
        return {
          success: false,
          message: response.data.message || "Erro ao gerar o Pix",
          type: "error",
          transactionId: paymentData.MerchantOrderId,
          paymentId: response.data.paymentId,
          errorLog: response.data.errorLog,
        };
      }

      return {
        success: true,
        message: "Pix gerado com sucesso!",
        type: "pending",
        transactionId: paymentData.MerchantOrderId,
        paymentId: response.data.paymentId,
        qrCode: response.data.qrCode,
        qrCodeString: response.data.qrCodeString,
      };
    } catch (error) {
      console.error("Erro na requisição ao backend:", error);
      return {
        success: false,
        message: "Erro ao processar o Pix",
        type: "error",
        transactionId: paymentData.MerchantOrderId,
        errorLog: error.response?.data || error.message,
      };
    }
  }

  async processBoleto(boletoData) {
    if (!this.participants.length) {
      return {
        success: false,
        message: "Adicione pelo menos um participante!",
        type: "error",
      };
    }

    const paymentData = {
      MerchantOrderId: `ORDER_${Date.now()}`,
      Customer: {
        Name: this.participants[0]?.name || "Cliente",
        Address: {
          Street: boletoData.street,
          Number: boletoData.number,
          District: boletoData.district,
          ZipCode: boletoData.zipCode,
          City: boletoData.city,
          State: boletoData.state,
          Country: "BRA",
        },
      },
      Payment: {
        Type: "Boleto",
        Amount: parseInt(this.calculateTotal().total * 100),
      },
    };

    try {
      const response = await axios.post(`${this.baseURL}/boleto`, paymentData);
      if (!response.data.success) {
        return {
          success: false,
          message: response.data.message || "Erro ao gerar o boleto",
          type: "error",
          transactionId: paymentData.MerchantOrderId,
          paymentId: response.data.paymentId,
          errorLog: response.data.errorLog,
        };
      }

      return {
        success: true,
        message: "Boleto gerado com sucesso!",
        type: "pending",
        transactionId: paymentData.MerchantOrderId,
        paymentId: response.data.paymentId,
        boletoUrl: response.data.boletoUrl,
      };
    } catch (error) {
      console.error("Erro na requisição ao backend:", error);
      return {
        success: false,
        message: "Erro ao processar o boleto",
        type: "error",
        transactionId: paymentData.MerchantOrderId,
        errorLog: error.response?.data || error.message,
      };
    }
  }
}

export default PaymentMethods;
