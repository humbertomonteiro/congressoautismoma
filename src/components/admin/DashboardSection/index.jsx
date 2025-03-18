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
  setDoc,
  getDoc,
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
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
  Drawer,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { FaWhatsapp, FaTicketAlt } from "react-icons/fa";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { TbDiscountFilled } from "react-icons/tb";
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
import Loading from "../../shared/Loading";

const DashboardSection = () => {
  const [checkouts, setCheckouts] = useState([]);
  const [filteredCheckouts, setFilteredCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const rowsPerPage = 6;
  const [totalDocs, setTotalDocs] = useState(0);
  const [lastDoc, setLastDoc] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [eventOptions, setEventOptions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [qrCodeData, setQrCodeData] = useState({});
  const [openDetailsModal, setOpenDetailsModal] = useState(null);
  const [qrError, setQrError] = useState(null);
  const [openFiltersDrawer, setOpenFiltersDrawer] = useState(false);
  const [openManualPaymentModal, setOpenManualPaymentModal] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Telas menores que 600px

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const metricsDoc = await getDoc(
          doc(db, "dashboard_metrics", "metrics")
        );
        if (metricsDoc.exists()) {
          const metricsData = metricsDoc.data();
          setMetrics({
            successTicketsFull: metricsData.successTicketsFull || 0,
            successTicketsHalf: metricsData.successTicketsHalf || 0,
            successValue: metricsData.successValue || "0.00",
            pendingCount: metricsData.pendingCount || 0,
            pendingValue: metricsData.pendingValue || "0.00",
            errorCount: metricsData.errorCount || 0,
            errorValue: metricsData.errorValue || "0.00",
            successCount: metricsData.successCount || 0,
          });
          setTotalDocs(metricsData.totalDocs || 0);
          setEventOptions(metricsData.events || []);
        } else {
          console.error("Documento metrics não encontrado!");
          setMetrics({
            successTicketsFull: 0,
            successTicketsHalf: 0,
            successValue: "0.00",
            pendingCount: 0,
            pendingValue: "0.00",
            errorCount: 0,
            errorValue: "0.00",
            successCount: 0,
          });
          setTotalDocs(0);
          setEventOptions([]);
        }
        await fetchCheckouts();
      } catch (error) {
        console.error("Erro ao buscar dados iniciais:", error);
        setMetrics({
          successTicketsFull: 0,
          successTicketsHalf: 0,
          successValue: "0.00",
          pendingCount: 0,
          pendingValue: "0.00",
          errorCount: 0,
          errorValue: "0.00",
          successCount: 0,
        });
        setTotalDocs(0);
        setEventOptions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const fetchCheckouts = async (startAfterDoc = null) => {
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

      // Preenche qrCodeData com os QR codes salvos no Firestore
      const qrData = {};
      checkoutData.forEach((checkout) => {
        checkout.participants.forEach((p, index) => {
          if (p.qrRawData) {
            qrData[`${checkout.id}-${index}`] = p.qrRawData;
          }
        });
      });
      setQrCodeData(qrData);
    } catch (error) {
      console.error("Erro ao buscar checkouts:", error);
    }
  };

  const updateMetrics = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "checkouts"));
      const checkouts = snapshot.docs.map((doc) => doc.data());

      let successTicketsFull = 0,
        successTicketsHalf = 0,
        successValue = 0,
        pendingCount = 0,
        pendingValue = 0,
        errorCount = 0,
        errorValue = 0,
        successCount = 0;

      checkouts.forEach((data) => {
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

      const updatedMetrics = {
        totalDocs: snapshot.size,
        successTicketsFull,
        successTicketsHalf,
        successValue: successValue.toFixed(2),
        pendingCount,
        pendingValue: pendingValue.toFixed(2),
        errorCount,
        errorValue: errorValue.toFixed(2),
        successCount,
        events: [...new Set(checkouts.map((c) => c.eventName))],
        lastUpdated: Timestamp.fromDate(new Date()),
      };

      await setDoc(doc(db, "dashboard_metrics", "metrics"), updatedMetrics);

      setMetrics(updatedMetrics);
      setTotalDocs(updatedMetrics.totalDocs);
      setEventOptions(updatedMetrics.events);
      await fetchCheckouts();
    } catch (error) {
      console.error("Erro ao atualizar métricas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    fetchCheckouts();
  }, [statusFilter, methodFilter, dateFilter, eventFilter]);

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

  const handleChangePage = (newPage) => {
    setPage(newPage);
    if (newPage > page && lastDoc) {
      fetchCheckouts(lastDoc);
    } else if (newPage < page) {
      const previousPageStart = page - 1;
      const offset = previousPageStart * rowsPerPage;
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
      getDocs(q).then((snapshot) => {
        const docs = snapshot.docs;
        const newLastDoc =
          docs[offset - rowsPerPage >= 0 ? offset - rowsPerPage : 0];
        fetchCheckouts(newLastDoc);
      });
    } else {
      fetchCheckouts();
    }
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

  const chartData = metrics
    ? [
        {
          name: "Aprovados",
          value: metrics.successCount || 0,
          fill: "#2E7D32",
        },
        {
          name: "Pendentes",
          value: metrics.pendingCount || 0,
          fill: "#FFB300",
        },
        { name: "Erros", value: metrics.errorCount || 0, fill: "#D32F2F" },
      ]
    : [];

  const renderModalContent = () => {
    const checkout = filteredCheckouts.find((c) => c.id === openDetailsModal);
    if (!checkout) return null;

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
          Inteiros: {checkout.orderDetails.fullTickets} (R${" "}
          {checkout.orderDetails.fullTicketsValue})
        </Typography>
        <Typography sx={{ color: "#666666" }}>
          Meia: {checkout.orderDetails.halfTickets} (R${" "}
          {checkout.orderDetails.halfTicketsValue})
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

  if (loading || !metrics) return <Loading />;

  const FiltersContent = () => (
    <Box sx={{ p: "20px" }}>
      <Typography
        variant="h6"
        sx={{ color: "#333333", fontWeight: 500, mb: 2, borderRadius: "12px" }}
      >
        Filtros
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: "#666666" }}>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
              sx={{ borderRadius: "8px", backgroundColor: "#FAFAFA" }}
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
            <InputLabel sx={{ color: "#666666" }}>Método</InputLabel>
            <Select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              label="Método"
              sx={{ borderRadius: "8px", backgroundColor: "#FAFAFA" }}
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
            <InputLabel sx={{ color: "#666666" }}>Evento</InputLabel>
            <Select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              label="Evento"
              sx={{ borderRadius: "8px", backgroundColor: "#FAFAFA" }}
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
            sx={{ borderRadius: "8px", backgroundColor: "#FAFAFA" }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Buscar por ID ou Email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ borderRadius: "8px", backgroundColor: "#FAFAFA" }}
          />
        </Grid>
      </Grid>
      {isMobile && (
        <Button
          variant="outlined"
          onClick={() => setOpenFiltersDrawer(false)}
          sx={{
            mt: 2,
            borderColor: "#1976D2",
            color: "#1976D2",
            borderRadius: "8px",
            textTransform: "none",
            "&:hover": { borderColor: "#1565C0", color: "#1565C0" },
          }}
        >
          Fechar
        </Button>
      )}
    </Box>
  );

  return (
    <div
      className={styles.container}
      style={{
        backgroundColor: "#F5F7FA",
        padding: "20px",
        borderRadius: "12px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          mb: 3,
          gap: 2,
        }}
      >
        <h1>Dashboard</h1>
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#1976D2",
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 500,
            "&:hover": { backgroundColor: "#1565C0" },
          }}
          onClick={updateMetrics}
        >
          Atualizar Métricas
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          >
            <CardContent sx={{ py: 3, px: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-around",
                  gap: 2,
                }}
              >
                <FaTicketAlt size={40} color="#1976D2" />
                <Box sx={{ textAlign: "left" }}>
                  <Typography
                    variant="h6"
                    sx={{ color: "#666666", fontWeight: 400, fontSize: "1rem" }}
                  >
                    Ingressos Inteiros
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: "#666666",
                      fontWeight: 600,
                      fontSize: "1.5rem",
                      textAlign: "center",
                    }}
                  >
                    {metrics.successTicketsFull}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          >
            <CardContent sx={{ py: 3, px: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-around",
                  gap: 2,
                }}
              >
                <TbDiscountFilled size={40} color="#1976D2" />
                <Box sx={{ textAlign: "left" }}>
                  <Typography
                    variant="h6"
                    sx={{ color: "#666666", fontWeight: 400, fontSize: "1rem" }}
                  >
                    Ingressos Meia
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: "#666666",
                      fontWeight: 600,
                      fontSize: "1.5rem",
                      textAlign: "center",
                    }}
                  >
                    {metrics.successTicketsHalf}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          >
            <CardContent sx={{ py: 3, px: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-around",
                  gap: 2,
                }}
              >
                <RiMoneyDollarCircleFill size={40} color="#1976D2" />
                <Box sx={{ textAlign: "left" }}>
                  <Typography
                    variant="h6"
                    sx={{ color: "#666666", fontWeight: 400, fontSize: "1rem" }}
                  >
                    Valor Total Vendido
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: "#666666",
                      fontWeight: 600,
                      textAlign: "center",
                      fontSize: "1.5rem",
                    }}
                  >
                    R$ {metrics.successValue}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card
            sx={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              p: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: "#333333", fontWeight: 500, mb: 2 }}
            >
              Status dos Checkouts
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#666666" />
                <YAxis stroke="#666666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Button Adicinoar manual */}
      {isMobile ? (
        <>
          <Button
            variant="contained"
            onClick={() => setOpenManualPaymentModal(true)}
            sx={{
              mb: 4,
              backgroundColor: "#1976D2",
              borderRadius: "8px",
              textTransform: "none",
              width: "100%",
              "&:hover": { backgroundColor: "#1565C0" },
            }}
          >
            Adicionar Checkout Manual
          </Button>
          <Modal
            open={openManualPaymentModal}
            onClose={() => setOpenManualPaymentModal(false)}
          >
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "90%",
                height: "90vh",
                overflowY: "scroll",
                maxWidth: 400,
                bgcolor: "#FFFFFF",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                p: 2,
              }}
            >
              <AddManualPayment />
              <Button
                variant="outlined"
                onClick={() => setOpenManualPaymentModal(false)}
                sx={{
                  mt: 2,
                  borderColor: "#1976D2",
                  color: "#1976D2",
                  borderRadius: "8px",
                  textTransform: "none",
                  width: "100%",
                  "&:hover": { borderColor: "#1565C0", color: "#1565C0" },
                }}
              >
                Fechar
              </Button>
            </Box>
          </Modal>
        </>
      ) : (
        <AddManualPayment />
      )}

      {/* Filtros desktop */}
      {!isMobile && (
        <Card
          sx={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            mb: 4,
          }}
        >
          <FiltersContent />
        </Card>
      )}

      {/* Checkouts */}
      <Card
        sx={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        <CardContent sx={{ p: "20px" }}>
          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                mb: 2,
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "#333333",
                    fontWeight: 500,
                    borderRadius: "12px",
                  }}
                >
                  Checkouts
                </Typography>
                {isMobile && (
                  <>
                    <Button
                      variant="outlined"
                      onClick={() => setOpenFiltersDrawer(true)}
                      sx={{
                        borderColor: "#1976D2",
                        color: "#1976D2",
                        borderRadius: "8px",
                        textTransform: "none",
                      }}
                    >
                      Filtros
                    </Button>
                    <Drawer
                      anchor="left"
                      open={openFiltersDrawer}
                      onClose={() => setOpenFiltersDrawer(false)}
                      sx={{
                        "& .MuiDrawer-paper": {
                          width: "80%",
                          maxWidth: 300,
                          backgroundColor: "#FFFFFF",
                        },
                      }}
                    >
                      <FiltersContent />
                    </Drawer>
                  </>
                )}
              </Box>
              <Box sx={{ ml: "auto" }}>
                <Button
                  variant="outlined"
                  onClick={exportToCSV}
                  sx={{
                    mr: 1,
                    borderColor: "#1976D2",
                    color: "#1976D2",
                    borderRadius: "8px",
                    textTransform: "none",
                    "&:hover": { borderColor: "#1565C0", color: "#1565C0" },
                  }}
                >
                  Exportar CSV
                </Button>
                <Button
                  variant="outlined"
                  onClick={exportToPDF}
                  sx={{
                    borderColor: "#1976D2",
                    color: "#1976D2",
                    borderRadius: "8px",
                    textTransform: "none",
                    "&:hover": { borderColor: "#1565C0", color: "#1565C0" },
                  }}
                >
                  Exportar PDF
                </Button>
              </Box>
            </Box>
            <Grid container spacing={3}>
              {filteredCheckouts
                .filter(
                  (checkout) =>
                    checkout.transactionId
                      ?.toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    checkout.participants.some((p) =>
                      p.email.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                )
                .map((checkout) => (
                  <Grid item key={checkout.id}>
                    <Card
                      sx={{
                        border: "1px solid #c2c2c2",
                        ...getStatusColor(checkout.status),
                        backgroundColor: "#FFFFFF",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                        padding: 2,
                      }}
                    >
                      <CardContent sx={{ padding: 0 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            color: "#333333",
                            fontWeight: 500,
                            mb: ".5rem",
                          }}
                        >
                          {checkout.eventName}
                        </Typography>
                        <Typography
                          sx={{ color: "#666666", fontSize: "0.9rem" }}
                        >
                          <strong>Status:</strong>{" "}
                          {checkout.status.charAt(0).toUpperCase() +
                            checkout.status.slice(1)}
                        </Typography>
                        <Typography
                          sx={{ color: "#666666", fontSize: "0.9rem" }}
                        >
                          <strong>Método:</strong> {checkout.paymentMethod}
                        </Typography>
                      </CardContent>
                      <CardActions
                        sx={{
                          justifyContent: "space-between",
                          gap: 1,
                          padding: 0,
                        }}
                      >
                        <Box>
                          <Button
                            color="primary"
                            size="small"
                            sx={{
                              textTransform: "none",
                            }}
                            onClick={() => setOpenDetailsModal(checkout.id)}
                          >
                            Detalhes
                          </Button>
                          {checkout.paymentId &&
                            checkout.status === "pending" && (
                              <Button
                                size="small"
                                sx={{
                                  color: "#FFB300",
                                  textTransform: "none",
                                  "&:hover": { color: "#F57C00" },
                                }}
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
                        </Box>

                        {checkout.participants[0]?.number && (
                          <IconButton
                            onClick={() =>
                              handleContactParticipant(
                                checkout.participants[0].number,
                                checkout.paymentMethod
                              )
                            }
                            sx={{
                              color: "#25D366",
                              "&:hover": { color: "#1EBE56" },
                            }}
                          >
                            <FaWhatsapp />
                          </IconButton>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
            </Grid>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Button
                disabled={page === 0}
                onClick={() => handleChangePage(page - 1)}
                sx={{
                  color: "#1976D2",
                  "&:hover": { color: "#1565C0" },
                  "&:disabled": { color: "#B0BEC5" },
                }}
              >
                Anterior
              </Button>
              <Typography
                sx={{
                  mx: 2,
                  color: "#333333",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Página {page + 1} de {Math.ceil(totalDocs / rowsPerPage)}
              </Typography>
              <Button
                disabled={page * rowsPerPage + rowsPerPage >= totalDocs}
                onClick={() => handleChangePage(page + 1)}
                sx={{
                  color: "#1976D2",
                  "&:hover": { color: "#1565C0" },
                  "&:disabled": { color: "#B0BEC5" },
                }}
              >
                Próxima
              </Button>
            </Box>
          </Box>
        </CardContent>
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
          {openDetailsModal && renderModalContent()}
        </Box>
      </Modal>
    </div>
  );
};

export default DashboardSection;
