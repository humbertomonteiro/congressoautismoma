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
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      alert(`Erro ao verificar pagamento: ${error.message}`);
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
            sx={{ color: "#333333", fontWeight: 500, mb: ".5rem" }}
          >
            {/* {checkout.eventName} */}
            {checkout.participants[0].name}
          </Typography>
          <Typography sx={{ color: "#666666", fontSize: "0.9rem" }}>
            <strong>Status:</strong>{" "}
            {checkout.status.charAt(0).toUpperCase() + checkout.status.slice(1)}
          </Typography>
          <Typography sx={{ color: "#666666", fontSize: "0.9rem" }}>
            <strong>Método:</strong> {checkout.paymentMethod}
          </Typography>
        </CardContent>
        <CardActions
          sx={{ justifyContent: "space-between", gap: 1, padding: 0 }}
        >
          <Box>
            <Button
              color="primary"
              size="small"
              sx={{ textTransform: "none" }}
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
            width: isMobile ? "85%" : 500,
            bgcolor: "#FFFFFF",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            p: 4,
          }}
        >
          {openDetailsModal && (
            <ModalCheckoutDetails
              checkout={checkout}
              setOpenDetailsModal={setOpenDetailsModal}
            />
          )}
        </Box>
      </Modal>
    </>
  );
};

export default CheckoutCard;
