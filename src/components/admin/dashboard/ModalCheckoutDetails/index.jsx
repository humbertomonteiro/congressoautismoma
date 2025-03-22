import { Typography, Box, Button } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";

const ModalCheckoutDetails = ({ checkout, setOpenDetailsModal }) => {
  return (
    <>
      <Typography
        variant="h6"
        sx={{ color: "#333333", fontWeight: 500, mb: 2 }}
      >
        Detalhes do Checkout
      </Typography>
      <Typography sx={{ color: "#666666" }}>
        <strong>Evento:</strong> {checkout.eventName}
      </Typography>
      <Typography sx={{ color: "#666666" }}>
        <strong>Status:</strong> {checkout.status}
      </Typography>
      <Typography sx={{ color: "#666666" }}>
        <strong>Método:</strong> {checkout.paymentMethod}
      </Typography>
      <Typography sx={{ color: "#333333", fontWeight: 500 }}>
        <strong>Valor Total:</strong> R$ {checkout.totalAmount}
      </Typography>
      <Typography sx={{ color: "#333333", mt: 1 }}>
        <strong>Participantes:</strong>
      </Typography>
      <ul style={{ paddingLeft: "20px", color: "#666666" }}>
        {checkout.participants.map((p, index) => (
          <li key={index}>
            {p.name} - {p.cpf} {p.isHalfPrice ? "(Meia)" : ""}
            {p.qrRawData &&
            p.qrRawData["2025-05-31"] &&
            p.qrRawData["2025-06-01"] ? (
              <Box sx={{ mt: 1 }}>
                <Typography sx={{ color: "#333333" }}>31/05/2025:</Typography>
                <QRCodeSVG value={p.qrRawData["2025-05-31"]} size={100} />
                <Typography sx={{ color: "#333333", mt: 1 }}>
                  01/06/2025:
                </Typography>
                <QRCodeSVG value={p.qrRawData["2025-06-01"]} size={100} />
              </Box>
            ) : (
              <Typography sx={{ color: "#666666", mt: 1 }}>
                QR Codes não disponíveis
              </Typography>
            )}
          </li>
        ))}
      </ul>
      <Typography sx={{ color: "#333333", mt: 1 }}>
        <strong>Detalhes do Pedido:</strong>
      </Typography>
      <Typography sx={{ color: "#666666" }}>
        Documento do pagador: {checkout.document}
      </Typography>
      <Typography sx={{ color: "#666666" }}>
        Inteiros: {checkout.orderDetails.fullTickets} (R${" "}
        {checkout.orderDetails.valueTicketsAll})
      </Typography>
      <Typography sx={{ color: "#666666" }}>
        Meia: {checkout.orderDetails.halfTickets} (R${" "}
        {checkout.orderDetails.valueTicketsHalf})
      </Typography>
      <Typography sx={{ color: "#666666" }}>
        Desconto: R$ {checkout.orderDetails.discount}
      </Typography>
      {checkout.paymentDetails.pix && (
        <Typography sx={{ color: "#666666" }}>
          PIX: {checkout.paymentDetails.pix.qrCodeString}
        </Typography>
      )}
      {checkout.paymentDetails.creditCard && (
        <>
          <Typography sx={{ color: "#666666" }}>
            Cartão: {checkout.paymentDetails.creditCard.last4Digits}
          </Typography>
          <Typography sx={{ color: "#666666" }}>
            Parcelas: {checkout.paymentDetails.creditCard.installments}
          </Typography>
        </>
      )}
      <Button
        variant="outlined"
        onClick={() => setOpenDetailsModal(null)}
        sx={{
          mt: 2,
          borderColor: "#1976D2",
          color: "#1976D2",
          "&:hover": { borderColor: "#1565C0" },
        }}
      >
        Fechar
      </Button>
    </>
  );
};

export default ModalCheckoutDetails;
