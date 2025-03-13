// src/hooks/usePaymentForm.js
import { useState, useEffect } from "react";
import PaymentService from "../services/PaymentService";

const EMAIL_FROM = import.meta.env.VITE_EMAIL_FROM;

const usePaymentForm = () => {
  const [formState, setFormState] = useState({
    paymentMethod: "creditCard",
    loading: false,
    ticketQuantity: 1,
    halfTickets: 0,
    coupon: { code: "", isApplied: false },
  });

  const [participants, setParticipants] = useState([]);
  const [currentParticipant, setCurrentParticipant] = useState({
    name: "",
    email: "",
    number: "",
    cpf: "",
    isHalfPrice: false,
  });

  const [creditCardData, setCreditCardData] = useState({
    cardNumber: "",
    cardName: "",
    maturity: "",
    cardCode: "",
    installments: "1",
    brand: "Visa",
  });

  const [boletoData, setBoletoData] = useState({
    street: "",
    number: "",
    district: "",
    zipCode: "",
    city: "",
    state: "",
  });

  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
    content: null,
  });

  const [totals, setTotals] = useState({
    valueTicketsAll: "0.00",
    valueTicketsHalf: "0.00",
    discount: "0.00",
    total: "0.00",
  });

  // Calcular totais sempre que ticketQuantity, halfTickets ou coupon mudar
  useEffect(() => {
    const fetchTotals = async () => {
      const ticketQty = Number(formState.ticketQuantity) || 0;
      const halfQty = Number(formState.halfTickets) || 0;
      if (isNaN(ticketQty) || isNaN(halfQty)) {
        console.error("Valores inválidos para cálculo:", {
          ticketQty,
          halfQty,
        });
        return;
      }

      try {
        const response = await PaymentService.calculateTotals({
          ticketQuantity: formState.ticketQuantity,
          halfTickets: formState.halfTickets,
          coupon: formState.coupon.isApplied ? formState.coupon.code : "",
        });
        if (response.success) {
          setTotals(response.data);
        }
      } catch (error) {
        console.error("Erro ao calcular totais:", error);
        setTotals({
          valueTicketsAll: "0.00",
          valueTicketsHalf: "0.00",
          discount: "0.00",
          total: "0.00",
        });
      }
    };
    fetchTotals();
  }, [formState.ticketQuantity, formState.halfTickets, formState.coupon]);

  // Funções utilitárias
  const setModalError = (title, message, content = null) => {
    setModalState({ isOpen: true, title, message, type: "error", content });
    setFormState((prev) => ({ ...prev, loading: false }));
  };

  const validateParticipants = () => {
    if (participants.length !== formState.ticketQuantity) {
      setModalError(
        "Participantes Incompletos",
        `Você adicionou ${participants.length} participante(s), mas selecionou ${formState.ticketQuantity} ingresso(s).`
      );
      return false;
    }
    return true;
  };

  // Handlers
  const handleTicketQuantityChange = (e) => {
    const newQuantity = Number(e.target.value);
    if (newQuantity < participants.length) {
      setModalError(
        "Quantidade Inválida",
        `Você já adicionou ${participants.length} participante(s). Remova participantes excedentes.`
      );
      return;
    }
    if (formState.coupon.isApplied && newQuantity < 5) {
      setModalError(
        "Cupom de grupo aplicado",
        "Para diminuir para menos de 5 ingressos, remova o cupom."
      );
      return;
    }
    setFormState((prev) => ({ ...prev, ticketQuantity: newQuantity }));
  };

  const handleAddParticipant = (e) => {
    e.preventDefault();
    if (participants.length >= formState.ticketQuantity) {
      setModalError(
        "Limite Atingido",
        "Todos os participantes já foram adicionados!"
      );
      return;
    }
    if (
      Object.values(currentParticipant).some(
        (val) => !val && typeof val !== "boolean"
      )
    ) {
      setModalError(
        "Campos Incompletos",
        "Preencha todos os campos do participante!"
      );
      return;
    }

    setParticipants((prev) => [...prev, currentParticipant]);
    setFormState((prev) => ({
      ...prev,
      halfTickets: prev.halfTickets + (currentParticipant.isHalfPrice ? 1 : 0),
    }));
    setCurrentParticipant({
      name: "",
      email: "",
      number: "",
      cpf: "",
      isHalfPrice: false,
    });
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    const trimmedCoupon = formState.coupon.code.trim().toLowerCase();
    if (!trimmedCoupon) {
      setModalError("Cupom Inválido", "Digite um cupom válido.");
      return;
    }

    try {
      const response = await PaymentService.validateCoupon(
        trimmedCoupon,
        formState.ticketQuantity
      );
      if (response.success && response.data.valid) {
        setFormState((prev) => ({
          ...prev,
          coupon: { code: trimmedCoupon, isApplied: true },
        }));
        setModalState({
          isOpen: true,
          title: "Cupom Aplicado",
          message: "Cupom aplicado com sucesso!",
          type: "success",
        });
      } else {
        setFormState((prev) => ({
          ...prev,
          coupon: { code: "", isApplied: false },
        }));
        setModalError("Cupom Inválido", response.message || "Cupom inválido!");
      }
    } catch (error) {
      setFormState((prev) => ({
        ...prev,
        coupon: { code: "", isApplied: false },
      }));
      setModalError(
        "Erro ao Validar Cupom",
        error.response?.data?.message || "Erro ao validar o cupom."
      );
    }
  };

  const handleRemoveCoupon = () => {
    setFormState((prev) => ({
      ...prev,
      coupon: { code: "", isApplied: false },
    }));
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setFormState((prev) => ({ ...prev, loading: true }));
    if (!validateParticipants()) return;

    const paymentData = {
      ticketQuantity: formState.ticketQuantity,
      halfTickets: formState.halfTickets,
      coupon: formState.coupon.isApplied ? formState.coupon.code : "",
      participants,
      ...(formState.paymentMethod === "creditCard" && { creditCardData }),
      ...(formState.paymentMethod === "boleto" && { boletoData }),
    };

    try {
      let response;
      console.log("Enviando pagamento ao backend:", paymentData);
      switch (formState.paymentMethod) {
        case "creditCard":
          response = await PaymentService.processCreditCardPayment(paymentData);
          break;
        case "pix":
          response = await PaymentService.processPixPayment(paymentData);
          break;
        case "boleto":
          response = await PaymentService.processBoletoPayment(paymentData);
          break;
        default:
          throw new Error("Método de pagamento inválido.");
      }

      console.log("Resposta do backend para pagamento:", response);
      setFormState((prev) => ({ ...prev, loading: false }));

      if (response.success) {
        if (formState.paymentMethod === "creditCard") {
          const emailData = {
            from: EMAIL_FROM,
            to: participants[0].email,
            subject: "Confirmação de Pagamento - Congresso Autismo MA 2025",
            data: {
              name: participants[0].name,
              transactionId: response.data.transactionId,
              fullTickets: formState.ticketQuantity - formState.halfTickets,
              valueTicketsAll: totals.valueTicketsAll,
              halfTickets: formState.halfTickets,
              valueTicketsHalf: totals.valueTicketsHalf,
              coupon: formState.coupon.isApplied ? formState.coupon.code : "",
              discount: formState.coupon.isApplied ? totals.discount : "",
              total: totals.total,
            },
          };

          console.log("EmailData construído:", emailData);
          if (
            !emailData.from ||
            !emailData.to ||
            !emailData.subject ||
            !emailData.data
          ) {
            console.error(
              "Campos obrigatórios faltando no emailData:",
              emailData
            );
            throw new Error(
              "Dados insuficientes para enviar o email de confirmação."
            );
          }

          console.log("Enviando email de confirmação:", emailData);
          try {
            const emailResponse = await PaymentService.sendConfirmationEmail(
              emailData
            );
            console.log("Resposta do envio de email:", emailResponse);
          } catch (emailError) {
            console.error(
              "Erro ao enviar email de confirmação:",
              emailError.message
            );
          }
          setModalState({
            isOpen: true,
            title: "Compra Realizada com Sucesso",
            message:
              "Seu pagamento foi efetuado! Confira os detalhes no seu e-mail.",
            type: "success",
          });
        } else if (formState.paymentMethod === "pix") {
          setModalState({
            isOpen: true,
            title: "PIX Gerado",
            message: "Escaneie o QR Code ou copie o código abaixo.",
            type: "pending",
            content: (
              <div style={{ textAlign: "center" }}>
                <img
                  src={`data:image/png;base64,${response.data.qrCode}`}
                  alt="QR Code PIX"
                />
                <p>
                  <strong>Código Pix:</strong> {response.data.qrCodeString}
                </p>
              </div>
            ),
          });
        } else if (formState.paymentMethod === "boleto") {
          setModalState({
            isOpen: true,
            title: "Boleto Gerado",
            message:
              "O boleto foi baixado com sucesso. Verifique seus downloads!",
            type: "pending",
          });
        }
      } else {
        throw new Error(
          response.message || "Erro desconhecido no processamento."
        );
      }
    } catch (error) {
      console.error("Erro no handlePayment:", error.message);
      const errorMessage =
        error.response?.data?.message ||
        `Erro ao processar ${formState.paymentMethod}.`;
      setModalError(
        `Erro ao Processar ${
          formState.paymentMethod === "creditCard"
            ? "Pagamento"
            : formState.paymentMethod === "pix"
            ? "Pix"
            : "Boleto"
        }`,
        errorMessage,
        <button
          onClick={() =>
            window.open(
              PaymentService.getWhatsAppLink(
                `Erro ao processar ${formState.paymentMethod}: ${errorMessage}`
              ),
              "_blank"
            )
          }
        >
          Contatar via WhatsApp
        </button>
      );
    }
  };

  return {
    formState,
    setFormState,
    participants,
    setParticipants,
    currentParticipant,
    setCurrentParticipant,
    creditCardData,
    setCreditCardData,
    boletoData,
    setBoletoData,
    modalState,
    setModalState,
    totals,
    handleTicketQuantityChange,
    handleAddParticipant,
    handleApplyCoupon,
    handleRemoveCoupon,
    handlePayment,
  };
};

export default usePaymentForm;
