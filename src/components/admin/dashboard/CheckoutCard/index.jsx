import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  IconButton,
  Chip,
  Modal,
  Tooltip,
  Divider,
} from "@mui/material";
import { FaWhatsapp } from "react-icons/fa";
import {
  MdVerified,
  MdDeleteOutline,
  MdOpenInNew,
  MdConfirmationNumber,
  MdHandshake,
} from "react-icons/md";
import { useState } from "react";
import ModalCheckoutDetails from "../ModalCheckoutDetails";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../../../../firebaseConfig";
import { useDashboard } from "../../../../data/contexts/DashboardContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";
import useRole from "../../../../data/hooks/useRole";

// ── Config visual de status ────────────────────────────────────────────────
const STATUS_CONFIG = {
  approved: { label: "Aprovado", color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" },
  pending:  { label: "Pendente", color: "#d97706", bg: "#fef9c3", border: "#fde68a" },
  error:    { label: "Erro",     color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
  expired:  { label: "Expirado", color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1" },
  canceled: { label: "Cancelado",color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1" },
  test:     { label: "Teste",    color: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd" },
};

const PAYMENT_LABEL = {
  creditCard: "Cartão de Crédito",
  pix:        "PIX",
  boleto:     "Boleto",
  cash:       "Dinheiro",
  internal:   "Pagamento Interno",
  courtesy:   "Cortesia",
  debitCard:  "Cartão de Débito",
};

const formatTimestamp = (timestamp) => {
  try {
    return format(new Date(timestamp), "dd/MM/yy HH:mm", { locale: ptBR });
  } catch {
    return timestamp;
  }
};

const CheckoutCard = ({ checkout, isMobile }) => {
  const [openDetailsModal, setOpenDetailsModal] = useState(null);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const { setCheckouts, setFilteredCheckouts } = useDashboard();
  const { canDelete } = useRole();

  const statusCfg = STATUS_CONFIG[checkout.status] ?? STATUS_CONFIG.expired;
  const firstParticipant = (checkout.participants || [])[0] ?? {};
  const fullTickets = checkout.orderDetails?.fullTickets ?? checkout.orderDetails?.allTickets ?? 0;
  const halfTickets = checkout.orderDetails?.halfTickets ?? 0;
  const total =
    parseFloat(checkout.totalAmount) ||
    parseFloat(checkout.orderDetails?.total) ||
    0;
  const isManual   = checkout.manual === true;
  const isCourtesy = checkout.isCourtesy === true || checkout.paymentMethod === "courtesy";

  const updateCheckoutInContext = (updated) => {
    setCheckouts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setFilteredCheckouts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, "checkouts", checkout.id));
      toast.success("Checkout excluído.");
      setCheckouts((prev) => prev.filter((c) => c.id !== checkout.id));
      setFilteredCheckouts((prev) => prev.filter((c) => c.id !== checkout.id));
      setShowModalDelete(false);
    } catch (err) {
      toast.error(`Erro ao excluir: ${err.message}`);
    }
  };

  const handleWhatsApp = () => {
    const clean = (firstParticipant.phone || "").replace(/\D/g, "");
    const phone = clean.startsWith("55") ? clean : `55${clean}`;
    const method = PAYMENT_LABEL[checkout.paymentMethod] || checkout.paymentMethod;
    const msg = `Olá! Vi que houve uma tentativa de pagamento via ${method} no ${checkout.eventName}. Podemos ajudar com algo?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <>
      <Card
        sx={{
          borderRadius: "12px",
          border: "1px solid",
          borderColor: statusCfg.border,
          borderLeft: `4px solid ${statusCfg.color}`,
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
          bgcolor: "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CardContent sx={{ p: "12px 14px 8px", flexGrow: 1 }}>
          {/* ── Linha 1: nome + status ─────────────────────────────────── */}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.75 }}>
            <Typography
              sx={{
                flex: 1,
                fontWeight: 700,
                fontSize: "0.88rem",
                color: "#0f172a",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.3,
              }}
            >
              {firstParticipant.name || "—"}
            </Typography>
            <Chip
              label={statusCfg.label}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.68rem",
                fontWeight: 700,
                color: statusCfg.color,
                bgcolor: statusCfg.bg,
                border: `1px solid ${statusCfg.border}`,
                flexShrink: 0,
              }}
            />
          </Box>

          {/* ── Linha 2: badges manual/cortesia ────────────────────────── */}
          {(isManual || isCourtesy) && (
            <Box sx={{ display: "flex", gap: 0.5, mb: 0.75 }}>
              {isManual && (
                <Chip
                  icon={<span style={{ display: "flex", paddingLeft: 4 }}><MdHandshake size={11} /></span>}
                  label="Manual"
                  size="small"
                  sx={{ height: 18, fontSize: "0.65rem", fontWeight: 600, bgcolor: "#ede9fe", color: "#6d28d9" }}
                />
              )}
              {isCourtesy && (
                <Chip
                  label="Cortesia"
                  size="small"
                  sx={{ height: 18, fontSize: "0.65rem", fontWeight: 600, bgcolor: "#fce7f3", color: "#be185d" }}
                />
              )}
            </Box>
          )}

          <Divider sx={{ my: 0.75 }} />

          {/* ── Linha 3: ingressos + valor ─────────────────────────────── */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <MdConfirmationNumber size={13} color="#64748b" />
            <Box sx={{ display: "flex", gap: 0.5, flex: 1, flexWrap: "wrap" }}>
              {fullTickets > 0 && (
                <Typography sx={{ fontSize: "0.75rem", color: "#334155", fontWeight: 600 }}>
                  {fullTickets} inteira{fullTickets > 1 ? "s" : ""}
                </Typography>
              )}
              {fullTickets > 0 && halfTickets > 0 && (
                <Typography sx={{ fontSize: "0.75rem", color: "#94a3b8" }}>·</Typography>
              )}
              {halfTickets > 0 && (
                <Typography sx={{ fontSize: "0.75rem", color: "#334155", fontWeight: 600 }}>
                  {halfTickets} meia{halfTickets > 1 ? "s" : ""}
                </Typography>
              )}
              {fullTickets === 0 && halfTickets === 0 && (
                <Typography sx={{ fontSize: "0.75rem", color: "#94a3b8" }}>—</Typography>
              )}
            </Box>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f172a", flexShrink: 0 }}>
              R$ {total.toFixed(2).replace(".", ",")}
            </Typography>
          </Box>

          {/* ── Linha 4: método + data ─────────────────────────────────── */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontSize: "0.73rem", color: "#64748b" }}>
              {PAYMENT_LABEL[checkout.paymentMethod] ?? checkout.paymentMethod}
            </Typography>
            <Typography sx={{ fontSize: "0.73rem", color: "#94a3b8" }}>
              {formatTimestamp(checkout.timestamp)}
            </Typography>
          </Box>

          {/* ── Vendedor ──────────────────────────────────────────────── */}
          {checkout.seller && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
              <MdVerified size={12} color="#1976d2" />
              <Typography sx={{ fontSize: "0.72rem", color: "#1976d2", fontWeight: 600 }}>
                {checkout.seller.name}
              </Typography>
            </Box>
          )}
        </CardContent>

        <Divider />

        {/* ── Ações ─────────────────────────────────────────────────────── */}
        <CardActions sx={{ px: "10px", py: "6px", justifyContent: "space-between", gap: 0.5 }}>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Button
              size="small"
              startIcon={<MdOpenInNew size={13} />}
              onClick={() => setOpenDetailsModal(checkout.id)}
              sx={{ textTransform: "none", fontSize: "0.73rem", px: 1, py: 0.3, color: "#3b82f6" }}
            >
              Detalhes
            </Button>
            {canDelete && (
              <Tooltip title="Excluir checkout">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => setShowModalDelete(true)}
                  sx={{ p: 0.4 }}
                >
                  <MdDeleteOutline size={16} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          {firstParticipant.phone && (
            <Tooltip title={`WhatsApp: ${firstParticipant.phone}`}>
              <IconButton
                size="small"
                onClick={handleWhatsApp}
                sx={{ color: "#25D366", "&:hover": { color: "#1EBE56" }, p: 0.4 }}
              >
                <FaWhatsapp size={18} />
              </IconButton>
            </Tooltip>
          )}
        </CardActions>
      </Card>

      {/* ── Modal de detalhes ──────────────────────────────────────────── */}
      <Modal open={!!openDetailsModal} onClose={() => setOpenDetailsModal(null)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: isMobile ? "92%" : 560,
            maxHeight: "92vh",
            overflowY: "auto",
            bgcolor: "#fff",
            borderRadius: "14px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          }}
        >
          {typeof openDetailsModal === "string" ? (
            <ModalCheckoutDetails
              checkout={checkout}
              setOpenDetailsModal={setOpenDetailsModal}
              formatTimestamp={formatTimestamp}
              updateCheckoutInContext={updateCheckoutInContext}
            />
          ) : (
            <ModalCheckoutDetails
              setOpenDetailsModal={setOpenDetailsModal}
              formatTimestamp={formatTimestamp}
              title={openDetailsModal?.title}
              message={openDetailsModal?.message}
              openDetailsModal={openDetailsModal?.type}
            />
          )}
        </Box>
      </Modal>

      {/* ── Modal de confirmação de exclusão ──────────────────────────── */}
      <Modal open={showModalDelete} onClose={() => setShowModalDelete(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: isMobile ? "85%" : 380,
            bgcolor: "#fff",
            borderRadius: "14px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            p: 3,
            textAlign: "center",
          }}
        >
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700, color: "#0f172a" }}>
            Confirmar Exclusão
          </Typography>
          <Typography sx={{ mb: 3, color: "#64748b", fontSize: "0.9rem" }}>
            Excluir este checkout de <strong>{firstParticipant.name}</strong>?
            <br />Os dados serão perdidos permanentemente.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
            <Button variant="outlined" onClick={() => setShowModalDelete(false)} sx={{ textTransform: "none" }}>
              Cancelar
            </Button>
            <Button variant="contained" color="error" onClick={handleDelete} sx={{ textTransform: "none" }}>
              Excluir
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default CheckoutCard;
