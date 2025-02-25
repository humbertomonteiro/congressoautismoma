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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  IconButton,
} from "@mui/material";
import { FaWhatsapp } from "react-icons/fa6";
import styles from "./adminDashboard.module.css";

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

  useEffect(() => {
    const fetchEventOptionsAndMetrics = async () => {
      const snapshot = await getDocs(collection(db, "checkouts"));
      const events = [
        ...new Set(snapshot.docs.map((doc) => doc.data().eventName)),
      ];
      setEventOptions(events);

      let successTicketsFull = 0;
      let successTicketsHalf = 0;
      let successValue = 0;
      let pendingCount = 0;
      let pendingValue = 0;
      let errorCount = 0;
      let errorValue = 0;
      let successCount = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.status === "success") {
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

      if (statusFilter) q = query(q, where("status", "==", statusFilter));
      if (methodFilter)
        q = query(q, where("paymentMethod", "==", methodFilter));
      if (dateFilter) {
        const localDate = new Date(dateFilter);
        const startOfDay = new Date(localDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(localDate);
        endOfDay.setHours(23, 59, 59, 999);

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

      const totalQuery = query(
        collection(db, "checkouts"),
        ...(statusFilter ? [where("status", "==", statusFilter)] : []),
        ...(methodFilter ? [where("paymentMethod", "==", methodFilter)] : []),
        ...(dateFilter
          ? [
              where("timestamp", ">=", utcStart.toISOString()),
              where("timestamp", "<=", utcEnd.toISOString()),
            ]
          : []),
        ...(eventFilter ? [where("eventName", "==", eventFilter)] : [])
      );
      const totalSnapshot = await getDocs(totalQuery);
      setTotalDocs(totalSnapshot.size);

      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar checkouts:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckouts();
  }, [rowsPerPage, statusFilter, methodFilter, dateFilter, eventFilter]);

  const handleCheckPaymentStatus = async (checkoutId, paymentId) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/payments/check-payment-status",
        { paymentId }
      );
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
    if (newPage > page) {
      fetchCheckouts(lastDoc);
    } else {
      fetchCheckouts();
      setPage(0);
    }
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

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <ul className={styles.metrics}>
        <li>
          <strong>Total de Checkouts:</strong> {totalDocs}
        </li>
        <li>
          <strong>Ingressos Inteiros Vendidos:</strong>{" "}
          {metrics.successTicketsFull}
        </li>
        <li>
          <strong>Ingressos Meia Vendidos:</strong> {metrics.successTicketsHalf}
        </li>
        <li>
          <strong>Valor Total Vendido:</strong> R$ {metrics.successValue}
        </li>
        <li>
          <strong>Pagamentos Aprovados:</strong> {metrics.successCount} (R${" "}
          {metrics.successValue})
        </li>
        <li>
          <strong>Pagamentos Pendentes:</strong> {metrics.pendingCount} (R${" "}
          {metrics.pendingValue})
        </li>
        <li>
          <strong>Pagamentos com Erro:</strong> {metrics.errorCount} (R${" "}
          {metrics.errorValue})
        </li>
      </ul>
      <Box
        className={styles.boxFilters}
        sx={{ display: "flex", gap: 2, mb: 2 }}
      >
        <FormControl className={styles.filter} sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="success">Aprovado</MenuItem>
            <MenuItem value="pending">Pendente</MenuItem>
            <MenuItem value="error">Erro</MenuItem>
          </Select>
        </FormControl>
        <FormControl className={styles.filter} sx={{ minWidth: 120 }}>
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
        <FormControl className={styles.filter} sx={{ minWidth: 120 }}>
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
        <TextField
          className={styles.filter}
          type="date"
          label="Data"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
      <Button
        variant="contained"
        color="primary"
        onClick={exportToCSV}
        sx={{ mb: 2 }}
      >
        Exportar para CSV
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID da Transação</TableCell>
              <TableCell>Data/Hora</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Método</TableCell>
              <TableCell>Evento</TableCell>
              <TableCell>Valor Total</TableCell>
              <TableCell>Participantes</TableCell>
              <TableCell>Detalhes</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCheckouts.map((checkout) => (
              <TableRow key={checkout.id}>
                <TableCell>{checkout.transactionId}</TableCell>
                <TableCell>
                  {new Date(checkout.timestamp).toLocaleString()}
                </TableCell>
                <TableCell className={styles[checkout.status]}>
                  {checkout.status}
                </TableCell>
                <TableCell>{checkout.paymentMethod}</TableCell>
                <TableCell>{checkout.eventName}</TableCell>
                <TableCell>R$ {checkout.totalAmount}</TableCell>
                <TableCell>
                  {checkout.participants.length} (
                  {checkout.participants.filter((p) => p.isHalfPrice).length}{" "}
                  meia)
                </TableCell>
                <TableCell>
                  <details>
                    <summary>Ver mais</summary>
                    <p>
                      <strong>Participantes:</strong>
                    </p>
                    <ul>
                      {checkout.participants.map((p, index) => (
                        <li key={index}>
                          {p.name} - {p.cpf} {p.isHalfPrice ? "(Meia)" : ""}
                        </li>
                      ))}
                    </ul>
                    <p>
                      <strong>Detalhes do Pedido:</strong>
                    </p>
                    <p>
                      Inteiros: {checkout.orderDetails.fullTickets} (R${" "}
                      {checkout.orderDetails.fullTicketsValue})
                    </p>
                    <p>
                      Meia: {checkout.orderDetails.halfTickets} (R${" "}
                      {checkout.orderDetails.halfTicketsValue})
                    </p>
                    <p>Desconto: R$ {checkout.orderDetails.discount}</p>
                    {checkout.paymentDetails.pix && (
                      <>
                        <p>
                          <strong>PIX:</strong>
                        </p>
                        <p>
                          Código: {checkout.paymentDetails.pix.qrCodeString}
                        </p>
                      </>
                    )}
                    {checkout.paymentDetails.boleto && (
                      <>
                        <p>
                          <strong>Boleto:</strong>
                        </p>
                        <p>
                          URL:{" "}
                          <a
                            href={checkout.paymentDetails.boleto.boletoUrl}
                            target="_blank"
                          >
                            Abrir
                          </a>
                        </p>
                      </>
                    )}
                    {checkout.paymentDetails.creditCard && (
                      <>
                        <p>
                          <strong>Cartão:</strong>
                        </p>
                        <p>
                          Últimos 4:{" "}
                          {checkout.paymentDetails.creditCard.last4Digits}
                        </p>
                        <p>
                          Parcelas:{" "}
                          {checkout.paymentDetails.creditCard.installments}
                        </p>
                      </>
                    )}
                    {checkout.metadata.errorLog && (
                      <p>
                        <strong>Erro:</strong> {checkout.metadata.errorLog}
                      </p>
                    )}
                  </details>
                </TableCell>
                <TableCell>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    {checkout.paymentId && checkout.status === "pending" && (
                      <Button
                        variant="outlined"
                        size="small"
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
                    {checkout.participants[0]?.number && (
                      <IconButton
                        color="inherit"
                        size="small"
                        onClick={() =>
                          handleContactParticipant(
                            checkout.participants[0].number,
                            checkout.paymentMethod
                          )
                        }
                        title={`Contactar ${checkout.participants[0].name} via WhatsApp`}
                      >
                        <FaWhatsapp />
                      </IconButton>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalDocs}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </div>
  );
};

export default DashboardSection;
