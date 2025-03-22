import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Drawer,
  Button,
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import CheckoutCard from "../CheckoutCard";
import Filters from "../Filters";
import { useDashboard } from "../../../../data/contexts/DashboardContext";

const CheckoutListCards = ({
  isMobile,
  setOpenFiltersDrawer,
  openFiltersDrawer,
}) => {
  const { filteredCheckouts, page, rowsPerPage, totalDocs, handleChangePage } =
    useDashboard();

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
                sx={{
                  color: "#333333",
                  fontWeight: 500,
                  borderRadius: "12px",
                }}
              >
                Checkouts ({totalDocs})
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
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            {filteredCheckouts.map((checkout) => (
              <Box
                sx={{ flex: "1 1 30%", minWidth: "300px" }}
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
  );
};

export default CheckoutListCards;
