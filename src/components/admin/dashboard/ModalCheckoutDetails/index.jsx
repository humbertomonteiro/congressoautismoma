import styles from "./modalCheckoutDetails.module.css";
import {
  Typography,
  Box,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Grid,
  TextField,
} from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { IoIosArrowDown } from "react-icons/io";
import { useState } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../../../../firebaseConfig"; // Ajuste o caminho
import PaymentService from "../../../../data/services/PaymentService"; // Ajuste o caminho
import { toast } from "react-toastify";
import { FaRegEdit } from "react-icons/fa";

const EMAIL_FROM = import.meta.env.VITE_EMAIL_FROM;

const ModalCheckoutDetails = ({
  checkout,
  setOpenDetailsModal,
  formatTimestamp,
  title,
  message,
  updateCheckoutInContext,
}) => {
  const [participants, setParticipants] = useState(checkout.participants);
  const [observation, setObservation] = useState(
    checkout?.observation || "Sem observações..."
  );
  const [isEditingObservation, setIsEditingObservation] = useState(false);
  const [editingParticipantIndex, setEditingParticipantIndex] = useState(null);

  const handleInputChange = (index, field, value) => {
    const updatedParticipants = [...participants];
    updatedParticipants[index][field] = value;
    setParticipants(updatedParticipants);
  };

  const clearQrCodes = (index) => {
    const updatedParticipants = [...participants];
    delete updatedParticipants[index].qrCodes;
    delete updatedParticipants[index].qrRawData;
    setParticipants(updatedParticipants);
  };

  const saveChanges = async () => {
    try {
      const checkoutRef = doc(db, "checkouts", checkout.id);
      await updateDoc(checkoutRef, {
        participants,
        observation, // Salva a observação atualizada
      });
      toast.success("Alterações salvas com sucesso!");

      // Atualiza o contexto global
      updateCheckoutInContext({ ...checkout, participants, observation });
      setIsEditingObservation(false); // Sai do modo de edição após salvar
    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
      toast.error("Erro ao salvar alterações");
    }
  };

  const sendConfirmationEmail = async (participant, index) => {
    if (
      participant.qrRawData &&
      (participant.qrRawData["2025-05-31"] ||
        participant.qrRawData["2025-06-01"])
    ) {
      toast.error(
        "Este participante já possui QR Codes. Apague-os antes de enviar o email de confirmação."
      );
      return;
    }

    try {
      const emailData = {
        checkoutId: checkout.id,
        from: EMAIL_FROM,
        to: participant.email,
        subject: "Confirmação de Pagamento - Congresso Autismo MA 2025",
        data: {
          name: participant.name,
          transactionId: checkout.transactionId,
          fullTickets: checkout.orderDetails.fullTickets,
          valueTicketsAll:
            checkout.orderDetails.valueTicketsAll ||
            checkout.orderDetails.fullTicketsValue,
          halfTickets: checkout.orderDetails.halfTickets,
          valueTicketsHalf:
            checkout.orderDetails.valueTicketsHalf ||
            checkout.orderDetails.halfTicketsValue,
          coupon: checkout.orderDetails.coupon || "",
          discount: checkout.orderDetails.discount || "0.00",
          total: checkout.totalAmount,
          installments:
            checkout.paymentMethod === "creditCard"
              ? checkout.paymentDetails.creditCard?.installments || "1"
              : "1",
        },
      };

      console.log(
        "Enviando email de confirmação para:",
        participant.email,
        emailData
      );

      if (
        !emailData.from ||
        !emailData.to ||
        !emailData.subject ||
        !emailData.data ||
        !emailData.checkoutId
      ) {
        console.error("Campos obrigatórios faltando no emailData:", emailData);
        toast.error("Erro ao enviar email: Campos obrigatórios faltando.");
        throw new Error(
          "Dados insuficientes para enviar o email de confirmação."
        );
      }

      const emailResponse = await toast.promise(
        PaymentService.sendConfirmationEmail(emailData),
        {
          pending: "Enviando email...",
          success: "Email enviado com sucesso!",
          error: "Verifique o email, caso não tenha recebido, tente novamente.",
        }
      );
      console.log("Resposta do envio de email:", emailResponse);

      const checkoutRef = doc(db, "checkouts", checkout.id);
      const checkoutSnap = await getDoc(checkoutRef);
      if (checkoutSnap.exists()) {
        const updatedCheckout = { id: checkout.id, ...checkoutSnap.data() };
        const updatedParticipants = updatedCheckout.participants;
        setParticipants(updatedParticipants);
        updateCheckoutInContext(updatedCheckout);
      } else {
        throw new Error(
          "Checkout não encontrado no Firebase após o envio do email."
        );
      }
    } catch (error) {
      console.error("Erro ao enviar email ou buscar dados:", error);
      toast.error(
        "Aguarde um momento e verifique seu email, caso não tenha recebido, tente novamente."
      );
    }
  };

  return (
    <>
      {checkout ? (
        <Box sx={{ p: 2 }}>
          <Typography
            variant="h5"
            sx={{ color: "#333333", fontWeight: 600, mb: 3 }}
          >
            Detalhes do Checkout
          </Typography>

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

          <Typography
            variant="h6"
            sx={{ color: "#1976D2", fontWeight: 500, mb: 2 }}
          >
            Participantes
          </Typography>
          {participants.map((p, index) => (
            <Accordion
              key={index}
              sx={{ mb: 1, boxShadow: "none", border: "1px solid #e0e0e0" }}
            >
              <AccordionSummary expandIcon={<IoIosArrowDown />}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography sx={{ color: "#333333", fontWeight: 600 }}>
                    {p.name} {p.isHalfPrice ? "(Meia)" : ""}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Button
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingParticipantIndex(
                      editingParticipantIndex === index ? null : index
                    );
                  }}
                  sx={{ mb: 2 }}
                >
                  {editingParticipantIndex === index ? (
                    "Cancelar"
                  ) : (
                    <FaRegEdit />
                  )}
                </Button>
                {editingParticipantIndex === index ? (
                  <>
                    <TextField
                      label="Nome"
                      value={p.name}
                      onChange={(e) =>
                        handleInputChange(index, "name", e.target.value)
                      }
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="CPF"
                      value={p.document || p.cpf}
                      onChange={(e) =>
                        handleInputChange(index, "document", e.target.value)
                      }
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="E-mail"
                      value={p.email}
                      onChange={(e) =>
                        handleInputChange(index, "email", e.target.value)
                      }
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Número"
                      value={p.number || ""}
                      onChange={(e) =>
                        handleInputChange(index, "number", e.target.value)
                      }
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                  </>
                ) : (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Typography sx={{ color: "#666666" }}>
                      <strong>Nome:</strong> {p.name}
                    </Typography>
                    <Typography sx={{ color: "#666666" }}>
                      <strong>CPF:</strong> {p.document || p.cpf}
                    </Typography>
                    <Typography sx={{ color: "#666666" }}>
                      <strong>E-mail:</strong> {p.email}
                    </Typography>
                    <Typography sx={{ color: "#666666" }}>
                      <strong>Número:</strong> {p.number || "Não informado"}
                    </Typography>
                  </Box>
                )}
                {p.qrRawData &&
                p.qrRawData["2025-05-31"] &&
                p.qrRawData["2025-06-01"] ? (
                  <Box sx={{ mt: 2 }}>
                    <Typography sx={{ color: "#666666", fontWeight: 500 }}>
                      <strong>QR Codes:</strong>
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
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
                  {!p.qrRawData && (
                    <Button
                      sx={{ flex: "1 1 45%", minWidth: "150px" }}
                      variant="outlined"
                      onClick={() => sendConfirmationEmail(p, index)}
                    >
                      Enviar Email de Confirmação
                    </Button>
                  )}
                  {p.qrRawData && editingParticipantIndex === index && (
                    <Button
                      sx={{ flex: "1 1 45%", minWidth: "150px" }}
                      variant="outlined"
                      color="error"
                      onClick={() => clearQrCodes(index)}
                    >
                      Apagar QR Codes
                    </Button>
                  )}
                  {editingParticipantIndex === index && (
                    <Button
                      variant="contained"
                      onClick={saveChanges}
                      sx={{ flex: "1 1 45%", minWidth: "150px" }}
                    >
                      Salvar Alterações
                    </Button>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}

          <Divider sx={{ my: 3 }} />

          <Typography
            variant="h6"
            sx={{ color: "#1976D2", fontWeight: 500, mb: 2 }}
          >
            Detalhes do Pedido
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography sx={{ color: "#666666" }}>
              <strong>Documento do Pagador:</strong> {checkout.document}
            </Typography>
            {checkout.orderDetails.fullTickets > 0 && (
              <Typography sx={{ color: "#666666" }}>
                <strong>Inteiros:</strong> {checkout.orderDetails.fullTickets}{" "}
                (R$
                {checkout.orderDetails.valueTicketsAll ||
                  checkout.orderDetails.fullTicketsValue}
                )
              </Typography>
            )}
            {checkout.orderDetails.halfTickets > 0 && (
              <Typography sx={{ color: "#666666" }}>
                <strong>Meia:</strong> {checkout.orderDetails.halfTickets} (R$
                {checkout.orderDetails.valueTicketsHalf ||
                  checkout.orderDetails.halfTicketsValue}
                )
              </Typography>
            )}
            {checkout.orderDetails.coupon && (
              <>
                <Typography sx={{ color: "#666666" }}>
                  <strong>Desconto:</strong> R$ {checkout.orderDetails.discount}
                </Typography>
                <Typography sx={{ color: "#666666" }}>
                  <strong>Cupom:</strong> {checkout.orderDetails.coupon}
                </Typography>
              </>
            )}
            <Box sx={{ display: "flex", flexDirection: "column", mb: 2 }}>
              <Typography sx={{ color: "#666666" }}>
                <strong>Observação:</strong>
              </Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "start" }}>
                {isEditingObservation ? (
                  <TextField
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    sx={{ flexGrow: 1 }}
                  />
                ) : (
                  <Typography sx={{ color: "#666666", flexGrow: 1 }}>
                    {observation}
                  </Typography>
                )}
                <Button
                  variant="outlined"
                  onClick={() => setIsEditingObservation(!isEditingObservation)}
                >
                  {isEditingObservation ? "Cancelar" : <FaRegEdit />}
                </Button>
              </Box>
              {isEditingObservation && (
                <Button
                  variant="contained"
                  onClick={saveChanges}
                  sx={{ mt: 2, mb: 3 }}
                >
                  Salvar Alterações
                </Button>
              )}
            </Box>
            <Typography sx={{ color: "#333333", fontWeight: 500, mb: 3 }}>
              <strong>Valor Total:</strong> R$ {checkout.totalAmount}
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

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
