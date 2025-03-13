import React, { useState, useEffect } from "react";
import { db } from "../../../../firebaseConfig";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import axios from "axios";
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Modal,
} from "@mui/material";
import { FaWhatsapp } from "react-icons/fa6";
import { QRCodeSVG } from "qrcode.react";
import styles from "./dashboardSection.module.css";
import AddManualPayment from "../AddManualPayment";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DashboardSection = () => {
  const [checkouts, setCheckouts] = useState([]);
  const [filteredCheckouts, setFilteredCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalDocs, setTotalDocs] = useState(0);
  const [lastDoc, setLastDoc] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [eventOptions, setEventOptions] = useState([]);
  const [metrics, setMetrics] = useState({
    successTicketsFull: 0,
    successTicketsHalf: 0,
    successValue: 0,
    pendingCount: 0,
    pendingValue: 0,
    errorCount: 0,
    errorValue: 0,
    successCount: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [qrCodeData, setQrCodeData] = useState({});
  const [openDetailsModal, setOpenDetailsModal] = useState(null);

  useEffect(() => {
    const fetchEventOptionsAndMetrics = async () => {
      const snapshot = await getDocs(collection(db, "checkouts"));
      const events = [
        ...new Set(snapshot.docs.map((doc) => doc.data().eventName)),
      ];
      setEventOptions(events);

      let successTicketsFull = 0,
        successTicketsHalf = 0,
        successValue = 0,
        pendingCount = 0,
        pendingValue = 0,
        errorCount = 0,
        errorValue = 0,
        successCount = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.status === "approved") {
          successTicketsFull += data.orderDetails.fullTickets || 0;
          successTicketsHalf += data.orderDetails.halfTickets || 0;
          successValue += parseFloat(data.totalAmount) || 0;
          successCount += 1;
        } else if (data.status === "pending") {
          pendingCount += 1;
          pendingValue += parseFloat(data.totalAmount) || 0;
        } else if (data.status === "error") {
          errorCount += 1;
          errorValue += parseFloat(data.totalAmount) || 0;
        }
      });

      setMetrics({
        successTicketsFull,
        successTicketsHalf,
        successValue: successValue.toFixed(2),
        pendingCount,
        pendingValue: pendingValue.toFixed(2),
        errorCount,
        errorValue: errorValue.toFixed(2),
        successCount,
      });
    };
    fetchEventOptionsAndMetrics();
    fetchCheckouts();
  }, []);

  const fetchCheckouts = async (startAfterDoc = null) => {
    setLoading(true);
    try {
      let q = query(
        collection(db, "checkouts"),
        orderBy("timestamp", "desc"),
        limit(rowsPerPage)
      );
      if (statusFilter)
        q = query(q, where("status", "==", statusFilter.toLowerCase()));
      if (methodFilter)
        q = query(q, where("paymentMethod", "==", methodFilter));
      if (dateFilter) {
        const localDate = new Date(dateFilter);
        const startOfDay = new Date(localDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(localDate.setHours(23, 59, 59, 999));
        const utcStart = new Date(
          startOfDay.getTime() - startOfDay.getTimezoneOffset() * 60000
        );
        const utcEnd = new Date(
          endOfDay.getTime() - endOfDay.getTimezoneOffset() * 60000
        );
        q = query(
          q,
          where("timestamp", ">=", utcStart.toISOString()),
          where("timestamp", "<=", utcEnd.toISOString())
        );
      }
      if (eventFilter) q = query(q, where("eventName", "==", eventFilter));
      if (startAfterDoc) q = query(q, startAfter(startAfterDoc));

      const snapshot = await getDocs(q);
      const checkoutData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCheckouts(checkoutData);
      setFilteredCheckouts(checkoutData);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setTotalDocs((await getDocs(collection(db, "checkouts"))).size);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar checkouts:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckouts();
  }, [rowsPerPage, statusFilter, methodFilter, dateFilter, eventFilter]);

  const isProduction = import.meta.env.VITE_ENV === "production";
  const baseUrl = isProduction
    ? import.meta.env.VITE_BASE_URL_PRODUCTION
    : import.meta.env.VITE_BASE_URL_SANDBOX;

  const handleCheckPaymentStatus = async (checkoutId, paymentId) => {
    try {
      const response = await axios.post(baseUrl, { paymentId });
      const { status } = response.data;
      const checkoutRef = doc(db, "checkouts", checkoutId);
      await updateDoc(checkoutRef, { status });
      setCheckouts((prev) =>
        prev.map((c) => (c.id === checkoutId ? { ...c, status } : c))
      );
      setFilteredCheckouts((prev) =>
        prev.map((c) => (c.id === checkoutId ? { ...c, status } : c))
      );
    } catch (error) {
      console.error("Erro ao checar status:", error);
    }
  };

  const handleContactParticipant = (participantPhone, paymentMethod) => {
    const message = `Olá! Vi que houve uma tentativa de pagamento via ${paymentMethod} no Congresso Autismo MA 2025. Podemos ajudar com algo?`;
    const whatsappUrl = `https://wa.me/${participantPhone}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    if (newPage > page) fetchCheckouts(lastDoc);
    else fetchCheckouts();
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    fetchCheckouts();
  };

  const exportToCSV = () => {
    const headers = [
      "ID da Transação",
      "Data/Hora",
      "Status",
      "Método",
      "Evento",
      "Valor Total",
      "Participantes",
      "Ingressos Inteiros",
      "Ingressos Meia",
      "Desconto",
      "Cupom",
    ];
    const rows = filteredCheckouts.map((checkout) => [
      checkout.transactionId,
      new Date(checkout.timestamp).toLocaleString(),
      checkout.status,
      checkout.paymentMethod,
      checkout.eventName,
      `R$ ${checkout.totalAmount}`,
      checkout.participants.length,
      checkout.orderDetails.fullTickets,
      checkout.orderDetails.halfTickets,
      `R$ ${checkout.orderDetails.discount}`,
      checkout.orderDetails.coupon || "Nenhum",
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "checkouts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Checkouts - Congresso Autismo MA", 10, 10);
    autoTable(doc, {
      head: [["Status", "Método", "Valor Total", "Participantes", "email"]],
      body: filteredCheckouts.map((checkout) => [
        checkout.status,
        checkout.paymentMethod,
        `R$ ${checkout.totalAmount}`,
        `${checkout.participants.length} (${
          checkout.participants.filter((p) => p.isHalfPrice).length
        } meia)`,
        checkout.participants[0].email,
      ]),
    });
    doc.save("checkouts.pdf");
  };

  const generateQRCodes = async (checkoutId, participantIndex) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/payments/generate-qr-codes",
        { checkoutId, participantIndex }
      );
      if (response.data.success) {
        setQrCodeData((prev) => ({
          ...prev,
          [`${checkoutId}-${participantIndex}`]: response.data,
        }));
      }
    } catch (error) {
      console.error("Erro ao gerar QR Codes:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return { borderLeft: "4px solid #4caf50" }; // Verde
      case "pending":
        return { borderLeft: "4px solid #ffca28" }; // Amarelo
      case "error":
        return { borderLeft: "4px solid #f44336" }; // Vermelho
      default:
        return { borderLeft: "4px solid #bdbdbd" }; // Cinza
    }
  };

  const chartData = [
    { name: "Aprovados", value: metrics.successCount, fill: "#4caf50" },
    { name: "Pendentes", value: metrics.pendingCount, fill: "#ffca28" },
    { name: "Erros", value: metrics.errorCount, fill: "#f44336" },
  ];

  if (loading) return <div className={styles.loading}>Carregando...</div>;

  return (
    <div className={styles.container}>
      <h1>Dashboard</h1>

      {/* Métricas */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">Ingressos Inteiros</Typography>
            <Typography variant="h5" color="primary">
              {metrics.successTicketsFull}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">Ingressos Meia</Typography>
            <Typography variant="h5" color="primary">
              {metrics.successTicketsHalf}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">Valor Total Vendido</Typography>
            <Typography variant="h5" color="primary">
              R$ {metrics.successValue}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Status dos Checkouts
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Card sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Filtros
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="approved">Aprovado</MenuItem>
                <MenuItem value="pending">Pendente</MenuItem>
                <MenuItem value="error">Erro</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Método</InputLabel>
              <Select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                label="Método"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="creditCard">Cartão de Crédito</MenuItem>
                <MenuItem value="pix">PIX</MenuItem>
                <MenuItem value="boleto">Boleto</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Evento</InputLabel>
              <Select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                label="Evento"
              >
                <MenuItem value="">Todos</MenuItem>
                {eventOptions.map((event, index) => (
                  <MenuItem key={index} value={event}>
                    {event}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="date"
              label="Data"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Buscar por ID ou Email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Checkouts */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            mb: 2,
            gap: 2,
          }}
        >
          <Typography variant="h6">Checkouts</Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="contained" onClick={exportToCSV} sx={{ mr: 1 }}>
              Exportar CSV
            </Button>
            <Button variant="contained" onClick={exportToPDF}>
              Exportar PDF
            </Button>
          </Box>
        </Box>
        <Grid container spacing={2}>
          {filteredCheckouts
            .filter(
              (checkout) =>
                checkout.transactionId?.toLowerCase().includes(searchQuery) ||
                checkout.participants.some((p) =>
                  p.email.toLowerCase().includes(searchQuery)
                )
            )
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((checkout) => (
              <Grid item xs={12} sm={6} md={4} key={checkout.id}>
                <Card
                  sx={{
                    ...getStatusColor(checkout.status),
                    "&:hover": { boxShadow: 6 },
                  }}
                >
                  <CardContent>
                    <Typography variant="h6">{checkout.eventName}</Typography>
                    <Typography>Status: {checkout.status}</Typography>
                    <Typography>Método: {checkout.paymentMethod}</Typography>
                    <Typography>Valor: R$ {checkout.totalAmount}</Typography>
                    <Typography>
                      Participantes: {checkout.participants.length} (
                      {
                        checkout.participants.filter((p) => p.isHalfPrice)
                          .length
                      }{" "}
                      meia)
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button onClick={() => setOpenDetailsModal(checkout.id)}>
                      Detalhes
                    </Button>
                    {checkout.participants[0]?.number && (
                      <IconButton
                        onClick={() =>
                          handleContactParticipant(
                            checkout.participants[0].number,
                            checkout.paymentMethod
                          )
                        }
                      >
                        <FaWhatsapp />
                      </IconButton>
                    )}
                    {checkout.paymentId && checkout.status === "pending" && (
                      <Button
                        onClick={() =>
                          handleCheckPaymentStatus(
                            checkout.id,
                            checkout.paymentId
                          )
                        }
                      >
                        Checar Status
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
        </Grid>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Button
            disabled={page === 0}
            onClick={() => handleChangePage(null, page - 1)}
          >
            Anterior
          </Button>
          <Typography
            sx={{
              mx: 2,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            Página {page + 1}
          </Typography>
          <Button
            disabled={page * rowsPerPage + rowsPerPage >= totalDocs}
            onClick={() => handleChangePage(null, page + 1)}
          >
            Próxima
          </Button>
        </Box>
      </Box>

      {/* Modal de Detalhes */}
      <Modal
        open={!!openDetailsModal}
        onClose={() => setOpenDetailsModal(null)}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            bgcolor: "background.paper",
            p: 4,
            borderRadius: 2,
          }}
        >
          {openDetailsModal &&
            (() => {
              const checkout = filteredCheckouts.find(
                (c) => c.id === openDetailsModal
              );
              return (
                <>
                  <Typography variant="h6" gutterBottom>
                    Detalhes do Checkout
                  </Typography>
                  <Typography>
                    <strong>Evento:</strong> {checkout.eventName}
                  </Typography>
                  <Typography>
                    <strong>Status:</strong> {checkout.status}
                  </Typography>
                  <Typography>
                    <strong>Método:</strong> {checkout.paymentMethod}
                  </Typography>
                  <Typography>
                    <strong>Valor Total:</strong> R$ {checkout.totalAmount}
                  </Typography>
                  <Typography>
                    <strong>Participantes:</strong>
                  </Typography>
                  <ul>
                    {checkout.participants.map((p, index) => (
                      <li key={index}>
                        {p.name} - {p.cpf} {p.isHalfPrice ? "(Meia)" : ""}
                        {!qrCodeData[`${checkout.id}-${index}`] ? (
                          <Button
                            onClick={() => generateQRCodes(checkout.id, index)}
                          >
                            Gerar QR Codes
                          </Button>
                        ) : (
                          <Box>
                            <Typography>31/05/2025:</Typography>
                            <QRCodeSVG
                              value={
                                qrCodeData[`${checkout.id}-${index}`][
                                  "2025-05-31"
                                ]
                              }
                              size={100}
                            />
                            <Typography>01/06/2025:</Typography>
                            <QRCodeSVG
                              value={
                                qrCodeData[`${checkout.id}-${index}`][
                                  "2025-06-01"
                                ]
                              }
                              size={100}
                            />
                          </Box>
                        )}
                      </li>
                    ))}
                  </ul>
                  <Typography>
                    <strong>Detalhes do Pedido:</strong>
                  </Typography>
                  <Typography>
                    Inteiros: {checkout.orderDetails.fullTickets} (R${" "}
                    {checkout.orderDetails.fullTicketsValue})
                  </Typography>
                  <Typography>
                    Meia: {checkout.orderDetails.halfTickets} (R${" "}
                    {checkout.orderDetails.halfTicketsValue})
                  </Typography>
                  <Typography>
                    Desconto: R$ {checkout.orderDetails.discount}
                  </Typography>
                  {checkout.paymentDetails.pix && (
                    <Typography>
                      PIX: {checkout.paymentDetails.pix.qrCodeString}
                    </Typography>
                  )}
                  {checkout.paymentDetails.boleto && (
                    <Typography>
                      Boleto:{" "}
                      <a
                        href={checkout.paymentDetails.boleto.boletoUrl}
                        target="_blank"
                      >
                        Abrir
                      </a>
                    </Typography>
                  )}
                  {checkout.paymentDetails.creditCard && (
                    <>
                      <Typography>
                        Cartão: {checkout.paymentDetails.creditCard.last4Digits}
                      </Typography>
                      <Typography>
                        Parcelas:{" "}
                        {checkout.paymentDetails.creditCard.installments}
                      </Typography>
                    </>
                  )}
                  <Button
                    variant="outlined"
                    onClick={() => setOpenDetailsModal(null)}
                    sx={{ mt: 2 }}
                  >
                    Fechar
                  </Button>
                </>
              );
            })()}
        </Box>
      </Modal>

      <AddManualPayment />
    </div>
  );
};

export default DashboardSection;
