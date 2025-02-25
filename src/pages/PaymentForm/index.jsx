import React, { useState, useEffect } from "react";
import styles from "./paymentForm.module.css";
import ParticipantsList from "../../components/checkout/ParticipantsList";
import PaymentMethodsComponent from "../../components/checkout/PaymentMethods";
import Modal from "../../components/checkout/Modal";
import PaymentMethods from "../../data/classes/PaymentMethods";
import logo from "../../assets/logos/logo-no-text.png";
import { db } from "../../../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import axios from "axios";

const PaymentForm = () => {
  const [paymentMethod, setPaymentMethod] = useState("creditCard");
  const [loading, setLoading] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [coupon, setCoupon] = useState("");
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [halfTickets, setHalfTickets] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [currentParticipant, setCurrentParticipant] = useState({
    name: "",
    email: "",
    number: "",
    cpf: "",
    isHalfPrice: false,
  });
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [Maturity, setMaturity] = useState("");
  const [cardCode, setCardCode] = useState("");
  const [QuantityInstalment, setQuantityInstalment] = useState("1");
  const EVENT_NAME = "Congresso Autismo MA 2025";

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

  const basePrice = 499;
  const halfPrice = 399;
  const whatsappNumber = "+559888259214"; // Número para WhatsApp

  const calculateTotal = () => {
    const fullTickets = ticketQuantity - halfTickets;
    const halfTicketsCount = halfTickets;
    const valueTicketsAll = fullTickets * basePrice;
    const valueTicketsHalf = halfTicketsCount * halfPrice;
    let discount = 0;
    if (coupon === "grupo" && ticketQuantity >= 5) {
      discount = ticketQuantity * 50;
    }
    const total = valueTicketsAll + valueTicketsHalf - discount;

    return {
      valueTicketsAll: valueTicketsAll.toFixed(2),
      valueTicketsHalf: valueTicketsHalf.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
    };
  };

  const paymentProcessor = new PaymentMethods(calculateTotal, participants);

  const saveCheckoutToFirebase = async (result) => {
    try {
      const localDate = new Date();
      localDate.setHours(0, 0, 0, 0);
      const utcTimestamp = new Date(
        localDate.getTime() - localDate.getTimezoneOffset() * 60000
      ).toISOString();

      const checkoutData = {
        transactionId: result.transactionId || `ORDER_${Date.now()}`,
        timestamp: utcTimestamp,
        status: result.type || (result.success ? "pending" : "error"),
        paymentMethod,
        totalAmount: calculateTotal().total,
        eventName: EVENT_NAME,
        participants,
        paymentId: result.paymentId || null,
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
                  expirationDate:
                    result.expirationDate || "2025-12-31T23:59:59Z",
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
        sentEmails: [],
      };

      const docRef = await addDoc(collection(db, "checkouts"), checkoutData);
      console.log(
        "Checkout salvo no Firebase com ID:",
        docRef.id,
        "Timestamp:",
        utcTimestamp
      );
      return checkoutData;
    } catch (error) {
      console.error("Erro ao salvar no Firebase:", error);
      throw error;
    }
  };

  const checkPaymentStatus = async (paymentId) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/payments/check-payment-status", // Ajuste para sua URL de produção
        { paymentId }
      );
      return response.data.status;
    } catch (error) {
      console.error("Erro ao verificar status do pagamento:", error);
      return "error";
    }
  };

  const handleTicketQuantityChange = (e) => {
    const newQuantity = Number(e.target.value);
    if (newQuantity < participants.length) {
      setModalState({
        isOpen: true,
        title: "Quantidade Inválida",
        message: `Você já adicionou ${participants.length} participante(s). Para diminuir a quantidade de ingressos, primeiro remova os participantes excedentes.`,
        type: "error",
      });
      return;
    }

    if (coupon !== "" && newQuantity < 5) {
      setModalState({
        isOpen: true,
        title: "Cupom de grupo adicionado",
        message:
          "Para diminuir para menos de 5 participantes, você precisa remover o cupom.",
        type: "error",
      });
      return;
    }
    setTicketQuantity(newQuantity);
  };

  const handleAddParticipant = (e) => {
    e.preventDefault();
    if (participants.length >= ticketQuantity) {
      setModalState({
        isOpen: true,
        title: "Limite Atingido",
        message: "Você já adicionou todos os participantes necessários!",
        type: "error",
      });
      return;
    }

    if (
      currentParticipant.name &&
      currentParticipant.email &&
      currentParticipant.number &&
      currentParticipant.cpf
    ) {
      const updatedParticipants = [...participants, currentParticipant];
      setParticipants(updatedParticipants);
      setHalfTickets((prev) => prev + (currentParticipant.isHalfPrice ? 1 : 0));
      setCurrentParticipant({
        name: "",
        email: "",
        number: "",
        cpf: "",
        isHalfPrice: false,
      });
    } else {
      setModalState({
        isOpen: true,
        title: "Campos Incompletos",
        message: "Por favor, preencha todos os campos!",
        type: "error",
      });
    }
  };

  const handleInputChange = (field, value) => {
    setCurrentParticipant({
      ...currentParticipant,
      [field]: value,
    });
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (coupon === "grupo" && ticketQuantity >= 5) {
      setIsCouponApplied(true);
      setModalState({
        isOpen: true,
        title: "Cupom Aplicado",
        message: "Cupom 'grupo' aplicado com sucesso!",
        type: "success",
      });
    } else {
      setModalState({
        isOpen: true,
        title: "Cupom Inválido",
        message:
          coupon === "grupo"
            ? "O cupom 'grupo' requer 5 ou mais ingressos!"
            : "Cupom inválido!",
        type: "error",
      });
      setCoupon("");
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon("");
    setIsCouponApplied(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (participants.length < ticketQuantity) {
      setModalState({
        isOpen: true,
        title: "Adicione os participantes",
        message: "Adicione todos participantes para concluir.",
        type: "pending",
      });
      setLoading(false);
      return;
    }

    const result = await paymentProcessor.processCreditCard({
      cardNumber,
      cardName,
      Maturity,
      cardCode,
      QuantityInstalment,
    });

    const checkoutData = await saveCheckoutToFirebase(result);
    setLoading(false);

    if (result.success) {
      await sendConfirmationEmail(checkoutData);
      setModalState({
        isOpen: true,
        title: "Compra Realizada com Sucesso",
        message:
          "Seu pagamento foi efetuado! Confira os detalhes no seu e-mail.",
        type: "success",
      });
    } else {
      setModalState({
        isOpen: true,
        title: "Erro no Pagamento",
        message: result.message,
        type: "error",
        content: (
          <button
            onClick={() =>
              window.open(
                `https://wa.me/${whatsappNumber}?text=Quero efetuar o pagamento com ${paymentMethod} e deu erro, o que posso fazer?`,
                "_blank"
              )
            }
            className={styles.whatsappButton}
          >
            Contatar via WhatsApp
          </button>
        ),
      });
    }
  };

  const handlePixPayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (participants.length < ticketQuantity) {
      setModalState({
        isOpen: true,
        title: "Adicione os participantes",
        message: "Adicione todos participantes para concluir.",
        type: "pending",
      });
      setLoading(false);
      return;
    }

    const result = await paymentProcessor.processPix();
    await saveCheckoutToFirebase(result);
    setLoading(false);

    if (result.success) {
      setModalState({
        isOpen: true,
        title: "PIX Gerado",
        message:
          "Escaneie o QR Code ou copie o código abaixo para realizar o pagamento.",
        type: "pending",
        content: (
          <div style={{ textAlign: "center" }}>
            <img
              src={`data:image/png;base64,${result.qrCode}`}
              alt="QR Code PIX"
              style={{ maxWidth: "100%", marginTop: "10px" }}
            />
            <p style={{ marginTop: "10px", wordBreak: "break-all" }}>
              <strong>Código Pix:</strong> {result.qrCodeString}
            </p>
          </div>
        ),
      });
    } else {
      setModalState({
        isOpen: true,
        title: "Erro ao Gerar Pix",
        message:
          result.message || "Houve um erro ao processar o pagamento via Pix.",
        type: "error",
        content: null,
      });
    }
  };

  const handleBoletoPayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (participants.length < ticketQuantity) {
      setModalState({
        isOpen: true,
        title: "Adicione os participantes",
        message: "Adicione todos participantes para concluir.",
        type: "pending",
      });
      setLoading(false);
      return;
    }

    const { street, number, district, zipCode, city, state } = boletoData;

    if (!street || !number || !district || !zipCode || !city || !state) {
      setModalState({
        isOpen: true,
        title: "Dados Incompletos",
        message: "Preencha todos os campos de endereço para gerar o boleto!",
        type: "error",
      });
      setLoading(false);
      return;
    }

    const result = await paymentProcessor.processBoleto(boletoData);
    const checkoutData = await saveCheckoutToFirebase(result);
    setLoading(false);

    if (result.success) {
      setModalState({
        isOpen: true,
        title: "Boleto Gerado",
        message:
          "Seu boleto foi gerado com sucesso! Clique no link para visualizar.",
        type: "pending",
        content: result.boletoUrl ? (
          <a href={result.boletoUrl} target="_blank" rel="noopener noreferrer">
            Visualizar Boleto
          </a>
        ) : null,
      });
      if (result.boletoUrl) {
        window.open(result.boletoUrl, "_blank");

        const paymentId = result.paymentId;
        const interval = setInterval(async () => {
          const status = await checkPaymentStatus(paymentId);
          if (status === "approved") {
            clearInterval(interval);
            await sendConfirmationEmail(checkoutData);
            setModalState({
              isOpen: true,
              title: "Pagamento Efetuado",
              message:
                "Seu pagamento via Boleto foi confirmado com sucesso! Confira os detalhes no seu e-mail.",
              type: "success",
            });
          } else if (status === "canceled" || status === "error") {
            clearInterval(interval);
            setModalState({
              isOpen: true,
              title: "Erro no Pagamento",
              message: "O pagamento via Boleto foi cancelado ou falhou.",
              type: "error",
              content: (
                <button
                  onClick={() =>
                    window.open(
                      `https://wa.me/${whatsappNumber}?text=Quero efetuar o pagamento com ${paymentMethod} e deu erro, o que posso fazer?`,
                      "_blank"
                    )
                  }
                  className={styles.whatsappButton}
                >
                  Contatar via WhatsApp
                </button>
              ),
            });
          }
        }, 60000);
      }
    } else {
      setModalState({
        isOpen: true,
        title: "Erro ao Gerar Boleto",
        message: result.message || "Houve um erro ao processar o boleto.",
        type: "error",
        content: (
          <button
            onClick={() =>
              window.open(
                `https://wa.me/${whatsappNumber}?text=Quero efetuar o pagamento com ${paymentMethod} e deu erro, o que posso fazer?`,
                "_blank"
              )
            }
            className={styles.whatsappButton}
          >
            Contatar via WhatsApp
          </button>
        ),
      });
    }
  };

  const sendConfirmationEmail = async (checkoutData) => {
    try {
      const emailData = {
        to: participants[0].email,
        subject: "Confirmação de Pagamento - Congresso Autismo MA 2025",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="text-align: center; padding-bottom: 20px;">
            <img src="https://congressoautismoma.com.br/assets/logo-no-text-77g-YwKu.png" alt="Congresso Autismo MA" style="max-width: 150px;" />
              <h1 style="color: #2c3e50; margin: 0;">Congresso Autismo MA 2025</h1>
              <p style="color: #7f8c8d; font-size: 14px;">Checkout Seguro</p>
            </div>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
              <h2 style="color: #34495e; margin-top: 0;">Confirmação de Pagamento</h2>
              <p style="color: #555;">Olá ${participants[0].name},</p>
              <p style="color: #555;">Seu pagamento foi confirmado com sucesso! Aqui estão os detalhes da sua compra:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #333;">Transação</td>
                  <td style="padding: 8px; border: 1px solid #ddd; color: #555;">${
                    checkoutData.transactionId
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #333;">Valor Total</td>
                  <td style="padding: 8px; border: 1px solid #ddd; color: #555;">R$ ${
                    checkoutData.totalAmount
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #333;">Quantidade de Ingressos</td>
                  <td style="padding: 8px; border: 1px solid #ddd; color: #555;">${
                    checkoutData.orderDetails.ticketQuantity
                  } (${checkoutData.orderDetails.fullTickets} inteiros, ${
          checkoutData.orderDetails.halfTickets
        } meia)</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #333;">Data</td>
                  <td style="padding: 8px; border: 1px solid #ddd; color: #555;">${new Date(
                    checkoutData.timestamp
                  ).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #333;">Método de Pagamento</td>
                  <td style="padding: 8px; border: 1px solid #ddd; color: #555;">${
                    checkoutData.paymentMethod
                  }</td>
                </tr>
              </table>
              <p style="color: #555;">Obrigado por sua participação! Estamos ansiosos para recebê-lo no evento. Qualquer dúvida, entre em contato conosco.</p>
            </div>
            <div style="text-align: center; padding-top: 20px; color: #7f8c8d; font-size: 12px;">
              <p>Equipe Congresso Autismo MA</p>
              <p><a href="mailto:suporte@congressoautismoma.com.br" style="color: #3498db; text-decoration: none;">suporte@congressoautismoma.com.br</a></p>
            </div>
          </div>
        `,
      };

      await axios.post("http://localhost:5000/api/send-email", emailData); // Ajuste para sua URL de produção
      console.log("Email de confirmação enviado para:", participants[0].email);
    } catch (error) {
      console.error("Erro ao enviar email de confirmação:", error);
    }
  };

  const handleBoletoInputChange = (field, value) => {
    setBoletoData({
      ...boletoData,
      [field]: value,
    });
  };

  const closeModal = () =>
    setModalState({ ...modalState, isOpen: false, content: null });

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.order}>
          <div className={styles.description}>
            <img src={logo} alt="Logo" />
            <div className={styles.text}>
              <h1>Congresso Autismo MA 2025</h1>
              <span>Checkout seguro</span>
              <h2>Descrição</h2>
              <p>
                Passaporte para dois dias: 31 de maio e 1º de junho! Participe
                do maior congresso sobre Neurodiversidade, com uma abordagem
                multidisciplinar e foco em intervenções terapêuticas. Junte-se a
                especialistas, profissionais da saúde e educadores em um evento
                dedicado à conscientização, troca de conhecimento e avanços na
                área.
              </p>
            </div>
          </div>

          <div className={styles.orderSummary}>
            <h2>Detalhes da compra:</h2>
            <div className={styles.summaryItem}>
              <label htmlFor="">
                <p>Quantidade de ingresso(s)</p>
                <select
                  value={ticketQuantity}
                  onChange={handleTicketQuantityChange}
                >
                  {Array.from({ length: 60 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      {index + 1} ingresso(s)
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className={styles.summaryItem}>
              <label>
                <p>Ingressos inteiros: {ticketQuantity - halfTickets}</p>
              </label>
              <span>R$ {calculateTotal().valueTicketsAll}</span>
            </div>

            {halfTickets > 0 && (
              <div className={styles.summaryItem}>
                <label>
                  <p>Ingressos meia: {halfTickets}</p>
                </label>
                <span>R$ {calculateTotal().valueTicketsHalf}</span>
              </div>
            )}

            {!isCouponApplied ? (
              <div className={styles.summaryItem}>
                <label>
                  <p>Cupom de desconto</p>
                  <div className={styles.couponInputWrapper}>
                    <input
                      type="text"
                      placeholder="Digite seu cupom"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value.toLowerCase())}
                    />
                    <button onClick={handleApplyCoupon} disabled={!coupon}>
                      Aplicar
                    </button>
                  </div>
                </label>
              </div>
            ) : (
              <div className={styles.summaryItem}>
                <label>
                  <p>Cupom aplicado: {coupon}</p>
                  <button
                    onClick={handleRemoveCoupon}
                    className={styles.removeCouponButton}
                  >
                    Remover
                  </button>
                </label>
                <span>- R$ {calculateTotal().discount}</span>
              </div>
            )}

            <div className={styles.summaryTotal}>
              <strong>Total: </strong>
              <div className={styles.value}>
                <span>10x de R$ {calculateTotal().total / 10}</span>
                <span className={styles.info}>
                  ou R$ {calculateTotal().total} à vista.
                </span>
              </div>
            </div>
          </div>

          {participants.length < ticketQuantity && (
            <div className={styles.participantForm}>
              <h2>
                Adicionar Participante ({participants.length}/{ticketQuantity})
              </h2>
              <form className={styles.form} onSubmit={handleAddParticipant}>
                <label>
                  <p>Nome completo</p>
                  <input
                    type="text"
                    placeholder="Nome completo do participante"
                    value={currentParticipant.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </label>
                <label>
                  <p>E-mail</p>
                  <input
                    type="email"
                    placeholder="E-mail do participante"
                    value={currentParticipant.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </label>
                <label>
                  <p>Telefone</p>
                  <input
                    type="number"
                    placeholder="Número do participante"
                    value={currentParticipant.number}
                    onChange={(e) =>
                      handleInputChange("number", e.target.value)
                    }
                    required
                  />
                </label>
                <label>
                  <p>CPF</p>
                  <input
                    type="text"
                    placeholder="CPF do participante"
                    value={currentParticipant.cpf}
                    onChange={(e) => handleInputChange("cpf", e.target.value)}
                    required
                  />
                </label>
                <label>
                  <p>Meia entrada?</p>
                  <span>
                    Obs: os documentos comprobatórios devem ser apresentados na
                    entrada do evento.
                  </span>
                  <input
                    type="checkbox"
                    checked={currentParticipant.isHalfPrice}
                    onChange={(e) =>
                      handleInputChange("isHalfPrice", e.target.checked)
                    }
                  />
                </label>
                <button type="submit" className={styles.addButton}>
                  Adicionar
                </button>
              </form>
            </div>
          )}
          {participants.length > 0 && (
            <ParticipantsList
              participants={participants}
              setParticipants={setParticipants}
              halfTickets={halfTickets}
              setHalfTickets={setHalfTickets}
            />
          )}
        </div>
        <div>
          <PaymentMethodsComponent setPaymentMethod={setPaymentMethod} />
          <form
            className={styles.payment}
            onSubmit={
              paymentMethod === "creditCard"
                ? handleSubmit
                : handleBoletoPayment
            }
          >
            {paymentMethod === "creditCard" ? (
              <div className={styles.paymentDetails}>
                <h2>Pagamento com Cartão de Crédito</h2>
                <label>
                  <p>Número do cartão</p>
                  <input
                    type="text"
                    placeholder="Digite o número do cartão"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <p>Nome no cartão</p>
                  <input
                    type="text"
                    placeholder="Nome como está no cartão"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <p>Vencimento (MM/AA)</p>
                  <input
                    type="text"
                    placeholder="MM/AAAA"
                    value={Maturity}
                    onChange={(e) => setMaturity(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <p>CVC</p>
                  <input
                    type="text"
                    placeholder="Digite o CVC"
                    value={cardCode}
                    onChange={(e) => setCardCode(e.target.value)}
                    maxLength="3"
                    required
                  />
                </label>
                <label>
                  <p>Quantidade de parcelas</p>
                  <select
                    value={QuantityInstalment}
                    onChange={(e) => setQuantityInstalment(e.target.value)}
                    required
                  >
                    <option value="">Escolha a quantidade de parcelas</option>
                    {Array.from({ length: 10 }, (_, index) => (
                      <option key={index + 1} value={index + 1}>
                        {index + 1} Parcela(s) de R${" "}
                        {(calculateTotal().total / (index + 1)).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : paymentMethod === "pix" ? (
              <div className={styles.paymentDetails}>
                <h2>Pagamento com PIX</h2>
                <p>
                  Após clicar no botão abaixo, você verá o QR Code ou a chave
                  PIX para realizar o pagamento. O valor total é:{" "}
                  <strong>R$ {calculateTotal().total}</strong>.
                </p>
              </div>
            ) : (
              <div className={styles.paymentDetails}>
                <h2>Pagamento com Boleto</h2>
                <label>
                  <p>Rua</p>
                  <input
                    type="text"
                    placeholder="Digite o nome da rua"
                    value={boletoData.street}
                    onChange={(e) =>
                      handleBoletoInputChange("street", e.target.value)
                    }
                    required
                  />
                </label>
                <label>
                  <p>Número</p>
                  <input
                    type="text"
                    placeholder="Digite o número"
                    value={boletoData.number}
                    onChange={(e) =>
                      handleBoletoInputChange("number", e.target.value)
                    }
                    required
                  />
                </label>
                <label>
                  <p>Bairro</p>
                  <input
                    type="text"
                    placeholder="Digite o bairro"
                    value={boletoData.district}
                    onChange={(e) =>
                      handleBoletoInputChange("district", e.target.value)
                    }
                    required
                  />
                </label>
                <label>
                  <p>CEP</p>
                  <input
                    type="text"
                    placeholder="Digite o CEP"
                    value={boletoData.zipCode}
                    onChange={(e) =>
                      handleBoletoInputChange("zipCode", e.target.value)
                    }
                    required
                  />
                </label>
                <label>
                  <p>Cidade</p>
                  <input
                    type="text"
                    placeholder="Digite a cidade"
                    value={boletoData.city}
                    onChange={(e) =>
                      handleBoletoInputChange("city", e.target.value)
                    }
                    required
                  />
                </label>
                <label>
                  <p>Estado (ex.: SP)</p>
                  <input
                    type="text"
                    placeholder="Digite o estado"
                    value={boletoData.state}
                    onChange={(e) =>
                      handleBoletoInputChange("state", e.target.value)
                    }
                    maxLength="2"
                    required
                  />
                </label>
                <p>
                  O valor total é: <strong>R$ {calculateTotal().total}</strong>.
                </p>
              </div>
            )}
            {paymentMethod === "creditCard" ? (
              <button type="submit" disabled={loading}>
                {loading ? "Processando..." : "Fazer pagamento"}
              </button>
            ) : paymentMethod === "pix" ? (
              <button onClick={handlePixPayment} disabled={loading}>
                {loading ? "Processando..." : "Gerar PIX"}
              </button>
            ) : (
              <button type="submit" disabled={loading}>
                {loading ? "Processando..." : "Gerar Boleto"}
              </button>
            )}
          </form>
        </div>
      </div>
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        content={modalState.content}
      />
    </div>
  );
};

export default PaymentForm;
