import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Drawer,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import CheckoutCard from "../CheckoutCard";
import Filters from "../Filters";
import { useDashboard } from "../../../../data/contexts/DashboardContext";
import { MdVerified } from "react-icons/md";

const formatBrazilianCurrency = (value) => {
  if (isNaN(value)) return "R$ 0,00";
  return `R$ ${value
    .toFixed(2)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};

const formatBrazilianDate = (value, includeTime = false) => {
  if (!value) return "N/A";

  // ✅ Firestore Timestamp
  const date = value?.toDate ? value.toDate() : new Date(value);

  if (isNaN(date)) return "N/A";

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  if (includeTime) {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
  return `${day}/${month}/${year}`;
};

const calculateFee = (
  totalAmount,
  paymentMethod,
  cardBrand = "unknown",
  numParticipants = 1
) => {
  let totalFee = 0;
  cardBrand = cardBrand.toLowerCase();
  switch (paymentMethod) {
    case "pix":
      totalFee = totalAmount * 0.0099;
      break;
    case "creditCard":
    case "debitCard":
      totalFee = totalAmount * (cardBrand === "elo" ? 0.0509 : 0.0449);
      break;
    case "boleto":
      totalFee = 5.0;
      break;
    default:
      totalFee = 0;
  }
  return numParticipants > 0 ? totalFee / numParticipants : 0;
};

const calculateParticipantValue = (checkout, participantIndex) => {
  const { orderDetails, coupon, paymentMethod } = checkout;
  if (paymentMethod === "courtesy") return 0;
  const { fullTickets = 0, halfTickets = 0 } = orderDetails || {};
  const isGroupCoupon = coupon === "grupo" && fullTickets + halfTickets >= 5;
  let value = participantIndex < fullTickets ? 499 : 399;
  if (isGroupCoupon && participantIndex < fullTickets) value -= 50;
  return value;
};

// Normaliza checkouts para tolerar campos ausentes em vendas manuais
const normalizeCheckout = (checkout) => {
  const rawTs = checkout.timestamp || checkout.createdAt;
  const timestamp = rawTs?.toDate
    ? rawTs.toDate().toISOString() // Firestore Timestamp
    : rawTs
    ? new Date(rawTs).toISOString() // string ISO legado
    : new Date().toISOString(); // fallback

  return {
    ...checkout,
    participants: Array.isArray(checkout.participants)
      ? checkout.participants
      : [],
    orderDetails: checkout.orderDetails || { fullTickets: 0, halfTickets: 0 },
    timestamp,
  };
};

const ROWS_PER_PAGE = 6;

const CheckoutListCards = ({
  isMobile,
  setOpenFiltersDrawer,
  openFiltersDrawer,
}) => {
  const { filteredCheckouts: rawFilteredCheckouts, filteredMetrics } =
    useDashboard();

  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("checkoutViewMode") || "cards"
  );

  // Normaliza e ordena — sem filtrar por campos ausentes
  const allCheckouts = useMemo(() => {
    if (!rawFilteredCheckouts) return [];
    return [...rawFilteredCheckouts]
      .filter((c) => c && c.id)
      .map(normalizeCheckout)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [rawFilteredCheckouts]);

  // Reset de página ao mudar a lista
  useEffect(() => {
    setPage(0);
  }, [rawFilteredCheckouts]);

  const totalPages = Math.max(
    1,
    Math.ceil(allCheckouts.length / ROWS_PER_PAGE)
  );

  const paginatedCheckouts = useMemo(() => {
    const start = page * ROWS_PER_PAGE;
    return allCheckouts.slice(start, start + ROWS_PER_PAGE);
  }, [allCheckouts, page]);

  const handleToggleViewMode = () => {
    const newMode = viewMode === "cards" ? "table" : "cards";
    setViewMode(newMode);
    localStorage.setItem("checkoutViewMode", newMode);
  };

  const prepareTableData = (checkouts) => {
    const rows = [];
    checkouts.forEach((checkout) => {
      const norm = normalizeCheckout(checkout);
      const isCourtesy = norm.paymentMethod === "courtesy";
      const totalAmount = isCourtesy ? 0 : parseFloat(norm.totalAmount) || 0;
      const cardBrand = norm.paymentDetails?.creditCard?.brand || "unknown";
      const numParticipants = norm.participants.length || 1;
      norm.participants.forEach((participant, index) => {
        const participantValue = calculateParticipantValue(norm, index);
        const fee = isCourtesy
          ? 0
          : calculateFee(
              totalAmount,
              norm.paymentMethod,
              cardBrand,
              numParticipants
            );
        rows.push([
          participant.name || "N/A",
          participant.document || participant.cpf || "N/A",
          participant.email || "N/A",
          participant.number || "N/A",
          formatBrazilianDate(norm.timestamp, true),
          norm.paymentMethod,
          norm.seller?.name || "—",
          formatBrazilianCurrency(participantValue),
          formatBrazilianCurrency(fee),
          formatBrazilianCurrency(participantValue - fee),
        ]);
      });
    });
    return rows;
  };

  const exportToExcel = () => {
    const approved = allCheckouts.filter((c) => c.status === "approved");
    const pending = allCheckouts.filter((c) => c.status === "pending");
    const errors = allCheckouts.filter((c) => c.status === "error");

    const toObj = (row) => ({
      Nome: row[0],
      CPF: row[1],
      Email: row[2],
      Telefone: row[3],
      Data: row[4],
      Método: row[5],
      Vendedor: row[6],
      "Valor Bruto": row[7],
      Taxa: row[8],
      "Valor Líquido": row[9],
    });

    const wb = XLSX.utils.book_new();
    const wsA = XLSX.utils.json_to_sheet(prepareTableData(approved).map(toObj));
    XLSX.utils.book_append_sheet(wb, wsA, "Aprovados");
    if (pending.length) {
      const wsP = XLSX.utils.json_to_sheet(
        prepareTableData(pending).map(toObj)
      );
      XLSX.utils.book_append_sheet(wb, wsP, "Pendentes");
    }
    if (errors.length) {
      const wsE = XLSX.utils.json_to_sheet(prepareTableData(errors).map(toObj));
      XLSX.utils.book_append_sheet(wb, wsE, "Erros");
    }
    XLSX.writeFile(wb, "relatorio_participantes.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(
      `Relatório - Congresso Autismo MA (${formatBrazilianDate(new Date())})`,
      10,
      12
    );
    const approved = allCheckouts.filter((c) => c.status === "approved");
    autoTable(doc, {
      startY: 18,
      head: [
        [
          "Nome",
          "CPF",
          "Email",
          "Tel",
          "Data",
          "Método",
          "Vendedor",
          "Bruto",
          "Taxa",
          "Líquido",
        ],
      ],
      body: prepareTableData(approved),
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [22, 160, 133] },
    });
    doc.save("relatorio_participantes.pdf");
  };

  return (
    <Card sx={{
      backgroundColor: "#fff",
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <CardContent sx={{ p: "20px" }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", mb: 2, gap: 2 }}>
          <Box>
            <Typography sx={{ color: "#0f172a", fontWeight: 700, fontSize: "0.95rem" }}>
              {allCheckouts.length} Checkouts
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: isMobile ? 0.5 : 1.5, mt: 0.5 }}>
              {[
                { label: "Aprovados", count: filteredMetrics?.approvedCount || 0, color: "#16a34a" },
                { label: "Pendentes", count: filteredMetrics?.pendingCount || 0, color: "#d97706" },
                { label: "Erros", count: filteredMetrics?.errorCount || 0, color: "#dc2626" },
              ].map(({ label, count, color }, i) => (
                <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {i > 0 && !isMobile && <Typography sx={{ color: "#e2e8f0" }}>·</Typography>}
                  <Typography sx={{ fontSize: "0.78rem", color: "#64748b" }}>
                    {label}: <span style={{ color, fontWeight: 600 }}>{count}</span>
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            {isMobile && (
              <>
                <Button
                  variant="outlined"
                  onClick={() => setOpenFiltersDrawer(true)}
                  sx={{ borderColor: "#e2e8f0", color: "#475569", borderRadius: "8px", textTransform: "none", fontSize: "0.82rem" }}
                >
                  Filtros
                </Button>
                <Drawer
                  anchor="left"
                  open={openFiltersDrawer}
                  onClose={() => setOpenFiltersDrawer(false)}
                  sx={{ "& .MuiDrawer-paper": { width: "80%", maxWidth: 300 } }}
                >
                  <Filters
                    isMobile={isMobile}
                    setOpenFiltersDrawer={setOpenFiltersDrawer}
                  />
                </Drawer>
              </>
            )}
            <Button variant="outlined" onClick={exportToExcel}
              sx={{ borderColor: "#e2e8f0", color: "#475569", borderRadius: "8px", textTransform: "none", fontSize: "0.82rem" }}>
              Excel
            </Button>
            <Button variant="outlined" onClick={exportToPDF}
              sx={{ borderColor: "#e2e8f0", color: "#475569", borderRadius: "8px", textTransform: "none", fontSize: "0.82rem" }}>
              PDF
            </Button>
            <Button variant="contained" onClick={handleToggleViewMode}
              sx={{ borderRadius: "8px", textTransform: "none", fontSize: "0.82rem", backgroundColor: "#3b82f6", boxShadow: "none", "&:hover": { backgroundColor: "#2563eb", boxShadow: "none" } }}>
              {viewMode === "cards" ? "Ver Tabela" : "Ver Cards"}
            </Button>
          </Box>
        </Box>

        {/* Cards view */}
        {viewMode === "cards" ? (
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {paginatedCheckouts.length === 0 ? (
              <Typography
                sx={{
                  color: "#999",
                  py: 4,
                  width: "100%",
                  textAlign: "center",
                }}
              >
                Nenhum checkout encontrado.
              </Typography>
            ) : (
              paginatedCheckouts.map((checkout) => (
                <Box
                  sx={{ flex: "1 1 29%", minWidth: "250px" }}
                  key={checkout.id}
                >
                  <CheckoutCard checkout={checkout} isMobile={isMobile} />
                </Box>
              ))
            )}
          </Box>
        ) : (
          /* Table view */
          <TableContainer
            component={Paper}
            sx={{ maxHeight: 420, overflowX: "auto" }}
          >
            <Table stickyHeader sx={{ minWidth: isMobile ? 800 : "auto" }}>
              <TableHead>
                <TableRow>
                  {[
                    "Nome",
                    "CPF",
                    "Email",
                    "Telefone",
                    "Data e Hora",
                    "Método",
                    "Vendedor",
                    "Valor Bruto",
                    "Taxa",
                    "Líquido",
                  ].map((h) => (
                    <TableCell key={h} sx={{ backgroundColor: "#f8fafc", fontWeight: 700, fontSize: "0.78rem", color: "#475569" }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCheckouts.map((checkout) => {
                  const norm = normalizeCheckout(checkout);
                  const isCourtesy = norm.paymentMethod === "courtesy";
                  const totalAmount = isCourtesy
                    ? 0
                    : parseFloat(norm.totalAmount) || 0;
                  const cardBrand =
                    norm.paymentDetails?.creditCard?.brand || "unknown";
                  const numParticipants = norm.participants.length || 1;

                  return norm.participants.map((participant, index) => {
                    const participantValue = calculateParticipantValue(
                      norm,
                      index
                    );
                    const fee = isCourtesy
                      ? 0
                      : calculateFee(
                          totalAmount,
                          norm.paymentMethod,
                          cardBrand,
                          numParticipants
                        );
                    return (
                      <TableRow key={`${checkout.id}-${index}`} hover>
                        <TableCell>{participant.name || "N/A"}</TableCell>
                        <TableCell>{participant.document || "N/A"}</TableCell>
                        <TableCell>{participant.email || "N/A"}</TableCell>
                        <TableCell>{participant.number || "N/A"}</TableCell>
                        <TableCell>
                          {formatBrazilianDate(norm.timestamp, true)}
                        </TableCell>
                        <TableCell>{norm.paymentMethod}</TableCell>
                        <TableCell>
                          {norm.seller ? (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <MdVerified size={13} color="#1976D2" />
                              <span style={{ fontSize: "0.82rem" }}>
                                {norm.seller.name}
                              </span>
                            </Box>
                          ) : (
                            <Typography
                              sx={{ fontSize: "0.8rem", color: "#aaa" }}
                            >
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ textAlign: "right" }}>
                          {formatBrazilianCurrency(participantValue)}
                        </TableCell>
                        <TableCell sx={{ textAlign: "right" }}>
                          {formatBrazilianCurrency(fee)}
                        </TableCell>
                        <TableCell sx={{ textAlign: "right" }}>
                          {formatBrazilianCurrency(participantValue - fee)}
                        </TableCell>
                      </TableRow>
                    );
                  });
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Paginação */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mt: 3,
            gap: 1,
          }}
        >
          <Button variant="outlined" size="small" disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            sx={{ borderRadius: "8px", textTransform: "none", fontSize: "0.82rem", borderColor: "#e2e8f0", color: "#475569" }}>
            ← Anterior
          </Button>
          <Typography sx={{ mx: 1, color: "#94a3b8", fontSize: "0.82rem", minWidth: 100, textAlign: "center" }}>
            Página {page + 1} de {totalPages}
          </Typography>
          <Button variant="outlined" size="small" disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            sx={{ borderRadius: "8px", textTransform: "none", fontSize: "0.82rem", borderColor: "#e2e8f0", color: "#475569" }}>
            Próxima →
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CheckoutListCards;
