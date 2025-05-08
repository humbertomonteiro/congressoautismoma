// src/components/admin/AddManualPayment/index.jsx
import React, { useState } from "react";
import styles from "./addManualPayment.module.css";
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
} from "@mui/material";
import InputMask from "react-input-mask";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../../../../firebaseConfig";
import ParticipantsList from "../../../checkout/ParticipantsList";
import usePaymentForm from "../../../../data/hooks/usePaymentForm";
import Modal from "../../../checkout/Modal";
import PaymentService from "../../../../data/services/PaymentService";
import { useDashboard } from "../../../../data/contexts/DashboardContext";

const EMAIL_FROM = import.meta.env.VITE_EMAIL_FROM;

const AddManualPayment = () => {
  const {
    formState,
    setFormState,
    participants,
    setParticipants,
    currentParticipant,
    setCurrentParticipant,
    totals,
    setTotals,
    modalState,
    setModalState,
    handleTicketQuantityChange,
    handleAddParticipant,
    handleApplyCoupon,
    handleRemoveCoupon,
  } = usePaymentForm();

  const { updateMetrics } = useDashboard();
  const [installments, setInstallments] = useState("1");
  const [cardBrand, setCardBrand] = useState("Visa");

  const paymentMethods = [
    { value: "creditCard", label: "Cartão de Crédito" },
    { value: "pix", label: "Pix" },
    { value: "cash", label: "Dinheiro" },
    { value: "internal", label: "Pagamento Interno" },
    { value: "boleto", label: "Boleto" },
    { value: "debitCard", label: "Cartão de Débito" },
    { value: "courtesy", label: "Cortesia" },
    { value: "falha-tecnica", label: "Falha técnica" },
  ];

  const cardBrands = [
    { value: "Visa", label: "Visa" },
    { value: "Master", label: "Mastercard" },
    { value: "Elo", label: "Elo" },
  ];

  const handleParticipantChange = (field, value) => {
    setCurrentParticipant((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveCheckout = async () => {
    if (participants.length !== formState.ticketQuantity) {
      setModalState({
        isOpen: true,
        title: "Participantes Incompletos",
        message: `Você adicionou ${participants.length} participante(s), mas selecionou ${formState.ticketQuantity} ingresso(s).`,
        type: "error",
      });
      return;
    }

    if (
      participants.some((p) => !p.name || !p.email || !p.number || !p.document)
    ) {
      setModalState({
        isOpen: true,
        title: "Dados Incompletos",
        message:
          "Todos os participantes devem ter nome, e-mail, telefone e documento preenchidos.",
        type: "error",
      });
      return;
    }

    if (formState.paymentMethod === "creditCard" && !installments) {
      setModalState({
        isOpen: true,
        title: "Parcelas Não Selecionadas",
        message:
          "Selecione o número de parcelas para pagamento com cartão de crédito.",
        type: "error",
      });
      return;
    }

    if (
      (formState.paymentMethod === "creditCard" ||
        formState.paymentMethod === "debitCard") &&
      !cardBrand
    ) {
      setModalState({
        isOpen: true,
        title: "Bandeira Não Selecionada",
        message: "Selecione a bandeira do cartão.",
        type: "error",
      });
      return;
    }

    setFormState((prev) => ({ ...prev, loading: true }));

    try {
      // Recalcular os totais antes de salvar
      let updatedTotals = await PaymentService.calculateTotals({
        ticketQuantity: formState.ticketQuantity,
        halfTickets: formState.halfTickets,
        coupon: formState.coupon.isApplied ? formState.coupon.code : "",
      });

      // Sobrescrever os totais para cortesia
      if (formState.paymentMethod === "courtesy") {
        updatedTotals = {
          valueTicketsAll: "0.00",
          valueTicketsHalf: "0.00",
          discount: updatedTotals.discount || "0.00",
          total: "0.00",
          totalInCents: 0,
        };
      }

      // Validação dos valores
      if (formState.paymentMethod !== "courtesy" && updatedTotals.total <= 0) {
        throw new Error(
          "O valor total deve ser maior que zero para métodos pagos."
        );
      }
      if (
        formState.paymentMethod === "courtesy" &&
        updatedTotals.total !== "0.00"
      ) {
        throw new Error("O valor total deve ser zero para cortesia.");
      }

      setTotals(updatedTotals);

      // Gere o transactionId uma única vez
      const transactionId = `MANUAL_${Date.now()}`;

      const checkoutData = {
        transactionId: transactionId,
        timestamp: new Date().toISOString(),
        status: "approved",
        paymentMethod: formState.paymentMethod,
        observation: formState.observation,
        totalAmount: updatedTotals.total,
        eventName: "Congresso Autismo MA 2025",
        participants: participants.map((p) => ({
          name: p.name,
          email: p.email,
          number: p.number,
          cpf: p.documentType === "cpf" ? p.document : undefined,
          ticketType: p.isHalfPrice ? "Meia" : "Inteira",
        })),
        paymentId: transactionId,
        orderDetails: {
          ticketQuantity: formState.ticketQuantity,
          fullTickets: formState.ticketQuantity - formState.halfTickets,
          halfTickets: formState.halfTickets,
          fullTicketsValue: updatedTotals.valueTicketsAll,
          halfTicketsValue: updatedTotals.valueTicketsHalf,
          discount: updatedTotals.discount,
          coupon: formState.coupon.isApplied ? formState.coupon.code : null,
        },
        paymentDetails: {
          manual: true,
          courtesy: formState.paymentMethod === "courtesy",
          ...(formState.paymentMethod === "creditCard" && {
            creditCard: {
              installments,
              brand: cardBrand,
            },
          }),
          ...(formState.paymentMethod === "debitCard" && {
            debitCard: {
              brand: cardBrand,
            },
          }),
          ...(formState.paymentMethod === "pix" && {
            pix: {},
          }),
          ...(formState.paymentMethod === "boleto" && {
            boleto: {},
          }),
          ...(formState.paymentMethod === "cash" && {
            cash: {},
          }),
          ...(formState.paymentMethod === "internal" && {
            internal: {},
          }),
        },
        document: participants[0]?.document || "",
        sentEmails: [],
        qrCodesSent: false,
      };

      // Salve o checkout no Firestore primeiro
      const docRef = await addDoc(collection(db, "checkouts"), checkoutData);
      console.log("Checkout salvo com ID:", docRef.id);

      // Adicionar templates ao pendingEmails
      await PaymentService.addAllTemplatesToPendingEmails(
        docRef.id,
        "approved"
      );

      // Enviar emails pra todos os participantes
      const emailResponses = [];
      for (const participant of participants) {
        const emailData = {
          checkoutId: docRef.id,
          from: EMAIL_FROM,
          to: participant.email,
          subject: "Confirmação de Pagamento - Congresso Autismo MA 2025",
          data: {
            name: participant.name,
            transactionId: transactionId,
            fullTickets: formState.ticketQuantity - formState.halfTickets,
            valueTicketsAll: updatedTotals.valueTicketsAll,
            halfTickets: formState.halfTickets,
            valueTicketsHalf: updatedTotals.valueTicketsHalf,
            coupon: formState.coupon.isApplied ? formState.coupon.code : "",
            discount: formState.coupon.isApplied
              ? updatedTotals.discount
              : "0.00",
            total: updatedTotals.total,
            installments:
              formState.paymentMethod === "creditCard"
                ? checkoutData.paymentDetails.creditCard?.installments || "1"
                : "1",
          },
        };

        console.log("EmailData construído para:", participant.email, emailData);
        if (
          !emailData.from ||
          !emailData.to ||
          !emailData.subject ||
          !emailData.data ||
          !emailData.checkoutId
        ) {
          console.error(
            "Campos obrigatórios faltando no emailData:",
            emailData
          );
          throw new Error(
            "Dados insuficientes para enviar o email de confirmação."
          );
        }

        console.log("Enviando email de confirmação para:", participant.email);
        try {
          const emailResponse = await PaymentService.sendConfirmationEmail(
            emailData
          );
          console.log(
            "Resposta do envio de email para",
            participant.email,
            ":",
            emailResponse
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

      // Atualizar as métricas do dashboard
      await updateMetrics();

      // Atualizar localStorage localmente
      // const cachedCheckouts = JSON.parse(
      //   localStorage.getItem("dashboard_checkouts") || "[]"
      // );
      // cachedCheckouts.push(checkoutData);
      // localStorage.setItem(
      //   "dashboard_checkouts",
      //   JSON.stringify(cachedCheckouts)
      // );

      // setModalState({
      //   isOpen: true,
      //   title: "Checkout Adicionado",
      //   message: "Checkout manual adicionado com sucesso!",
      //   type: "success",
      // });

      setFormState({
        paymentMethod: "creditCard",
        loading: false,
        ticketQuantity: 1,
        halfTickets: 0,
        coupon: { code: "", isApplied: false },
        observation: "",
      });
      setParticipants([]);
      setCurrentParticipant({
        name: "",
        email: "",
        number: "",
        document: "",
        documentType: "cpf",
        isHalfPrice: false,
      });
      setInstallments("1");
      setCardBrand("visa");
    } catch (error) {
      console.error("Erro ao salvar checkout manual:", error);
      setModalState({
        isOpen: true,
        title: "Erro ao Salvar",
        message: "Erro ao adicionar checkout manual: " + error.message,
        type: "error",
      });
    } finally {
      setFormState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.title}>
        <h1>Adicionar Pagamento Manual</h1>
      </div>

      {/* Seção Geral */}
      <div className={styles.headerInputs}>
        <Box sx={{ width: "100%", display: "flex", gap: 2 }}>
          <FormControl className={styles.shortInput}>
            <InputLabel>Tipo de Pagamento</InputLabel>
            <Select
              value={formState.paymentMethod}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  paymentMethod: e.target.value,
                }))
              }
              disabled={formState.loading}
            >
              {paymentMethods.map((method) => (
                <MenuItem key={method.value} value={method.value}>
                  {method.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {(formState.paymentMethod === "creditCard" ||
            formState.paymentMethod === "debitCard") && (
            <FormControl className={styles.shortInput}>
              <InputLabel>Bandeira</InputLabel>
              <Select
                value={cardBrand}
                onChange={(e) => setCardBrand(e.target.value)}
                disabled={formState.loading}
              >
                {cardBrands.map((brand) => (
                  <MenuItem key={brand.value} value={brand.value}>
                    {brand.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {formState.paymentMethod === "creditCard" && (
            <FormControl className={styles.shortInput}>
              <InputLabel>Parcelas</InputLabel>
              <Select
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                disabled={formState.loading}
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <MenuItem key={i + 1} value={String(i + 1)}>
                    {i + 1} Parcela(s)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            label="Quantidade de Ingressos"
            value={formState.ticketQuantity}
            onChange={handleTicketQuantityChange}
            type="number"
            className={styles.shortInput}
            disabled={formState.loading}
            inputProps={{ min: 1 }}
          />
          {formState.paymentMethod !== "courtesy" && (
            <Box className={styles.couponWrapper}>
              <TextField
                label="Cupom (opcional)"
                value={formState.coupon.code}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    coupon: { ...prev.coupon, code: e.target.value },
                  }))
                }
                className={styles.shortInput}
                disabled={formState.loading}
              />
              {!formState.coupon.isApplied ? (
                <Button
                  variant="outlined"
                  onClick={handleApplyCoupon}
                  disabled={!formState.coupon.code || formState.loading}
                >
                  Aplicar
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  onClick={handleRemoveCoupon}
                  disabled={formState.loading}
                >
                  Remover
                </Button>
              )}
            </Box>
          )}
        </Box>
        <Box sx={{ width: "100%" }}>
          <TextField
            sx={{ width: "100%" }}
            label="Observações (opcional)"
            value={formState.observation}
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                observation: e.target.value,
              }))
            }
            className={styles.observationField}
            multiline
            rows={4}
            disabled={formState.loading}
          />
        </Box>
      </div>

      {/* Seção de Participantes */}
      <div className={styles.participantSection}>
        <Typography variant="h6" gutterBottom>
          Adicionar Participante
        </Typography>
        <div className={styles.participantFields}>
          <TextField
            label="Nome"
            value={currentParticipant.name}
            onChange={(e) => handleParticipantChange("name", e.target.value)}
            className={styles.fullWidthField}
            disabled={formState.loading}
            required
          />
          <TextField
            label="Email"
            value={currentParticipant.email}
            onChange={(e) => handleParticipantChange("email", e.target.value)}
            className={styles.fullWidthField}
            disabled={formState.loading}
            required
          />
          <InputMask
            mask="(99) 99999-9999"
            value={currentParticipant.number}
            onChange={(e) => handleParticipantChange("number", e.target.value)}
            disabled={formState.loading}
          >
            {(inputProps) => (
              <TextField
                {...inputProps}
                label="Telefone"
                className={styles.shortField}
                required
              />
            )}
          </InputMask>
          <InputMask
            mask="999.999.999-99"
            value={currentParticipant.document}
            onChange={(e) =>
              handleParticipantChange("document", e.target.value)
            }
            disabled={formState.loading}
          >
            {(inputProps) => (
              <TextField
                {...inputProps}
                label="CPF"
                className={styles.shortField}
                required
              />
            )}
          </InputMask>
          {formState.paymentMethod !== "courtesy" && (
            <FormControl className={styles.shortField}>
              <InputLabel>Tipo de Ingresso</InputLabel>
              <Select
                value={currentParticipant.isHalfPrice ? "Meia" : "Inteira"}
                onChange={(e) =>
                  handleParticipantChange(
                    "isHalfPrice",
                    e.target.value === "Meia"
                  )
                }
                disabled={formState.loading}
              >
                <MenuItem value="Inteira">Inteira</MenuItem>
                <MenuItem value="Meia">Meia</MenuItem>
              </Select>
            </FormControl>
          )}
          <Button
            sx={{ height: "56px", marginTop: "8px" }}
            variant="outlined"
            color="primary"
            onClick={handleAddParticipant}
            className={styles.addButton}
            disabled={
              formState.loading ||
              participants.length >= formState.ticketQuantity
            }
          >
            Adicionar Participante
          </Button>
        </div>
      </div>

      {/* Lista de Participantes */}
      {participants.length > 0 && (
        <ParticipantsList
          participants={participants}
          setParticipants={setParticipants}
          halfTickets={formState.halfTickets}
          setHalfTickets={(value) =>
            setFormState((prev) => ({ ...prev, halfTickets: value }))
          }
        />
      )}

      {/* Resumo */}
      <div className={styles.summary}>
        <h3>Resumo</h3>
        <p>
          Ingressos Inteiros: {formState.ticketQuantity - formState.halfTickets}{" "}
          x R$ {totals.valueTicketsAll}
        </p>
        {formState.halfTickets > 0 && (
          <p>
            Ingressos Meia: {formState.halfTickets} x R${" "}
            {totals.valueTicketsHalf}
          </p>
        )}
        {formState.coupon.isApplied && (
          <p>
            Desconto ({formState.coupon.code}): R$ {totals.discount}
          </p>
        )}
        <p className={styles.total}>
          <strong>Total: R$ {totals.total}</strong>
        </p>
      </div>

      {/* Botão Finalizar */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleSaveCheckout}
        disabled={formState.loading || participants.length === 0}
      >
        {formState.loading ? "Salvando..." : "Finalizar Checkout"}
      </Button>

      {/* Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() =>
          setModalState((prev) => ({ ...prev, isOpen: false, content: null }))
        }
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        content={modalState.content}
      />

      {formState.loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className={styles.spinner}></div>
            <p>Processando pagamento, por favor, não recarregue a página...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddManualPayment;
