// src/components/admin/AddManualPayment/index.jsx
import { useState, useEffect } from "react";
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
  Avatar,
} from "@mui/material";
import InputMask from "react-input-mask";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../../../../../firebaseConfig";
import ParticipantsList from "../../../checkout/ParticipantsList";
import usePaymentForm from "../../../../data/hooks/usePaymentForm";
import Modal from "../../../checkout/Modal";
import PaymentService from "../../../../data/services/PaymentService";
import { toast } from "react-toastify";
import { MdPerson, MdVerified } from "react-icons/md";

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
    ticketQuantity,
    handleTicketTypeChange,
    handleAddParticipant,
    handleApplyCoupon,
    handleRemoveCoupon,
  } = usePaymentForm();

  const [installments, setInstallments] = useState("1");
  const [cardBrand, setCardBrand] = useState("Visa");
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState("");

  useEffect(() => {
    getDocs(collection(db, "sellers"))
      .then((snap) =>
        setSellers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      )
      .catch(() => {});
  }, []);

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
    if (participants.length !== ticketQuantity) {
      setModalState({
        isOpen: true,
        title: "Participantes Incompletos",
        message: `Você adicionou ${participants.length} participante(s), mas selecionou ${ticketQuantity} ingresso(s).`,
        type: "error",
      });
      return;
    }

    if (
      participants.some((p) => !p.name || !p.email || !p.phone || !p.document)
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
    const toastId = toast.loading("Adicionando checkout...");

    try {
      let updatedTotals = await PaymentService.calculateTotals({
        allTickets: formState.allTickets,
        halfTickets: formState.halfTickets,
        socialTickets: formState.socialTickets || 0,
        coupon: formState.coupon.isApplied ? formState.coupon.code : "",
      });

      if (formState.paymentMethod === "courtesy") {
        updatedTotals = {
          valueTicketsAll: "0.00",
          valueTicketsHalf: "0.00",
          valueTicketsSocial: "0.00",
          discount: updatedTotals.discount || "0.00",
          total: "0.00",
          totalInCents: 0,
        };
      }

      if (formState.paymentMethod !== "courtesy" && updatedTotals.total <= 0) {
        throw new Error(
          "O valor total deve ser maior que zero para métodos pagos."
        );
      }

      setTotals(updatedTotals);

      const transactionId = `MANUAL_${Date.now()}`;

      const checkoutData = {
        transactionId,
        timestamp: new Date().toISOString(),
        status: "approved",
        paymentMethod: formState.paymentMethod,
        observation: formState.observation,
        seller: selectedSeller
          ? (() => {
              const s = sellers.find((s) => s.id === selectedSeller);
              return s ? { id: s.id, name: s.name, document: s.document } : null;
            })()
          : null,
        totalAmount: updatedTotals.total,
        eventName: "Congresso Autismo MA 2026",
        paymentId: transactionId,
        document: participants[0]?.document || "",
        sentEmails: [],
        qrCodesSent: false,
        orderDetails: {
          allTickets: formState.allTickets,
          halfTickets: formState.halfTickets,
          socialTickets: formState.socialTickets || 0,
          valueTicketsAll: updatedTotals.valueTicketsAll,
          valueTicketsHalf: updatedTotals.valueTicketsHalf,
          valueTicketsSocial: updatedTotals.valueTicketsSocial || "0.00",
          discount: updatedTotals.discount,
          total: updatedTotals.total,
          coupon: formState.coupon.isApplied ? formState.coupon.code : null,
        },
        paymentDetails: {
          manual: true,
          courtesy: formState.paymentMethod === "courtesy",
          ...(formState.paymentMethod === "creditCard" && {
            creditCard: { installments, brand: cardBrand },
          }),
          ...(formState.paymentMethod === "debitCard" && {
            debitCard: { brand: cardBrand },
          }),
          ...(formState.paymentMethod === "pix" && { pix: {} }),
          ...(formState.paymentMethod === "boleto" && { boleto: {} }),
          ...(formState.paymentMethod === "cash" && { cash: {} }),
          ...(formState.paymentMethod === "internal" && { internal: {} }),
        },
      };

      const { checkoutId, participantIds } =
        await PaymentService.createManualCheckout({
          ...checkoutData,
          participants,
        });

      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        const participantId = participantIds[i];
        try {
          await PaymentService.sendConfirmationEmail({
            checkoutId,
            participantId,
            data: {
              name: participant.name,
              transactionId,
              fullTickets: formState.allTickets,
              valueTicketsAll: updatedTotals.valueTicketsAll,
              halfTickets: formState.halfTickets,
              valueTicketsHalf: updatedTotals.valueTicketsHalf,
              socialTickets: formState.socialTickets || 0,
              valueTicketsSocial: updatedTotals.valueTicketsSocial || "0.00",
              coupon: formState.coupon.isApplied ? formState.coupon.code : "",
              discount: formState.coupon.isApplied
                ? updatedTotals.discount
                : "0.00",
              total: updatedTotals.total,
              installments:
                formState.paymentMethod === "creditCard" ? installments : "1",
            },
          });
        } catch (emailError) {
          console.error(
            "Erro ao enviar email para",
            participant.email,
            ":",
            emailError.message
          );
        }
      }

      setFormState({
        paymentMethod: "creditCard",
        loading: false,
        allTickets: 1,
        halfTickets: 0,
        socialTickets: 0,
        coupon: { code: "", isApplied: false },
        observation: "",
      });
      setParticipants([]);
      setCurrentParticipant({
        name: "",
        email: "",
        phone: "",
        document: "",
        documentType: "cpf",
      });
      setInstallments("1");
      setCardBrand("Visa");

      toast.update(toastId, {
        render: "Checkout adicionado com sucesso!",
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });
    } catch (error) {
      console.error("Erro ao salvar checkout manual:", error);
      toast.update(toastId, {
        render: "Erro ao adicionar checkout: " + error.message,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.title}>
        <h1>Adicionar Pagamento Manual</h1>
      </div>

      {/* Seção Geral */}
      <div className={styles.headerInputs}>
        <Box sx={{ width: "100%", display: "flex", gap: 2, flexWrap: "wrap" }}>
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
            label="Ingressos Inteiros"
            value={formState.allTickets}
            onChange={(e) => handleTicketTypeChange("all", e.target.value)}
            type="number"
            className={styles.shortInput}
            disabled={formState.loading}
            inputProps={{ min: 0 }}
          />

          <TextField
            label="Ingressos Meia"
            value={formState.halfTickets}
            onChange={(e) => handleTicketTypeChange("half", e.target.value)}
            type="number"
            className={styles.shortInput}
            disabled={formState.loading}
            inputProps={{ min: 0 }}
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

        {/* Vendedor credenciado */}
        <Box sx={{ width: "100%" }}>
          <FormControl sx={{ width: "100%" }} disabled={formState.loading}>
            <InputLabel>Vendedor credenciado (opcional)</InputLabel>
            <Select
              value={selectedSeller}
              label="Vendedor credenciado (opcional)"
              onChange={(e) => setSelectedSeller(e.target.value)}
              renderValue={(value) => {
                if (!value) return "Nenhum (venda direta)";
                const s = sellers.find((s) => s.id === value);
                return s ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar
                      src={s.photoBase64 || undefined}
                      sx={{ width: 24, height: 24, fontSize: "0.75rem" }}
                    >
                      {!s.photoURL && <MdPerson />}
                    </Avatar>
                    <span>{s.name}</span>
                    <MdVerified color="#1976D2" size={14} />
                  </Box>
                ) : (
                  "Nenhum"
                );
              }}
            >
              <MenuItem value="">
                <em>Nenhum (venda direta)</em>
              </MenuItem>
              {sellers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar
                      src={s.photoBase64 || undefined}
                      sx={{ width: 32, height: 32 }}
                    >
                      {!s.photoURL && <MdPerson />}
                    </Avatar>
                    <Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <span style={{ fontWeight: 600 }}>{s.name}</span>
                        <MdVerified color="#1976D2" size={13} />
                      </Box>
                      <Box sx={{ fontSize: "0.75rem", color: "#78909c" }}>
                        CPF: {s.document}
                      </Box>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
            multiline
            rows={4}
            disabled={formState.loading}
          />
        </Box>
      </div>

      {/* Seção de Participantes */}
      <div className={styles.participantSection}>
        <Typography variant="h6" gutterBottom>
          Adicionar Participante ({participants.length}/{ticketQuantity})
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
            value={currentParticipant.phone}
            onChange={(e) => handleParticipantChange("phone", e.target.value)}
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
          <Button
            sx={{ height: "56px", marginTop: "8px" }}
            variant="outlined"
            color="primary"
            onClick={handleAddParticipant}
            className={styles.addButton}
            disabled={
              formState.loading || participants.length >= ticketQuantity
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
          Ingressos Inteiros: {formState.allTickets} x R${" "}
          {totals.valueTicketsAll}
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
    </div>
  );
};

export default AddManualPayment;
