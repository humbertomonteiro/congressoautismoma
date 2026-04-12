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
import useRole from "../../../../data/hooks/useRole";
import useAuth from "../../../../data/hooks/useAuth";
import useEventConfig from "../../../../data/hooks/useEventConfig";

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

  const { isVendedor } = useRole();
  const { sellerId: loggedSellerId, sellerName: loggedSellerName } = useAuth();
  const { config: eventConfig } = useEventConfig();

  const [installments, setInstallments] = useState("1");
  const [cardBrand, setCardBrand] = useState("Visa");
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState("");

  useEffect(() => {
    getDocs(collection(db, "sellers"))
      .then((snap) => {
        setSellers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      })
      .catch(() => {});
  }, []);

  // Para role vendedor: pré-seleciona e trava o seller vinculado
  useEffect(() => {
    if (isVendedor && loggedSellerId) {
      setSelectedSeller(loggedSellerId);
    }
  }, [isVendedor, loggedSellerId]);

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
        status: isVendedor ? "pending" : "approved",
        paymentMethod: formState.paymentMethod,
        observation: formState.observation,
        seller: selectedSeller
          ? (() => {
              const s = sellers.find((s) => s.id === selectedSeller);
              return s
                ? { id: s.id, name: s.name, document: s.document }
                : null;
            })()
          : null,
        totalAmount: updatedTotals.total,
        eventName: eventConfig.eventName,
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

  const SectionTitle = ({ children }) => (
    <Typography
      sx={{ color: "#0f172a", fontWeight: 700, fontSize: "0.95rem", mb: 2 }}
    >
      {children}
    </Typography>
  );

  const sxCard = {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    p: "20px",
    mb: 2,
  };

  return (
    <div className={styles.section}>
      <Box sx={{ mb: 3 }}>
        <Typography
          sx={{ color: "#0f172a", fontWeight: 700, fontSize: "1.4rem" }}
        >
          Adicionar Pagamento Manual
        </Typography>
        <Typography sx={{ color: "#64748b", fontSize: "0.85rem", mt: 0.5 }}>
          Registre um checkout manualmente no sistema
        </Typography>
      </Box>

      {/* Seção de Pagamento */}
      <Box sx={sxCard}>
        <SectionTitle>Dados do Pagamento</SectionTitle>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
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
              label="Tipo de Pagamento"
              sx={{ borderRadius: "8px" }}
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
                label="Bandeira"
                sx={{ borderRadius: "8px" }}
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
                label="Parcelas"
                sx={{ borderRadius: "8px" }}
                disabled={formState.loading}
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <MenuItem key={i + 1} value={String(i + 1)}>
                    {i + 1}x
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
          <TextField
            label="Inteiros"
            value={formState.allTickets}
            onChange={(e) => handleTicketTypeChange("all", e.target.value)}
            type="number"
            className={styles.shortInput}
            disabled={formState.loading}
            inputProps={{ min: 0 }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />
          <TextField
            label="Meia"
            value={formState.halfTickets}
            onChange={(e) => handleTicketTypeChange("half", e.target.value)}
            type="number"
            className={styles.shortInput}
            disabled={formState.loading}
            inputProps={{ min: 0 }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />
          <TextField
            label="Social"
            value={formState.socialTickets || 0}
            onChange={(e) => handleTicketTypeChange("social", e.target.value)}
            type="number"
            className={styles.shortInput}
            disabled={formState.loading}
            inputProps={{ min: 0 }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />
        </Box>

        {formState.paymentMethod !== "courtesy" && (
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              alignItems: "center",
              flexWrap: "wrap",
              mb: 2,
            }}
          >
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
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
            {!formState.coupon.isApplied ? (
              <Button
                variant="outlined"
                onClick={handleApplyCoupon}
                disabled={!formState.coupon.code || formState.loading}
                sx={{
                  borderColor: "#3b82f6",
                  color: "#3b82f6",
                  borderRadius: "8px",
                  textTransform: "none",
                  height: "40px",
                  "&:hover": {
                    borderColor: "#2563eb",
                    backgroundColor: "#eff6ff",
                  },
                }}
              >
                Aplicar cupom
              </Button>
            ) : (
              <Button
                variant="outlined"
                onClick={handleRemoveCoupon}
                disabled={formState.loading}
                sx={{
                  borderColor: "#fecaca",
                  color: "#dc2626",
                  borderRadius: "8px",
                  textTransform: "none",
                  height: "40px",
                  "&:hover": {
                    borderColor: "#dc2626",
                    backgroundColor: "#fff1f2",
                  },
                }}
              >
                Remover cupom
              </Button>
            )}
          </Box>
        )}

        <FormControl
          fullWidth
          disabled={formState.loading || isVendedor}
          sx={{ mb: 2 }}
        >
          <InputLabel>
            {isVendedor
              ? "Vendedor (vinculado à sua conta)"
              : "Vendedor credenciado (opcional)"}
          </InputLabel>
          <Select
            value={selectedSeller}
            label={
              isVendedor
                ? "Vendedor (vinculado à sua conta)"
                : "Vendedor credenciado (opcional)"
            }
            onChange={(e) => !isVendedor && setSelectedSeller(e.target.value)}
            sx={{ borderRadius: "8px" }}
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

        <TextField
          fullWidth
          label="Observações (opcional)"
          value={formState.observation}
          onChange={(e) =>
            setFormState((prev) => ({ ...prev, observation: e.target.value }))
          }
          multiline
          rows={3}
          disabled={formState.loading}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
        />
      </Box>

      {/* Seção de Participantes */}
      <Box sx={sxCard}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 2 }}>
          <Typography
            sx={{ color: "#0f172a", fontWeight: 700, fontSize: "0.95rem" }}
          >
            Participantes
          </Typography>
          <Typography
            sx={{
              fontSize: "0.78rem",
              color:
                participants.length >= ticketQuantity ? "#16a34a" : "#64748b",
              fontWeight: 500,
            }}
          >
            {participants.length}/{ticketQuantity} adicionado
            {participants.length !== 1 ? "s" : ""}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <TextField
            label="Nome completo"
            value={currentParticipant.name}
            onChange={(e) => handleParticipantChange("name", e.target.value)}
            sx={{
              flex: "1 1 220px",
              "& .MuiOutlinedInput-root": { borderRadius: "8px" },
            }}
            disabled={formState.loading}
            required
          />
          <TextField
            label="E-mail"
            value={currentParticipant.email}
            onChange={(e) => handleParticipantChange("email", e.target.value)}
            sx={{
              flex: "1 1 220px",
              "& .MuiOutlinedInput-root": { borderRadius: "8px" },
            }}
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
                sx={{
                  flex: "1 1 160px",
                  "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                }}
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
                sx={{
                  flex: "1 1 160px",
                  "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                }}
                required
              />
            )}
          </InputMask>
          <Button
            variant="outlined"
            onClick={handleAddParticipant}
            disabled={
              formState.loading || participants.length >= ticketQuantity
            }
            sx={{
              height: "56px",
              borderColor: "#3b82f6",
              color: "#3b82f6",
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 500,
              flexShrink: 0,
              "&:hover": { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
              "&:disabled": { borderColor: "#e2e8f0", color: "#cbd5e1" },
            }}
          >
            + Adicionar
          </Button>
        </Box>
      </Box>

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
      <Box sx={{ ...sxCard, mb: 3 }}>
        <SectionTitle>Resumo do Pedido</SectionTitle>
        {[
          formState.allTickets > 0 && {
            label: `Inteiro × ${formState.allTickets}`,
            value: `R$ ${totals.valueTicketsAll}`,
          },
          formState.halfTickets > 0 && {
            label: `Meia × ${formState.halfTickets}`,
            value: `R$ ${totals.valueTicketsHalf}`,
          },
          (formState.socialTickets || 0) > 0 && {
            label: `Social × ${formState.socialTickets}`,
            value: `R$ ${totals.valueTicketsSocial || "0.00"}`,
          },
          formState.coupon.isApplied && {
            label: `Desconto (${formState.coupon.code})`,
            value: `- R$ ${totals.discount}`,
            color: "#16a34a",
          },
        ]
          .filter(Boolean)
          .map((row, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                py: 0.75,
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <Typography sx={{ color: "#64748b", fontSize: "0.88rem" }}>
                {row.label}
              </Typography>
              <Typography
                sx={{
                  color: row.color || "#475569",
                  fontSize: "0.88rem",
                  fontWeight: 500,
                }}
              >
                {row.value}
              </Typography>
            </Box>
          ))}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            pt: 1.5,
            mt: 0.5,
          }}
        >
          <Typography
            sx={{ color: "#0f172a", fontWeight: 700, fontSize: "1rem" }}
          >
            Total
          </Typography>
          <Typography
            sx={{ color: "#0f172a", fontWeight: 700, fontSize: "1rem" }}
          >
            R$ {totals.total}
          </Typography>
        </Box>
      </Box>

      {/* Botão Finalizar */}
      <Button
        variant="contained"
        onClick={handleSaveCheckout}
        disabled={formState.loading || participants.length === 0}
        sx={{
          backgroundColor: "#3b82f6",
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.95rem",
          px: 4,
          py: 1.25,
          boxShadow: "none",
          "&:hover": { backgroundColor: "#2563eb", boxShadow: "none" },
          "&:disabled": { backgroundColor: "#e2e8f0", color: "#94a3b8" },
        }}
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
