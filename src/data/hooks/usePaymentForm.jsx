// src/hooks/usePaymentForm.js
import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import PaymentService from "../services/PaymentService";
import useEventConfig from "./useEventConfig";

const EMAIL_FROM = import.meta.env.VITE_EMAIL_FROM;

const TICKET_TYPE_LABELS = {
  all: "Inteiro",
  half: "Meia-entrada",
  social: "Social",
};

const normalizeBrand = (brand) => {
  const brandMap = {
    visa: "Visa",
    mastercard: "MasterCard",
    amex: "Amex",
    elo: "Elo",
    diners: "Diners",
    discover: "Discover",
    jcb: "JCB",
    aura: "Aura",
    hipercard: "Hipercard",
  };
  const lowerBrand = brand.toLowerCase();
  return brandMap[lowerBrand] || brand;
};

/** Dado um índice de participante e as contagens, retorna "full" | "half" | "social" */
const deriveTicketType = (index, allTickets, halfTickets) => {
  if (index < allTickets) return "full";
  if (index < allTickets + halfTickets) return "half";
  return "social";
};

const usePaymentForm = () => {
  const { config: eventConfig } = useEventConfig();

  const [formState, setFormState] = useState({
    paymentMethod: "creditCard",
    loading: false,
    allTickets: 0,
    halfTickets: 0,
    socialTickets: 0,
    coupon: { code: "", isApplied: false },
    observation: "",
  });

  const [participants, setParticipants] = useState([]);
  const [currentParticipant, setCurrentParticipant] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    documentType: "cpf",
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
    valueTicketsSocial: "0.00",
    discount: "0.00",
    total: "0.00",
    totalInCents: 0,
  });

  const pixPollingRef = useRef(null);

  const stopPixPolling = () => {
    if (pixPollingRef.current) {
      clearInterval(pixPollingRef.current);
      pixPollingRef.current = null;
    }
  };

  // Limpa o polling ao desmontar o componente
  useEffect(() => () => stopPixPolling(), []);

  // Total de ingressos derivado das 3 categorias
  const ticketQuantity =
    formState.allTickets + formState.halfTickets + formState.socialTickets;

  const fetchTotals = async () => {
    if (formState.paymentMethod === "courtesy") {
      setTotals({
        valueTicketsAll: "0.00",
        valueTicketsHalf: "0.00",
        valueTicketsSocial: "0.00",
        discount: "0.00",
        total: "0.00",
        totalInCents: 0,
      });
      return;
    }

    if (ticketQuantity === 0) {
      setTotals({
        valueTicketsAll: "0.00",
        valueTicketsHalf: "0.00",
        valueTicketsSocial: "0.00",
        discount: "0.00",
        total: "0.00",
        totalInCents: 0,
      });
      return;
    }

    try {
      const response = await PaymentService.calculateTotals({
        allTickets: formState.allTickets,
        halfTickets: formState.halfTickets,
        socialTickets: formState.socialTickets,
        coupon: formState.coupon.isApplied ? formState.coupon.code : "",
      });
      setTotals(response);
    } catch (error) {
      console.error("Erro ao calcular totais:", error.message);
      setTotals({
        valueTicketsAll: "0.00",
        valueTicketsHalf: "0.00",
        valueTicketsSocial: "0.00",
        discount: "0.00",
        total: "0.00",
        totalInCents: 0,
      });
    }
  };

  useEffect(() => {
    fetchTotals();
  }, [
    formState.paymentMethod,
    formState.allTickets,
    formState.halfTickets,
    formState.socialTickets,
    formState.coupon,
  ]);

  // Funções utilitárias
  const setModalError = (title, message, content = null) => {
    setModalState({ isOpen: true, title, message, type: "error", content });
    setFormState((prev) => ({ ...prev, loading: false }));
  };

  const validateParticipants = () => {
    if (participants.length !== ticketQuantity) {
      setModalError(
        "Participantes Incompletos",
        `Você adicionou ${participants.length} participante(s), mas selecionou ${ticketQuantity} ingresso(s).`
      );
      return false;
    }
    return true;
  };

  const validatePayer = (payer) => {
    if (!payer) {
      setModalError(
        "Pagador Não Selecionado",
        "Por favor, selecione ou adicione um pagador antes de prosseguir."
      );
      return false;
    }
    return true;
  };

  // Handlers
  const handleTicketTypeChange = (type, value) => {
    const newValue = Math.max(0, Number(value));
    const counts = {
      allTickets: formState.allTickets,
      halfTickets: formState.halfTickets,
      socialTickets: formState.socialTickets,
    };
    const fieldMap = {
      all: "allTickets",
      half: "halfTickets",
      social: "socialTickets",
    };
    counts[fieldMap[type]] = newValue;
    const newTotal =
      counts.allTickets + counts.halfTickets + counts.socialTickets;

    if (newTotal < participants.length) {
      setModalError(
        "Quantidade Inválida",
        `Você já adicionou ${participants.length} participante(s). Remova participantes antes de diminuir.`
      );
      return;
    }
    setFormState((prev) => ({ ...prev, [fieldMap[type]]: newValue }));
  };

  const handleAddParticipant = (e) => {
    e.preventDefault();

    const requiredFields = ["name", "email", "phone", "document"];
    const missingFields = requiredFields.filter(
      (field) =>
        !currentParticipant[field] || currentParticipant[field].trim() === ""
    );

    if (missingFields.length > 0) {
      setModalError(
        "Campos Incompletos",
        `Preencha os seguintes campos: ${missingFields.join(", ")}.`
      );
      return;
    }

    if (participants.length >= ticketQuantity) {
      setModalError(
        "Limite Atingido",
        "Todos os participantes já foram adicionados!"
      );
      return;
    }

    // Determina o tipo do ingresso pela posição na fila
    const ticketType = deriveTicketType(
      participants.length,
      formState.allTickets,
      formState.halfTickets
    );

    setParticipants((prev) => [...prev, { ...currentParticipant, ticketType }]);
    setCurrentParticipant({
      name: "",
      email: "",
      phone: "",
      document: "",
      documentType: "cpf",
    });
  };

  const handleApplyCoupon = async (e, couponCode = null, ticketOverride = null, silent = false) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }

    const trimmedCoupon = (couponCode || formState.coupon.code)
      .trim()
      .toLowerCase();
    if (!trimmedCoupon) {
      setModalError("Cupom Inválido", "Digite um cupom válido.");
      return false;
    }

    // ticketOverride permite passar quantidades corretas ao aplicar via URL
    // sem depender do estado do React que ainda pode não ter sido atualizado
    const allT = ticketOverride?.allTickets ?? formState.allTickets;
    const halfT = ticketOverride?.halfTickets ?? formState.halfTickets;
    const socialT = ticketOverride?.socialTickets ?? formState.socialTickets;

    try {
      const response = await PaymentService.calculateTotals({
        allTickets: allT,
        halfTickets: halfT,
        socialTickets: socialT,
        coupon: trimmedCoupon,
      });
      setFormState((prev) => ({
        ...prev,
        coupon: { code: trimmedCoupon, isApplied: true },
      }));
      setTotals(response);
      if (!silent) {
        setModalState({
          isOpen: true,
          title: "Cupom Aplicado",
          message: "Cupom aplicado com sucesso!",
          type: "success",
        });
      }
      return true;
    } catch (error) {
      console.error("Erro ao aplicar cupom:", error);
      setFormState((prev) => ({
        ...prev,
        coupon: { code: "", isApplied: false },
      }));
      setModalError("Cupom Inválido", error.message || "Cupom inválido!");
      return false;
    }
  };

  const handleRemoveCoupon = () => {
    setFormState((prev) => ({
      ...prev,
      coupon: { code: "", isApplied: false },
    }));
  };

  const handlePayment = async (e, selectedPayer, navigate) => {
    e.preventDefault();
    setFormState((prev) => ({ ...prev, loading: true }));

    if (!validateParticipants()) return;
    if (!validatePayer(selectedPayer)) return;

    const normalizedBrand = normalizeBrand(creditCardData.brand);

    const paymentData = {
      allTickets: formState.allTickets,
      halfTickets: formState.halfTickets,
      socialTickets: formState.socialTickets,
      coupon: formState.coupon.isApplied ? formState.coupon.code : "",
      participants,
      payer: {
        name: selectedPayer?.name || "",
        document: selectedPayer?.document || "",
        documentType: selectedPayer?.documentType || "cpf",
        zipCode: selectedPayer?.zipCode || "",
        street: selectedPayer?.street || "",
        addressNumber: selectedPayer?.addressNumber || "",
        district: selectedPayer?.district || "",
        city: selectedPayer?.city || "",
        state: selectedPayer?.state || "",
      },
      ...(formState.paymentMethod === "creditCard" && {
        creditCardData: {
          ...creditCardData,
          brand: normalizedBrand,
        },
      }),
    };

    try {
      let response;
      switch (formState.paymentMethod) {
        case "creditCard":
          response = await PaymentService.processCreditCardPayment(paymentData);
          break;
        case "pix":
          response = await PaymentService.processPixPayment(paymentData);
          break;
        case "boleto":
          response = await PaymentService.processBoletoPayment(paymentData);
          if (response.success) {
            setFormState((prev) => ({ ...prev, loading: false }));
            navigate("/thanks-you", {
              state: {
                total: totals.total,
                paymentMethod: "boleto",
                checkoutId: response.checkoutId,
                boletoLink: response.boletoLink,
                linhaDigitavel: response.linhaDigitavel,
                qrCodePix: response.qrCodePix,
              },
            });
          } else {
            throw new Error(response.message || "Erro ao gerar boleto");
          }
          break;
        default:
          throw new Error("Método de pagamento inválido.");
      }

      if (response.success) {
        if (formState.paymentMethod === "creditCard") {
          const emailResponses = [];
          for (let i = 0; i < participants.length; i++) {
            const participant = participants[i];
            const participantId = response.participantIds?.[i];
            const emailData = {
              checkoutId: response.checkoutId,
              participantId,
              from: EMAIL_FROM,
              to: participant.email,
              subject: `Confirmação de Pagamento - ${eventConfig.eventName}`,
              data: {
                name: participant.name,
                transactionId: response.transactionId,
                fullTickets: formState.allTickets,
                valueTicketsAll: totals.valueTicketsAll,
                halfTickets: formState.halfTickets,
                valueTicketsHalf: totals.valueTicketsHalf,
                socialTickets: formState.socialTickets,
                valueTicketsSocial: totals.valueTicketsSocial,
                coupon: formState.coupon.isApplied ? formState.coupon.code : "",
                discount: formState.coupon.isApplied ? totals.discount : "0.00",
                total: totals.total,
                installments: creditCardData.installments,
              },
            };

            if (
              !emailData.from ||
              !emailData.to ||
              !emailData.subject ||
              !emailData.data ||
              !emailData.checkoutId ||
              !emailData.participantId
            ) {
              console.error(
                "Campos obrigatórios faltando no emailData:",
                emailData
              );
              throw new Error(
                "Dados insuficientes para enviar o email de confirmação."
              );
            }

            try {
              const emailResponse = await PaymentService.sendConfirmationEmail(
                emailData
              );
              emailResponses.push(emailResponse);
            } catch (emailError) {
              console.error(
                "Erro ao enviar email de confirmação para",
                participant.email,
                ":",
                emailError.message
              );
            }
          }

          navigate("/thanks-you", {
            state: { total: totals.total, paymentMethod: "creditCard" },
          });
        } else if (formState.paymentMethod === "pix") {
          setFormState((prev) => ({ ...prev, loading: false }));

          const expiresAt = response.expirationDate
            ? new Date(response.expirationDate).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : null;

          setModalState({
            isOpen: true,
            title: "PIX Gerado",
            message: "Escaneie o QR Code ou copie o código Pix abaixo.",
            type: "pending",
            content: (
              <div style={{ textAlign: "center" }}>
                {response.qrCodeString && (
                  <div
                    style={{
                      display: "inline-block",
                      padding: "12px",
                      background: "#fff",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      marginBottom: "12px",
                    }}
                  >
                    <QRCodeSVG
                      value={response.qrCodeString}
                      size={200}
                      level="M"
                    />
                  </div>
                )}
                {expiresAt && (
                  <p
                    style={{
                      color: "#e67e22",
                      fontSize: "13px",
                      marginBottom: "8px",
                    }}
                  >
                    ⏳ Expira às {expiresAt}
                  </p>
                )}
                <div
                  style={{ display: "flex", gap: "8px", marginBottom: "12px" }}
                >
                  <input
                    readOnly
                    value={response.qrCodeString || ""}
                    style={{
                      flex: 1,
                      padding: "8px",
                      fontSize: "11px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      background: "#f9f9f9",
                    }}
                  />
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(response.qrCodeString || "")
                    }
                    style={{
                      padding: "8px 14px",
                      background: "#2c3e50",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "13px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Copiar
                  </button>
                </div>
                <p
                  style={{
                    color: "#555",
                    fontSize: "12px",
                    marginBottom: "12px",
                  }}
                >
                  Após o pagamento, você receberá o e-mail de confirmação com o
                  link para seu ingresso.
                </p>
                <button
                  onClick={() =>
                    navigate("/thanks-you", {
                      state: { total: totals.total, paymentMethod: "pix" },
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#27ae60",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "15px",
                    fontWeight: "bold",
                  }}
                >
                  Já paguei — aguardar confirmação
                </button>
              </div>
            ),
          });
        }
      } else {
        throw new Error(
          response.message || "Erro desconhecido no processamento."
        );
      }
    } catch (error) {
      console.error("[handlePayment] Erro no handlePayment:", error.message);
      const errorMessage =
        error.message || `Erro ao processar ${formState.paymentMethod}.`;
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
    setTotals,
    ticketQuantity,
    handleTicketTypeChange,
    handleAddParticipant,
    handleApplyCoupon,
    handleRemoveCoupon,
    handlePayment,
    TICKET_TYPE_LABELS,
    deriveTicketType,
    ticketPrices: eventConfig.ticketPrices,
  };
};

export default usePaymentForm;
