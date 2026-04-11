import {
  Typography,
  Box,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { IoIosArrowDown } from "react-icons/io";
import { useState } from "react";
import { doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../../../../../firebaseConfig";
import PaymentService from "../../../../data/services/PaymentService";
import { toast } from "react-toastify";
import { FaRegEdit } from "react-icons/fa";
import {
  MdCheckCircle,
  MdEmail,
  MdQrCode,
  MdPerson,
  MdBadge,
} from "react-icons/md";
import useRole from "../../../../data/hooks/useRole";

const EMAIL_FROM = import.meta.env.VITE_EMAIL_FROM;

const statusOptions = [
  { value: "approved", label: "Aprovado" },
  { value: "pending", label: "Pendente" },
  { value: "error", label: "Erro" },
  { value: "canceled", label: "Cancelado" },
  { value: "refunded", label: "Estornado" },
  { value: "test", label: "Teste" },
  { value: "expired", label: "Expirado" },
];

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

const STATUS_COLORS = {
  approved: { color: "#16a34a", bg: "#dcfce7" },
  pending: { color: "#d97706", bg: "#fef9c3" },
  error: { color: "#dc2626", bg: "#fee2e2" },
  canceled: { color: "#64748b", bg: "#f1f5f9" },
  refunded: { color: "#0891b2", bg: "#e0f2fe" },
  test: { color: "#7c3aed", bg: "#ede9fe" },
};

const InfoRow = ({ label, value }) => (
  <Box sx={{ display: "flex", gap: 1, py: 0.4 }}>
    <Typography
      sx={{
        fontSize: "0.8rem",
        color: "#94a3b8",
        minWidth: 140,
        flexShrink: 0,
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontSize: "0.8rem",
        color: "#1e293b",
        fontWeight: 500,
        wordBreak: "break-word",
      }}
    >
      {value ?? "—"}
    </Typography>
  </Box>
);

const ModalCheckoutDetails = ({
  checkout,
  setOpenDetailsModal,
  formatTimestamp,
  title,
  message,
  updateCheckoutInContext,
}) => {
  const [participants, setParticipants] = useState(
    checkout?.participants ?? []
  );
  const [orderData, setOrderData] = useState(() => ({
    document: checkout?.document || checkout?.cpf || "",
    status: checkout?.status || "",
    paymentMethod: checkout?.paymentMethod || "",
    observation: checkout?.observation || "",
    paymentId: checkout?.paymentId || "",
    total: checkout?.orderDetails?.total ?? checkout?.totalAmount ?? "",
    orderDetails: {
      fullTickets: checkout?.orderDetails?.fullTickets ?? 0,
      halfTickets: checkout?.orderDetails?.halfTickets ?? 0,
      coupon: checkout?.orderDetails?.coupon ?? "",
      discount: checkout?.orderDetails?.discount ?? "0.00",
      valueTicketsAll:
        checkout?.orderDetails?.valueTicketsAll ??
        checkout?.orderDetails?.fullTicketsValue ??
        "0.00",
      valueTicketsHalf:
        checkout?.orderDetails?.valueTicketsHalf ??
        checkout?.orderDetails?.halfTicketsValue ??
        "0.00",
    },
  }));

  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editingParticipantIdx, setEditingParticipantIdx] = useState(null);
  const { canEdit } = useRole();

  // ── handleOrderDataChange(field, value, nestedField?) ──────────────────────
  const handleOrderDataChange = (field, value, nestedField = null) => {
    setOrderData((prev) => {
      const next = { ...prev };
      if (nestedField) {
        const FULL_PRICE = 499.9;
        const HALF_PRICE = 399.9;
        const details = { ...next.orderDetails, [nestedField]: value };
        details.valueTicketsAll = (
          parseInt(details.fullTickets || 0) * FULL_PRICE
        ).toFixed(2);
        details.valueTicketsHalf = (
          parseInt(details.halfTickets || 0) * HALF_PRICE
        ).toFixed(2);
        next.orderDetails = details;
        next.total = (
          parseInt(details.fullTickets || 0) * FULL_PRICE +
          parseInt(details.halfTickets || 0) * HALF_PRICE -
          parseFloat(details.discount || 0)
        ).toFixed(2);
      } else {
        next[field] = value;
      }
      return next;
    });
  };

  const handleParticipantChange = (index, field, value) => {
    setParticipants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const clearQrCodes = (index) => {
    setParticipants((prev) => {
      const updated = [...prev];
      const p = { ...updated[index] };
      delete p.qrCodes;
      delete p.qrRawData;
      updated[index] = p;
      return updated;
    });
  };

  const saveChanges = async () => {
    try {
      // Salva participantes na subcoleção
      if (participants.some((p) => p.id)) {
        const batch = writeBatch(db);
        participants.forEach((p) => {
          if (p.id) {
            const pRef = doc(
              db,
              "checkouts",
              checkout.id,
              "participants",
              p.id
            );
            const { id: _id, ...pData } = p;
            batch.update(pRef, pData);
          }
        });
        await batch.commit();
      }

      // Salva dados do pedido no checkout
      await updateDoc(doc(db, "checkouts", checkout.id), {
        document: orderData.document,
        status: orderData.status,
        paymentMethod: orderData.paymentMethod,
        observation: orderData.observation,
        totalAmount: parseFloat(orderData.total) || 0,
        orderDetails: {
          ...checkout.orderDetails,
          fullTickets: parseInt(orderData.orderDetails.fullTickets || 0),
          halfTickets: parseInt(orderData.orderDetails.halfTickets || 0),
          coupon: orderData.orderDetails.coupon,
          discount: parseFloat(orderData.orderDetails.discount || 0).toFixed(2),
          valueTicketsAll: orderData.orderDetails.valueTicketsAll,
          valueTicketsHalf: orderData.orderDetails.valueTicketsHalf,
        },
      });

      toast.success("Alterações salvas com sucesso!");
      updateCheckoutInContext({
        ...checkout,
        participants,
        document: orderData.document,
        status: orderData.status,
        paymentMethod: orderData.paymentMethod,
        observation: orderData.observation,
        totalAmount: parseFloat(orderData.total) || 0,
        orderDetails: {
          ...checkout.orderDetails,
          fullTickets: parseInt(orderData.orderDetails.fullTickets || 0),
          halfTickets: parseInt(orderData.orderDetails.halfTickets || 0),
          coupon: orderData.orderDetails.coupon,
          discount: parseFloat(orderData.orderDetails.discount || 0).toFixed(2),
          valueTicketsAll: orderData.orderDetails.valueTicketsAll,
          valueTicketsHalf: orderData.orderDetails.valueTicketsHalf,
        },
      });
      setIsEditingOrder(false);
      setEditingParticipantIdx(null);
    } catch (err) {
      console.error("Erro ao salvar alterações:", err);
      toast.error("Erro ao salvar alterações");
    }
  };

  const sendConfirmationEmail = async (participant, index) => {
    if (
      participant.qrRawData &&
      Object.values(participant.qrRawData).some(Boolean)
    ) {
      toast.error(
        "Participante já possui QR Codes. Apague-os antes de enviar o e-mail."
      );
      return;
    }
    const emailData = {
      checkoutId: checkout.id,
      from: EMAIL_FROM,
      to: participant.email,
      subject: "Confirmação de Pagamento - Congresso Autismo MA 2026",
      data: {
        name: participant.name,
        transactionId: checkout.transactionId,
        fullTickets: orderData.orderDetails.fullTickets,
        valueTicketsAll: orderData.orderDetails.valueTicketsAll,
        halfTickets: orderData.orderDetails.halfTickets,
        valueTicketsHalf: orderData.orderDetails.valueTicketsHalf,
        coupon: orderData.orderDetails.coupon || "",
        discount: orderData.orderDetails.discount || "0.00",
        total: orderData.total,
        installments:
          orderData.paymentMethod === "creditCard"
            ? checkout.paymentDetails?.creditCard?.installments || "1"
            : "1",
      },
    };

    try {
      await toast.promise(PaymentService.sendConfirmationEmail(emailData), {
        pending: "Enviando e-mail…",
        success: "E-mail enviado com sucesso!",
        error: "Erro ao enviar e-mail. Tente novamente.",
      });

      // Atualiza participante localmente (subcoleção não fica no doc do checkout)
      const updatedParticipants = participants.map((p, i) =>
        i === index ? { ...p, emailSent: true } : p
      );
      setParticipants(updatedParticipants);
      updateCheckoutInContext({
        ...checkout,
        participants: updatedParticipants,
      });
    } catch (err) {
      console.error("Erro ao enviar e-mail:", err);
    }
  };

  const getLabel = (options, value) =>
    options.find((o) => o.value === value)?.label ??
    (value ? value.charAt(0).toUpperCase() + value.slice(1) : "—");

  // ── Render: caso sem checkout (mensagem de resultado) ──────────────────────
  if (!checkout) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, mb: 1, color: "#0f172a" }}
        >
          {title}
        </Typography>
        <Typography sx={{ color: "#64748b", mb: 2 }}>{message}</Typography>
        <Button variant="outlined" onClick={() => setOpenDetailsModal(null)}>
          Fechar
        </Button>
      </Box>
    );
  }

  const statusCfg = STATUS_COLORS[orderData.status] || {
    color: "#64748b",
    bg: "#f1f5f9",
  };

  // ── Render principal ────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: "20px 22px 16px" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}
          >
            Detalhes do Checkout
          </Typography>
          <Typography sx={{ fontSize: "0.78rem", color: "#64748b", mt: 0.3 }}>
            {checkout.eventName} · {formatTimestamp(checkout.timestamp)}
          </Typography>
        </Box>
        <Chip
          label={getLabel(statusOptions, orderData.status)}
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: "0.72rem",
            color: statusCfg.color,
            bgcolor: statusCfg.bg,
            flexShrink: 0,
          }}
        />
      </Box>

      {/* ── Participantes ───────────────────────────────────────────────── */}
      <Typography
        variant="subtitle2"
        sx={{ color: "#1976d2", fontWeight: 700, mb: 1 }}
      >
        Participantes
      </Typography>

      {participants.map((p, index) => (
        <Accordion
          key={p.id || index}
          sx={{
            mb: 1,
            boxShadow: "none",
            border: "1px solid #e2e8f0",
            borderRadius: "8px !important",
          }}
          disableGutters
        >
          <AccordionSummary
            expandIcon={<IoIosArrowDown />}
            sx={{ minHeight: 44 }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                width: "100%",
              }}
            >
              <MdPerson size={15} color="#64748b" />
              <Typography
                sx={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#0f172a",
                  flex: 1,
                }}
              >
                {p.name}
              </Typography>
              {p.emailSent && (
                <MdEmail size={14} color="#16a34a" title="E-mail enviado" />
              )}
              {(p.checkedIn || p.validated) && (
                <MdCheckCircle size={14} color="#16a34a" title="Credenciado" />
              )}
              {p.qrRawData && (
                <MdQrCode size={14} color="#1976d2" title="QR Code gerado" />
              )}
              {p.certificateIssued && (
                <MdBadge
                  size={14}
                  color="#7c3aed"
                  title="Certificado emitido"
                />
              )}
            </Box>
          </AccordionSummary>

          <AccordionDetails sx={{ pt: 0, pb: 1.5 }}>
            {/* Botão editar participante */}
            {canEdit && (
              <Button
                size="small"
                variant="outlined"
                startIcon={
                  editingParticipantIdx === index ? null : (
                    <FaRegEdit size={13} />
                  )
                }
                onClick={() =>
                  setEditingParticipantIdx(
                    editingParticipantIdx === index ? null : index
                  )
                }
                sx={{ mb: 1.5, textTransform: "none", fontSize: "0.75rem" }}
              >
                {editingParticipantIdx === index
                  ? "Cancelar edição"
                  : "Editar dados"}
              </Button>
            )}

            {editingParticipantIdx === index ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <TextField
                  size="small"
                  label="Nome"
                  value={p.name}
                  onChange={(e) =>
                    handleParticipantChange(index, "name", e.target.value)
                  }
                  fullWidth
                />
                <TextField
                  size="small"
                  label="CPF"
                  value={p.document || p.cpf || ""}
                  onChange={(e) =>
                    handleParticipantChange(index, "document", e.target.value)
                  }
                  fullWidth
                />
                <TextField
                  size="small"
                  label="E-mail"
                  value={p.email || ""}
                  onChange={(e) =>
                    handleParticipantChange(index, "email", e.target.value)
                  }
                  fullWidth
                />
                <TextField
                  size="small"
                  label="Telefone"
                  value={p.phone || p.number || ""}
                  onChange={(e) =>
                    handleParticipantChange(index, "phone", e.target.value)
                  }
                  fullWidth
                />
                <TextField
                  size="small"
                  label="Tipo de ingresso"
                  value={p.ticketType || ""}
                  onChange={(e) =>
                    handleParticipantChange(index, "ticketType", e.target.value)
                  }
                  fullWidth
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={saveChanges}
                  sx={{ textTransform: "none", alignSelf: "flex-start" }}
                >
                  Salvar
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <InfoRow label="CPF" value={p.document || p.cpf} />
                <InfoRow label="E-mail" value={p.email} />
                <InfoRow label="Telefone" value={p.phone || p.number} />
                <InfoRow
                  label="Tipo de ingresso"
                  value={
                    p.ticketType === "full"
                      ? "Inteira"
                      : p.ticketType === "half"
                      ? "Meia entrada"
                      : p.ticketType
                  }
                />
                {p.checkedIn && <InfoRow label="Credenciado" value="Sim" />}
                {p.certificateIssued && (
                  <InfoRow label="Certificado" value="Emitido" />
                )}
              </Box>
            )}

            {/* QR Codes */}
            {p.qrRawData ? (
              <Box sx={{ mt: 1.5 }}>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#475569",
                    mb: 0.75,
                  }}
                >
                  QR Codes gerados
                </Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                  {Object.entries(p.qrRawData).map(([date, raw]) => (
                    <Box key={date} sx={{ textAlign: "center" }}>
                      <Typography
                        sx={{ fontSize: "0.7rem", color: "#64748b", mb: 0.5 }}
                      >
                        {date}
                      </Typography>
                      <QRCodeSVG value={raw} size={90} />
                    </Box>
                  ))}
                </Box>
                {editingParticipantIdx === index && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => clearQrCodes(index)}
                    sx={{ mt: 1, textTransform: "none", fontSize: "0.73rem" }}
                  >
                    Apagar QR Codes
                  </Button>
                )}
              </Box>
            ) : (
              <Box sx={{ mt: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<MdEmail size={14} />}
                  onClick={() => sendConfirmationEmail(p, index)}
                  sx={{ textTransform: "none", fontSize: "0.73rem" }}
                  disabled={!!p.emailSent}
                >
                  {p.emailSent
                    ? "E-mail já enviado"
                    : "Enviar e-mail de confirmação"}
                </Button>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      <Divider sx={{ my: 2 }} />

      {/* ── Detalhes do Pedido ──────────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ color: "#1976d2", fontWeight: 700 }}
        >
          Detalhes do Pedido
        </Typography>
        {canEdit && (
          <Button
            size="small"
            variant={isEditingOrder ? "outlined" : "text"}
            startIcon={isEditingOrder ? null : <FaRegEdit size={13} />}
            onClick={() => setIsEditingOrder(!isEditingOrder)}
            sx={{ textTransform: "none", fontSize: "0.75rem" }}
          >
            {isEditingOrder ? "Cancelar" : "Editar"}
          </Button>
        )}
      </Box>

      {isEditingOrder ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <TextField
            size="small"
            label="Documento do pagador"
            fullWidth
            value={orderData.document}
            onChange={(e) => handleOrderDataChange("document", e.target.value)}
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={orderData.status}
              onChange={(e) => handleOrderDataChange("status", e.target.value)}
            >
              {statusOptions.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Método de pagamento</InputLabel>
            <Select
              label="Método de pagamento"
              value={orderData.paymentMethod}
              onChange={(e) =>
                handleOrderDataChange("paymentMethod", e.target.value)
              }
            >
              {paymentMethods.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <TextField
              size="small"
              label="Ingressos inteiros"
              type="number"
              fullWidth
              value={orderData.orderDetails.fullTickets}
              onChange={(e) =>
                handleOrderDataChange(
                  "orderDetails",
                  e.target.value,
                  "fullTickets"
                )
              }
              slotProps={{ htmlInput: { min: 0 } }}
            />
            <TextField
              size="small"
              label="Ingressos meia"
              type="number"
              fullWidth
              value={orderData.orderDetails.halfTickets}
              onChange={(e) =>
                handleOrderDataChange(
                  "orderDetails",
                  e.target.value,
                  "halfTickets"
                )
              }
              slotProps={{ htmlInput: { min: 0 } }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <TextField
              size="small"
              label="Cupom"
              fullWidth
              value={orderData.orderDetails.coupon}
              onChange={(e) =>
                handleOrderDataChange("orderDetails", e.target.value, "coupon")
              }
            />
            <TextField
              size="small"
              label="Desconto (R$)"
              type="number"
              fullWidth
              value={orderData.orderDetails.discount}
              onChange={(e) =>
                handleOrderDataChange(
                  "orderDetails",
                  e.target.value,
                  "discount"
                )
              }
              slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
            />
          </Box>
          <TextField
            size="small"
            label="Valor total (R$)"
            type="number"
            fullWidth
            value={orderData.total}
            onChange={(e) => handleOrderDataChange("total", e.target.value)}
            slotProps={{ htmlInput: { step: "0.01" } }}
          />
          <TextField
            size="small"
            label="Observação"
            fullWidth
            multiline
            rows={2}
            value={orderData.observation}
            onChange={(e) =>
              handleOrderDataChange("observation", e.target.value)
            }
          />
          <Button
            variant="contained"
            size="small"
            onClick={saveChanges}
            sx={{ textTransform: "none", alignSelf: "flex-start" }}
          >
            Salvar alterações
          </Button>
        </Box>
      ) : (
        <Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2px 16px",
              mb: 1,
            }}
          >
            <InfoRow
              label="Status"
              value={getLabel(statusOptions, orderData.status)}
            />
            <InfoRow
              label="Método"
              value={getLabel(paymentMethods, orderData.paymentMethod)}
            />
            <InfoRow
              label="Ingressos inteiros"
              value={orderData.orderDetails.fullTickets}
            />
            <InfoRow
              label="Ingressos meia"
              value={orderData.orderDetails.halfTickets}
            />
            {orderData.orderDetails.valueTicketsAll !== "0.00" && (
              <InfoRow
                label="Valor inteiras"
                value={`R$ ${orderData.orderDetails.valueTicketsAll}`}
              />
            )}
            {orderData.orderDetails.valueTicketsHalf !== "0.00" && (
              <InfoRow
                label="Valor meias"
                value={`R$ ${orderData.orderDetails.valueTicketsHalf}`}
              />
            )}
            {orderData.orderDetails.coupon && (
              <InfoRow label="Cupom" value={orderData.orderDetails.coupon} />
            )}
            {orderData.orderDetails.coupon && (
              <InfoRow
                label="Desconto"
                value={`R$ ${orderData.orderDetails.discount}`}
              />
            )}
            <InfoRow label="Documento" value={orderData.document} />
            {orderData.paymentId && (
              <InfoRow label="ID pagamento" value={orderData.paymentId} />
            )}
          </Box>
          {orderData.observation && (
            <InfoRow label="Observação" value={orderData.observation} />
          )}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mt: 1,
              p: "8px 12px",
              bgcolor: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            <Typography
              sx={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}
            >
              VALOR TOTAL
            </Typography>
            <Typography
              sx={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}
            >
              R${" "}
              {parseFloat(orderData.total || 0)
                .toFixed(2)
                .replace(".", ",")}
            </Typography>
          </Box>
        </Box>
      )}

      {/* ── Informações de Pagamento ────────────────────────────────────── */}
      {(checkout.paymentDetails?.pix ||
        checkout.paymentDetails?.creditCard ||
        checkout.status === "error") && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography
            variant="subtitle2"
            sx={{ color: "#1976d2", fontWeight: 700, mb: 1 }}
          >
            Informações de Pagamento
          </Typography>
          {checkout.paymentDetails?.creditCard && (
            <Box sx={{ display: "flex", gap: 3 }}>
              <InfoRow
                label="Final do cartão"
                value={checkout.paymentDetails.creditCard.last4Digits}
              />
              <InfoRow
                label="Parcelas"
                value={checkout.paymentDetails.creditCard.installments}
              />
            </Box>
          )}
          {checkout.paymentDetails?.pix && (
            <InfoRow
              label="PIX (código)"
              value={
                <Typography
                  component="span"
                  sx={{
                    fontSize: "0.72rem",
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                    color: "#475569",
                  }}
                >
                  {checkout.paymentDetails.pix.qrCodeString}
                </Typography>
              }
            />
          )}
          {checkout.status === "error" && (
            <InfoRow
              label="Erro"
              value={checkout.errorLog || "Boleto vencido"}
            />
          )}
        </>
      )}

      {/* ── Fechar ─────────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2.5 }}>
        <Button
          variant="outlined"
          onClick={() => setOpenDetailsModal(null)}
          sx={{ textTransform: "none" }}
        >
          Fechar
        </Button>
      </Box>
    </Box>
  );
};

export default ModalCheckoutDetails;
