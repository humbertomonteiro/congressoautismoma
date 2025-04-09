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
import { useState } from "react";
import ModalCheckoutDetails from "../ModalCheckoutDetails";
import PaymentService from "../../../../data/services/PaymentService";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../../firebaseConfig";
import { useDashboard } from "../../../../data/contexts/DashboardContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CheckoutCard = ({ checkout, isMobile }) => {
  const [openDetailsModal, setOpenDetailsModal] = useState(null);
  const { setCheckouts, setFilteredCheckouts } = useDashboard();

  const handleContactParticipant = (participantPhone, paymentMethod) => {
    const cleanPhone = participantPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("55")
      ? cleanPhone
      : `55${cleanPhone}`;
    const message = `Olá! Vi que houve uma tentativa de pagamento via ${paymentMethod} no Congresso Autismo MA 2025. Podemos ajudar com algo?`;
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

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return { borderLeft: "6px solid #2E7D32" };
      case "pending":
        return { borderLeft: "6px solid #FFB300" };
      case "error":
        return { borderLeft: "6px solid #D32F2F" };
      default:
        return { borderLeft: "6px solid #B0BEC5" };
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

  // Função para atualizar o checkout no estado global após mudanças
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
          border: "1px solid #c2c2c2",
          ...getStatusColor(checkout.status),
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          padding: 2,
          maxWidth: "100%",
        }}
      >
        <CardContent sx={{ padding: 0 }}>
          <Typography
            variant="h6"
            sx={{
              color: "#333333",
              fontWeight: 500,
              mb: ".5rem",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
            }}
          >
            {checkout.participants[0].name}
          </Typography>
          <Typography sx={{ color: "#666666", fontSize: "0.9rem" }}>
            <strong>Status:</strong>{" "}
            {checkout.status.charAt(0).toUpperCase() + checkout.status.slice(1)}
          </Typography>
          <Typography sx={{ color: "#666666", fontSize: "0.9rem" }}>
            <strong>Método:</strong> {checkout.paymentMethod}
          </Typography>
          <Typography sx={{ color: "#666666", fontSize: "0.9rem" }}>
            <strong>Data e Hora:</strong> {formatTimestamp(checkout.timestamp)}
          </Typography>
          <Typography sx={{ color: "#666666", fontSize: "0.9rem", mb: 0.5 }}>
            <strong>Valor:</strong> R$ {checkout.totalAmount}
          </Typography>
        </CardContent>
        <CardActions
          sx={{ justifyContent: "space-between", gap: 1, padding: 0 }}
        >
          <Box sx={{ display: "flex" }}>
            <Button
              color="primary"
              size="small"
              sx={{ textTransform: "none", fontSize: "0.7rem", p: ".2rem" }}
              onClick={() => setOpenDetailsModal(checkout.id)}
            >
              Detalhes
            </Button>
            {checkout.paymentId &&
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
              )}
          </Box>
          {checkout.participants[0]?.number && (
            <IconButton
              onClick={() =>
                handleContactParticipant(
                  checkout.participants[0].number,
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

      {/* Modal Único */}
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
              updateCheckoutInContext={updateCheckoutInContext} // Passa a função para atualizar o contexto
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
    </>
  );
};

export default CheckoutCard;
