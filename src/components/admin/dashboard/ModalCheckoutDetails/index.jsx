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
  Select,
  MenuItem,
} from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { IoIosArrowDown } from "react-icons/io";
import { useState } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../../../../firebaseConfig";
import PaymentService from "../../../../data/services/PaymentService";
import { toast } from "react-toastify";
import { FaRegEdit } from "react-icons/fa";

const EMAIL_FROM = import.meta.env.VITE_EMAIL_FROM;

const statusOptions = [
  { value: "approved", label: "Aprovado" },
  { value: "pending", label: "Pendente" },
  { value: "error", label: "Erro" },
  { value: "canceled", label: "Cancelado" },
  { value: "refunded", label: "Estornado" },
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

const ModalCheckoutDetails = ({
  checkout,
  setOpenDetailsModal,
  formatTimestamp,
  title,
  message,
  updateCheckoutInContext,
}) => {
  const [participants, setParticipants] = useState(checkout.participants);
  const [orderData, setOrderData] = useState({
    document: checkout.document || checkout.cpf || "",
    status: checkout.status || "",
    paymentMethod: checkout.paymentMethod || "",
    observation: checkout.observation || "Sem observações...",
    totalAmount: checkout.totalAmount || "0.00",
    orderDetails: {
      fullTickets: checkout.orderDetails.fullTickets || 0,
      halfTickets: checkout.orderDetails.halfTickets || 0,
      coupon: checkout.orderDetails.coupon || "",
      discount: checkout.orderDetails.discount || "0.00",
      valueTicketsAll:
        checkout.orderDetails.valueTicketsAll ||
        checkout.orderDetails.fullTicketsValue ||
        "0.00",
      valueTicketsHalf:
        checkout.orderDetails.valueTicketsHalf ||
        checkout.orderDetails.halfTicketsValue ||
        "0.00",
    },
  });
  const [isEditingOrderDetails, setIsEditingOrderDetails] = useState(false);
  const [editingParticipantIndex, setEditingParticipantIndex] = useState(null);

  const handleInputChange = (index, field, value) => {
    const updatedParticipants = [...participants];
    updatedParticipants[index][field] = value;
    setParticipants(updatedParticipants);
  };

  const handleOrderDataChange = (field, value, nestedField = null) => {
    const updatedOrderData = { ...orderData };

    if (nestedField) {
      // Atualiza campo dentro de orderDetails
      updatedOrderData.orderDetails[nestedField] = value;

      // Recalcula valueTicketsAll e valueTicketsHalf
      const fullPrice = 499.9; // Preço do ingresso inteiro (conforme Item1)
      const halfPrice = 399.9; // Preço do ingresso meia (conforme ItemHalf)
      updatedOrderData.orderDetails.valueTicketsAll = (
        parseInt(updatedOrderData.orderDetails.fullTickets || 0) * fullPrice
      ).toFixed(2);
      updatedOrderData.orderDetails.valueTicketsHalf = (
        parseInt(updatedOrderData.orderDetails.halfTickets || 0) * halfPrice
      ).toFixed(2);

      // Recalcula totalAmount
      updatedOrderData.totalAmount = (
        parseInt(updatedOrderData.orderDetails.fullTickets || 0) * fullPrice +
        parseInt(updatedOrderData.orderDetails.halfTickets || 0) * halfPrice -
        parseFloat(updatedOrderData.orderDetails.discount || 0)
      ).toFixed(2);
    } else {
      // Atualiza campo de nível superior
      updatedOrderData[field] = value;
    }

    setOrderData(updatedOrderData);
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
        document: orderData.document,
        status: orderData.status,
        paymentMethod: orderData.paymentMethod,
        observation: orderData.observation,
        totalAmount: orderData.totalAmount,
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

      // Atualiza o contexto global
      updateCheckoutInContext({
        ...checkout,
        participants,
        document: orderData.document,
        status: orderData.status,
        paymentMethod: orderData.paymentMethod,
        observation: orderData.observation,
        totalAmount: orderData.totalAmount,
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
      setIsEditingOrderDetails(false);
      setEditingParticipantIndex(null);
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
          fullTickets: orderData.orderDetails.fullTickets,
          valueTicketsAll: orderData.orderDetails.valueTicketsAll,
          halfTickets: orderData.orderDetails.halfTickets,
          valueTicketsHalf: orderData.orderDetails.valueTicketsHalf,
          coupon: orderData.orderDetails.coupon || "",
          discount: orderData.orderDetails.discount || "0.00",
          total: orderData.totalAmount,
          installments:
            orderData.paymentMethod === "creditCard"
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
        setParticipants(updatedCheckout.participants);
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

  // Função para obter o label do paymentMethod
  const getPaymentMethodLabel = (value) => {
    const method = paymentMethods.find((m) => m.value === value);
    return method
      ? method.label
      : value.charAt(0).toUpperCase() + value.slice(1);
  };

  // Função para obter o label do status
  const getStatusLabel = (value) => {
    const status = statusOptions.find((s) => s.value === value);
    return status
      ? status.label
      : value.charAt(0).toUpperCase() + value.slice(1);
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
                    <Button
                      variant="contained"
                      onClick={saveChanges}
                      sx={{ mt: 2 }}
                    >
                      Salvar Alterações
                    </Button>
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
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}

          <Divider sx={{ my: 3 }} />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: "#1976D2", fontWeight: 500, mb: 2 }}
            >
              Detalhes do Pedido
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setIsEditingOrderDetails(!isEditingOrderDetails)}
            >
              {isEditingOrderDetails ? "Cancelar" : <FaRegEdit />}
            </Button>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "start", mb: 3 }}>
            {isEditingOrderDetails ? (
              <Box sx={{ flexGrow: 1 }}>
                <TextField
                  label="Documento do Pagador"
                  value={orderData.document}
                  onChange={(e) =>
                    handleOrderDataChange("document", e.target.value)
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <Select
                  label="Status"
                  value={orderData.status}
                  onChange={(e) =>
                    handleOrderDataChange("status", e.target.value)
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                <Select
                  label="Método de Pagamento"
                  value={orderData.paymentMethod}
                  onChange={(e) =>
                    handleOrderDataChange("paymentMethod", e.target.value)
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {paymentMethods.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                <TextField
                  label="Ingressos Inteiros"
                  type="number"
                  value={orderData.orderDetails.fullTickets}
                  onChange={(e) =>
                    handleOrderDataChange(
                      "orderDetails",
                      e.target.value,
                      "fullTickets"
                    )
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                  inputProps={{ min: 0 }}
                />
                <TextField
                  label="Ingressos Meia-Entrada"
                  type="number"
                  value={orderData.orderDetails.halfTickets}
                  onChange={(e) =>
                    handleOrderDataChange(
                      "orderDetails",
                      e.target.value,
                      "halfTickets"
                    )
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                  inputProps={{ min: 0 }}
                />
                <TextField
                  label="Cupom"
                  value={orderData.orderDetails.coupon}
                  onChange={(e) =>
                    handleOrderDataChange(
                      "orderDetails",
                      e.target.value,
                      "coupon"
                    )
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Desconto (R$)"
                  type="number"
                  value={orderData.orderDetails.discount}
                  onChange={(e) =>
                    handleOrderDataChange(
                      "orderDetails",
                      e.target.value,
                      "discount"
                    )
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                  inputProps={{ min: 0, step: "0.01" }}
                />
                <Typography sx={{ color: "#666666", mb: 2 }}>
                  <strong>Valor Ingressos Inteiros:</strong> R${" "}
                  {orderData.orderDetails.valueTicketsAll}
                </Typography>
                <Typography sx={{ color: "#666666", mb: 2 }}>
                  <strong>Valor Ingressos Meia:</strong> R${" "}
                  {orderData.orderDetails.valueTicketsHalf}
                </Typography>
                <TextField
                  label="Observação"
                  value={orderData.observation}
                  onChange={(e) =>
                    handleOrderDataChange("observation", e.target.value)
                  }
                  fullWidth
                  multiline
                  rows={2}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Valor Total (R$)"
                  type="number"
                  value={orderData.totalAmount}
                  onChange={(e) =>
                    handleOrderDataChange("totalAmount", e.target.value)
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                  inputProps={{ step: "0.01" }}
                />
                <Button
                  variant="contained"
                  onClick={saveChanges}
                  sx={{ mt: 2 }}
                >
                  Salvar Alterações
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                <Typography sx={{ color: "#666666" }}>
                  <strong>Documento do Pagador:</strong>{" "}
                  {orderData.document ||
                    orderData.cpf ||
                    participants[0].document}
                </Typography>
                <Typography sx={{ color: "#666666" }}>
                  <strong>Status:</strong> {getStatusLabel(orderData.status)}
                </Typography>
                <Typography sx={{ color: "#666666" }}>
                  <strong>Método:</strong>{" "}
                  {getPaymentMethodLabel(orderData.paymentMethod)}
                </Typography>
                {orderData.orderDetails.fullTickets > 0 && (
                  <Typography sx={{ color: "#666666" }}>
                    <strong>Inteiros:</strong>{" "}
                    {orderData.orderDetails.fullTickets} (R${" "}
                    {orderData.orderDetails.valueTicketsAll})
                  </Typography>
                )}
                {orderData.orderDetails.halfTickets > 0 && (
                  <Typography sx={{ color: "#666666" }}>
                    <strong>Meia:</strong> {orderData.orderDetails.halfTickets}{" "}
                    (R$
                    {orderData.orderDetails.valueTicketsHalf})
                  </Typography>
                )}
                {orderData.orderDetails.coupon && (
                  <>
                    <Typography sx={{ color: "#666666" }}>
                      <strong>Desconto:</strong> R${" "}
                      {orderData.orderDetails.discount}
                    </Typography>
                    <Typography sx={{ color: "#666666" }}>
                      <strong>Cupom:</strong> {orderData.orderDetails.coupon}
                    </Typography>
                  </>
                )}
                <Typography sx={{ color: "#666666" }}>
                  <strong>Observação:</strong> {orderData.observation}
                </Typography>
                <Typography sx={{ color: "#333333", fontWeight: 500 }}>
                  <strong>Valor Total:</strong> R$ {orderData.totalAmount}
                </Typography>
              </Box>
            )}
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
