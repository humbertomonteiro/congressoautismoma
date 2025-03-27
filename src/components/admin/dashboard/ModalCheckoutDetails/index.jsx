import {
  Typography,
  Box,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Grid,
} from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { IoIosArrowDown } from "react-icons/io";

const ModalCheckoutDetails = ({
  checkout,
  setOpenDetailsModal,
  formatTimestamp,
  title,
  message,
  openDetailsModal,
}) => {
  return (
    <>
      {checkout ? (
        <Box sx={{ p: 2 }}>
          {/* Título Principal */}
          <Typography
            variant="h5"
            sx={{ color: "#333333", fontWeight: 600, mb: 3 }}
          >
            Detalhes do Checkout
          </Typography>

          {/* Seção: Informações Gerais */}
          <Typography
            variant="h6"
            sx={{ color: "#1976D2", fontWeight: 500, mb: 2 }}
          >
            Informações Gerais
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Typography sx={{ color: "#666666" }}>
                <strong>Evento:</strong> {checkout.eventName}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ color: "#666666" }}>
                <strong>Data e Hora:</strong>{" "}
                {formatTimestamp(checkout.timestamp)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ color: "#666666" }}>
                <strong>Status:</strong>{" "}
                {checkout.status.charAt(0).toUpperCase() +
                  checkout.status.slice(1)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ color: "#666666" }}>
                <strong>Método:</strong>{" "}
                {checkout.paymentMethod.charAt(0).toUpperCase() +
                  checkout.paymentMethod.slice(1)}
              </Typography>
            </Grid>
          </Grid>
          <Divider sx={{ mb: 3 }} />

          {/* Seção: Participantes */}
          <Typography
            variant="h6"
            sx={{ color: "#1976D2", fontWeight: 500, mb: 2 }}
          >
            Participantes
          </Typography>
          {checkout.participants.map((p, index) => (
            <Accordion
              key={index}
              sx={{ mb: 1, boxShadow: "none", border: "1px solid #e0e0e0" }}
            >
              <AccordionSummary expandIcon={<IoIosArrowDown />}>
                <Typography sx={{ color: "#333333", fontWeight: 500 }}>
                  {p.name} {p.isHalfPrice ? "(Meia)" : ""}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ color: "#666666" }}>
                  <strong>CPF:</strong> {p.cpf}
                </Typography>
                {p.qrRawData &&
                p.qrRawData["2025-05-31"] &&
                p.qrRawData["2025-06-01"] ? (
                  <Box sx={{ mt: 1 }}>
                    <Typography sx={{ color: "#666666", fontWeight: 500 }}>
                      QR Codes:
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                      <Box>
                        <Typography sx={{ color: "#666666" }}>
                          31/05/2025
                        </Typography>
                        <QRCodeSVG
                          value={p.qrRawData["2025-05-31"]}
                          size={100}
                        />
                      </Box>
                      <Box>
                        <Typography sx={{ color: "#666666" }}>
                          01/06/2025
                        </Typography>
                        <QRCodeSVG
                          value={p.qrRawData["2025-06-01"]}
                          size={100}
                        />
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Typography sx={{ color: "#666666", mt: 1 }}>
                    QR Codes não disponíveis
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
          <Divider sx={{ my: 3 }} />

          {/* Seção: Detalhes do Pedido */}
          <Typography
            variant="h6"
            sx={{ color: "#1976D2", fontWeight: 500, mb: 2 }}
          >
            Detalhes do Pedido
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Typography sx={{ color: "#666666" }}>
                <strong>Documento do Pagador:</strong> {checkout.document}
              </Typography>
            </Grid>
            {checkout.orderDetails.fullTickets > 0 && (
              <Grid item xs={6}>
                <Typography sx={{ color: "#666666" }}>
                  <strong>Inteiros:</strong> {checkout.orderDetails.fullTickets}{" "}
                  (R$
                  {checkout.orderDetails.valueTicketsAll})
                </Typography>
              </Grid>
            )}

            {checkout.orderDetails.halfTickets > 0 && (
              <Grid item xs={6}>
                <Typography sx={{ color: "#666666" }}>
                  <strong>Meia:</strong> {checkout.orderDetails.halfTickets} (R${" "}
                  {checkout.orderDetails.valueTicketsHalf})
                </Typography>
              </Grid>
            )}
            {checkout.orderDetails.coupon && (
              <>
                <Grid item xs={6}>
                  <Typography sx={{ color: "#666666" }}>
                    <strong>Desconto:</strong> R${" "}
                    {checkout.orderDetails.discount}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography sx={{ color: "#666666" }}>
                    <strong>Cupom:</strong> {checkout.orderDetails.coupon}
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
          <Grid item xs={12} sx={{ mb: 3 }}>
            <Typography sx={{ color: "#333333", fontWeight: 500 }}>
              <strong>Valor Total:</strong> R$ {checkout.totalAmount}
            </Typography>
          </Grid>
          <Divider sx={{ mb: 3 }} />

          {/* Seção: Informações de Pagamento */}
          <Typography
            variant="h6"
            sx={{ color: "#1976D2", fontWeight: 500, mb: 2 }}
          >
            Informações de Pagamento
          </Typography>
          {checkout.paymentDetails.pix && (
            <Typography sx={{ color: "#666666" }}>
              <strong>PIX:</strong> {checkout.paymentDetails.pix.qrCodeString}
            </Typography>
          )}
          {checkout.status === "error" && (
            <Typography style={{ color: "red" }}>
              <strong>Erro:</strong>{" "}
              {checkout.errorLog ? checkout.errorLog : "Boleto Vencido"}
            </Typography>
          )}
          {checkout.paymentDetails.creditCard && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography sx={{ color: "#666666" }}>
                  <strong>Final do Cartão:</strong>{" "}
                  {checkout.paymentDetails.creditCard.last4Digits}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ color: "#666666" }}>
                  <strong>Parcelas:</strong>{" "}
                  {checkout.paymentDetails.creditCard.installments}
                </Typography>
              </Grid>
            </Grid>
          )}
          {!checkout.paymentDetails.pix &&
            !checkout.paymentDetails.creditCard &&
            !checkout.errorLog && (
              <Typography sx={{ color: "#666666" }}>
                Nenhuma informação de pagamento disponível
              </Typography>
            )}

          {/* Botão Fechar */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => setOpenDetailsModal(null)}
              sx={{
                borderColor: "#1976D2",
                color: "#1976D2",
                textTransform: "none",
                "&:hover": {
                  borderColor: "#1565C0",
                  backgroundColor: "#f5faff",
                },
              }}
            >
              Fechar
            </Button>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            p: 2,
            textAlign: "center",
            color: "#666666",
            borderRadius: "8px",
          }}
        >
          <Typography
            variant="h5"
            sx={{ color: "#333333", fontWeight: 600, mb: 2 }}
          >
            {title}
          </Typography>
          <Typography sx={{ color: "#666666", mb: 2 }}>{message}</Typography>
          <Button
            variant="outlined"
            onClick={() => setOpenDetailsModal(null)}
            sx={{
              borderColor: "#1976D2",
              color: "#1976D2",
              textTransform: "none",
              "&:hover": { borderColor: "#1565C0", backgroundColor: "#f5faff" },
            }}
          >
            Fechar
          </Button>
        </Box>
      )}
    </>
  );
};

export default ModalCheckoutDetails;
