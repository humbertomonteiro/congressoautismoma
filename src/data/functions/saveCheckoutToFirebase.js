import { db } from "../../../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

export const saveCheckoutToFirebase = async (result) => {
  try {
    const checkoutData = {
      transactionId: result.transactionId || `ORDER_${Date.now()}`,
      timestamp: result.timestamp || new Date().toISOString(),
      status: result.status || (result.success ? "approved" : "error"),
      paymentMethod,
      totalAmount: calculateTotal().total,
      participants,
      orderDetails: {
        ticketQuantity,
        fullTickets: ticketQuantity - halfTickets,
        halfTickets,
        fullTicketsValue: calculateTotal().valueTicketsAll,
        halfTicketsValue: calculateTotal().valueTicketsHalf,
        discount: calculateTotal().discount,
        coupon: isCouponApplied ? coupon : null,
      },
      paymentDetails: {
        creditCard:
          paymentMethod === "creditCard" && result.success
            ? {
                last4Digits: cardNumber.slice(-4),
                installments: QuantityInstalment,
              }
            : null,
        pix:
          paymentMethod === "pix" && result.qrCode
            ? {
                qrCodeBase64: result.qrCode,
                qrCodeString: result.qrCodeString,
                expirationDate: result.expirationDate || "2025-12-31T23:59:59Z",
              }
            : null,
        boleto:
          paymentMethod === "boleto" && result.boletoUrl
            ? {
                boletoUrl: result.boletoUrl,
                address: boletoData,
              }
            : null,
      },
      metadata: {
        errorLog: result.success ? null : result.message,
      },
    };

    const docRef = await addDoc(collection(db, "checkouts"), checkoutData);
    console.log("Checkout salvo no Firebase com ID:", docRef.id);
  } catch (error) {
    console.error("Erro ao salvar no Firebase:", error);
  }
};
