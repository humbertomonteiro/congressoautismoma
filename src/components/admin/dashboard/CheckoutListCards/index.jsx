import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Drawer,
  Button,
  Paper,
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import CheckoutCard from "../CheckoutCard";
import Filters from "../Filters";
import { useDashboard } from "../../../../data/contexts/DashboardContext";

// Função para formatar data no padrão brasileiro DD/MM/YYYY (com ou sem hora)
const formatBrazilianDate = (isoString, includeTime = false) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
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

const CheckoutListCards = ({
  isMobile,
  setOpenFiltersDrawer,
  openFiltersDrawer,
}) => {
  const { filteredCheckouts: allFilteredCheckouts, filteredMetrics } =
    useDashboard();
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(6);
  const [paginatedCheckouts, setPaginatedCheckouts] = useState([]);

  // Função para exportar para CSV com data no formato brasileiro
  const exportToCSV = () => {
    const headers = [
      "ID da Transação",
      "Data do Checkout",
      "Status",
      "Método",
      "Evento",
      "Valor Total",
      "Participantes",
      "Ingressos Inteiros",
      "Ingressos Meia",
      "Desconto",
      "Cupom",
      "Data de Vencimento",
    ];
    const rows = paginatedCheckouts.map((checkout) => [
      checkout.transactionId || "N/A",
      formatBrazilianDate(checkout.timestamp, true),
      checkout.status || "N/A",
      checkout.paymentMethod || "N/A",
      checkout.eventName || "N/A",
      `R$ ${checkout.totalAmount || "0.00"}`,
      checkout.participants ? checkout.participants.length : 0,
      checkout.orderDetails?.fullTickets || 0,
      checkout.orderDetails?.halfTickets || 0,
      `R$ ${checkout.orderDetails?.discount || "0.00"}`,
      checkout.orderDetails?.coupon || "Nenhum",
      formatBrazilianDate(checkout.paymentDetails?.boleto?.dataVencimento),
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

  // Função para exportar para PDF com data no formato brasileiro
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Checkouts - Congresso Autismo MA", 10, 10);
    autoTable(doc, {
      head: [
        [
          "Status",
          "Método",
          "Valor Total",
          "Participantes",
          "Email",
          "Data do Checkout",
          "Data de Vencimento",
        ],
      ],
      body: paginatedCheckouts.map((checkout) => [
        checkout.status || "N/A",
        checkout.paymentMethod || "N/A",
        `R$ ${checkout.totalAmount || "0.00"}`,
        checkout.participants
          ? `${checkout.participants.length} (${
              checkout.participants.filter((p) => p.isHalfPrice).length
            } meia)`
          : "0",
        checkout.participants?.[0]?.email || "N/A",
        formatBrazilianDate(checkout.timestamp, true),
        formatBrazilianDate(checkout.paymentDetails?.boleto?.dataVencimento),
      ]),
    });
    doc.save("checkouts.pdf");
  };

  // Aplicar paginação localmente
  useEffect(() => {
    const validCheckouts = (allFilteredCheckouts || []).filter(
      (checkout) =>
        checkout &&
        checkout.id &&
        Array.isArray(checkout.participants) &&
        checkout.timestamp &&
        checkout.orderDetails
    );

    const sortedCheckouts = [...validCheckouts].sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const newPaginatedCheckouts = sortedCheckouts.slice(startIndex, endIndex);
    setPaginatedCheckouts(newPaginatedCheckouts);
  }, [page, allFilteredCheckouts, rowsPerPage]);

  // Função para mudar a página
  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  // Calcular número total de páginas com base nos checkouts válidos
  const validCheckoutsCount = (allFilteredCheckouts || []).filter(
    (checkout) =>
      checkout &&
      checkout.id &&
      Array.isArray(checkout.participants) &&
      checkout.timestamp &&
      checkout.orderDetails
  ).length;
  const totalPages = Math.ceil(validCheckoutsCount / rowsPerPage);

  return (
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
                sx={{ color: "#333333", fontWeight: 500 }}
              >
                {validCheckoutsCount} - Checkouts
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
                    <Filters
                      isMobile={isMobile}
                      setOpenFiltersDrawer={setOpenFiltersDrawer}
                    />
                  </Drawer>
                </>
              )}
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
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
            {/* Métricas em mini-cards */}
            <Box
              sx={{
                width: "100%",
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                mb: 2,
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 1,
                  flex: "1 1 30%",
                  border: "1px solid #c2c2c2",
                  borderLeft: "6px solid #2E7D32",
                  color: "#333333",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Aprovados
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography variant="h6">
                    {filteredMetrics?.approvedCount || 0}
                  </Typography>
                  <Typography variant="body2">
                    {filteredMetrics?.approvedValue || "R$ 0,00"}
                  </Typography>
                </Box>
              </Paper>
              <Paper
                elevation={1}
                sx={{
                  p: 1,
                  flex: "1 1 30%",
                  border: "1px solid #c2c2c2",
                  borderLeft: "6px solid #FFB300",
                  color: "#333333",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Pendentes
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography variant="h6">
                    {filteredMetrics?.pendingCount || 0}
                  </Typography>
                  <Typography variant="body2">
                    {filteredMetrics?.pendingValue || "R$ 0,00"}
                  </Typography>
                </Box>
              </Paper>
              <Paper
                elevation={1}
                sx={{
                  p: 1,
                  flex: "1 1 30%",
                  border: "1px solid #c2c2c2",
                  borderLeft: "6px solid #D32F2F",
                  color: "#333333",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Erros
                </Typography>{" "}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography variant="h6">
                    {filteredMetrics?.errorCount || 0}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            {paginatedCheckouts.map((checkout) => (
              <Box
                sx={{ flex: "1 1 29%", minWidth: "250px" }}
                key={checkout.id}
              >
                <CheckoutCard checkout={checkout} isMobile={isMobile} />
              </Box>
            ))}
          </Box>

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
              Página {page + 1} de {totalPages}
            </Typography>
            <Button
              disabled={page + 1 >= totalPages}
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
  );
};

export default CheckoutListCards;
