import {
  Card,
  CardContent,
  Typography,
  CardActions,
  Button,
  IconButton,
  Box,
  Modal,
} from "@mui/material";
import { FaWhatsapp } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import { useState } from "react";
import ModalCheckoutDetails from "../ModalCheckoutDetails";
import PaymentService from "../../../../data/services/PaymentService";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../../../firebaseConfig";
import { useDashboard } from "../../../../data/contexts/DashboardContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";
import useRole from "../../../../data/hooks/useRole";

const CheckoutCard = ({ checkout, isMobile }) => {
  const [openDetailsModal, setOpenDetailsModal] = useState(null);
  const { setCheckouts, setFilteredCheckouts } = useDashboard();
  const [showModalDelete, setShowModalDelete] = useState(false);
  const { canDelete } = useRole();

  const handleContactParticipant = (participantPhone, paymentMethod) => {
    const cleanPhone = participantPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("55")
      ? cleanPhone
      : `55${cleanPhone}`;
    const message = `Olá! Vi que houve uma tentativa de pagamento via ${paymentMethod} no Congresso Autismo MA 2026. Podemos ajudar com algo?`;
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCheckPaymentStatus = async (checkoutId, paymentId) => {
    try {
      const response = await PaymentService.verifyPayment(paymentId);
      console.log(`Status verificado para ${paymentId}:`, response);
      const { status } = response;
      if (!response.success) throw new Error(response.message);

      const checkoutRef = doc(db, "checkouts", checkoutId);
      await updateDoc(checkoutRef, { status });
      setCheckouts((prev) =>
        prev.map((c) => (c.id === checkoutId ? { ...c, status } : c))
      );
      setFilteredCheckouts((prev) =>
        prev.map((c) => (c.id === checkoutId ? { ...c, status } : c))
      );

      setOpenDetailsModal({
        type: "success",
        title: "Verificação concluída",
        message: `O status do pagamento é: "${status}".`,
      });
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      setOpenDetailsModal({
        type: "error",
        title: "Erro ao Verificar Pagamento",
        message: `Erro: ${error.message}`,
      });
    }
  };

  const handleDelete = async (id) => {
    const docRef = doc(db, "checkouts", id);

    try {
      await deleteDoc(docRef);
      toast.success(`Checkout com o id: ${id} foi deletado.`);
      setCheckouts((prev) => prev.filter((c) => c.id !== id));
      setFilteredCheckouts((prev) => prev.filter((c) => c.id !== id));
      setShowModalDelete(false);
    } catch (error) {
      toast.error(`Erro ao apagar checkout: ${error}`);
      setShowModalDelete(false);
    }
  };

  const handleShowModalDelete = () => {
    setShowModalDelete(true);
  };

  const handleCloseModalDelete = () => {
    setShowModalDelete(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return { borderLeft: "4px solid #16a34a" };
      case "pending":  return { borderLeft: "4px solid #d97706" };
      case "error":    return { borderLeft: "4px solid #dc2626" };
      default:         return { borderLeft: "4px solid #cbd5e1" };
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar timestamp:", error);
      return timestamp;
    }
  };

  const updateCheckoutInContext = (updatedCheckout) => {
    setCheckouts((prev) =>
      prev.map((c) => (c.id === updatedCheckout.id ? updatedCheckout : c))
    );
    setFilteredCheckouts((prev) =>
      prev.map((c) => (c.id === updatedCheckout.id ? updatedCheckout : c))
    );
  };

  return (
    <>
      <Card
        sx={{
          border: "1px solid #e2e8f0",
          ...getStatusColor(checkout.status),
          backgroundColor: "#fff",
          borderRadius: "10px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          padding: 2,
          maxWidth: "100%",
        }}
      >
        <CardContent sx={{ padding: 0 }}>
          <Typography sx={{
            color: "#0f172a", fontWeight: 600, fontSize: "0.9rem",
            mb: 0.75, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden",
          }}>
            {checkout.participants[0].name}
          </Typography>
          <Typography sx={{ color: "#64748b", fontSize: "0.8rem" }}>
            <strong>Status:</strong>{" "}
            {checkout.status.charAt(0).toUpperCase() + checkout.status.slice(1)}
          </Typography>
          <Typography sx={{ color: "#64748b", fontSize: "0.8rem" }}>
            <strong>Método:</strong> {checkout.paymentMethod}
          </Typography>
          <Typography sx={{ color: "#64748b", fontSize: "0.8rem" }}>
            <strong>Data:</strong> {formatTimestamp(checkout.timestamp)}
          </Typography>
          <Typography sx={{ color: "#64748b", fontSize: "0.8rem", mb: 0.5 }}>
            <strong>Valor:</strong> R$ {checkout.orderDetails.total || checkout.totalAmount}
          </Typography>
          {checkout.seller && (
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}
            >
              <MdVerified size={14} color="#1976D2" />
              <Typography
                sx={{ color: "#1976D2", fontSize: "0.82rem", fontWeight: 600 }}
              >
                {checkout.seller.name}
              </Typography>
            </Box>
          )}
        </CardContent>
        <CardActions
          sx={{ justifyContent: "space-between", gap: 1, padding: 0 }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              sx={{ textTransform: "none", fontSize: "0.75rem", p: ".2rem", color: "#3b82f6" }}
              onClick={() => setOpenDetailsModal(checkout.id)}
            >
              Detalhes
            </Button>
            {/* {checkout.paymentId &&
              checkout.status === "pending" &&
              ["pix", "boleto"].includes(checkout.paymentMethod) && (
                <Button
                  size="small"
                  sx={{
                    color: "#FFB300",
                    textTransform: "none",
                    fontSize: "0.7rem",
                    p: ".2rem",
                    "&:hover": { color: "#F57C00" },
                  }}
                  onClick={() =>
                    handleCheckPaymentStatus(checkout.id, checkout.paymentId)
                  }
                >
                  Verificar Pagamento
                </Button>
              )} */}
            {canDelete && (
              <Button
                color="error"
                size="small"
                sx={{ textTransform: "none", fontSize: "0.7rem", p: ".2rem" }}
                onClick={handleShowModalDelete}
              >
                Excluir
              </Button>
            )}
          </Box>
          {checkout.participants[0]?.phone && (
            <IconButton
              onClick={() =>
                handleContactParticipant(
                  checkout.participants[0].phone,
                  checkout.paymentMethod
                )
              }
              sx={{ color: "#25D366", "&:hover": { color: "#1EBE56" } }}
            >
              <FaWhatsapp />
            </IconButton>
          )}
        </CardActions>
      </Card>

      <Modal
        open={!!openDetailsModal}
        onClose={() => setOpenDetailsModal(null)}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            maxHeight: "90vh",
            overflowY: "scroll",
            transform: "translate(-50%, -50%)",
            width: isMobile
              ? "85%"
              : typeof openDetailsModal === "string"
              ? 500
              : 400,
            bgcolor: "#FFFFFF",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            p: 2,
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

      <Modal open={showModalDelete} onClose={handleCloseModalDelete}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: isMobile ? "85%" : 400,
            bgcolor: "#FFFFFF",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            p: 3,
            textAlign: "center",
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, color: "#333333" }}>
            Confirmar Exclusão
          </Typography>
          <Typography sx={{ mb: 3, color: "#666666" }}>
            Tem certeza que deseja excluir este checkout? Os dados serão
            perdidos permanentemente.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleDelete(checkout.id)}
              sx={{ textTransform: "none" }}
            >
              Confirmar
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleCloseModalDelete}
              sx={{ textTransform: "none" }}
            >
              Cancelar
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default CheckoutCard;
