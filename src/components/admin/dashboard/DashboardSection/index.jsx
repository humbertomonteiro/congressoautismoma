import React from "react";
// import { useEffect } from "react";
import {
  Button,
  Card,
  Box,
  useMediaQuery,
  useTheme,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import useTicketSnapshots from "../../../../data/hooks/useTicketSnapshots";
import styles from "./dashboardSection.module.css";
// import Loading from "../../../shared/Loading";
import Filters from "../Filters";
import Metrics from "../Metrics";
import StatusGrafic from "../StatusGrafic";
import CheckoutListCards from "../CheckoutListCards";
import { useDashboard } from "../../../../data/contexts/DashboardContext";
import SalesByDayChart from "../SalesByDayChart";
// import CertificateContainer from "../../../certificateGenerator/CertificateContainer";
import CertificateGenerator from "../../../certificateGenerator/CertificateGenerator";

const DashboardSection = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [openFiltersDrawer, setOpenFiltersDrawer] = React.useState(false);
  const [openManualPaymentModal, setOpenManualPaymentModal] =
    React.useState(false);

  // Usar o contexto diretamente
  const {
    loading,
    metrics,
    chartData,
    updateMetrics,
    formatToBrazilianCurrency,
    checkouts,
  } = useDashboard();

  const { snapshots } = useTicketSnapshots();

  // if (loading || !metrics) return <Loading />;

  return (
    <div className={styles.container}>
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
            backgroundColor: "#3b82f6",
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 500,
            boxShadow: "none",
            "&:hover": { backgroundColor: "#2563eb", boxShadow: "none" },
          }}
          onClick={updateMetrics}
        >
          Atualizar Métricas
        </Button>
      </Box>

      <Metrics
        metrics={metrics}
        formatToBrazilianCurrency={formatToBrazilianCurrency}
      />

      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: isMobile ? 0 : 2,
          flexDirection: isMobile ? "column" : "row",
          mb: 4,
        }}
      >
        <SalesByDayChart checkouts={checkouts} />

        <Box sx={{
          width: "100%",
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          mt: isMobile ? 2 : 0,
        }}>
          <StatusGrafic chartData={chartData} />
          <Box sx={{ width: "100%", display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
            {[
              { label: "Aprovados", color: "#16a34a" },
              { label: "Pendentes", color: "#d97706" },
              { label: "Erros", color: "#dc2626" },
            ].map(({ label, color }) => (
              <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
                <Typography sx={{ color: "#94a3b8", fontSize: "0.78rem" }}>{label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {!isMobile && (
        <Card sx={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          mb: 3,
        }}>
          <Filters
            isMobile={isMobile}
            setOpenFiltersDrawer={setOpenFiltersDrawer}
          />
        </Card>
      )}

      <CheckoutListCards
        isMobile={isMobile}
        setOpenFiltersDrawer={setOpenFiltersDrawer}
        openFiltersDrawer={openFiltersDrawer}
      />

      <CertificateGenerator />

      {snapshots.length > 0 && (
        <Card sx={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          mt: 4,
          p: 3,
        }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "#1e293b" }}>
            Histórico de Ingressos Aprovados
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: "#64748b" }}>
            Registro diário automático — salvo sempre que as métricas são atualizadas. Apenas checkouts com status <strong>aprovado</strong> são contabilizados.
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 600, color: "#475569", fontSize: "0.8rem" } }}>
                  <TableCell>Data</TableCell>
                  <TableCell align="center">Inteiros</TableCell>
                  <TableCell align="center">Meias</TableCell>
                  <TableCell align="center">Sociais</TableCell>
                  <TableCell align="center">Total aprovados</TableCell>
                  <TableCell>Registrado às</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {snapshots.map((s) => {
                  const savedAt = s.savedAt?.toDate?.();
                  const hora = savedAt
                    ? savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                    : "—";
                  const [ano, mes, dia] = s.date.split("-");
                  const dataFormatada = `${dia}/${mes}/${ano}`;
                  return (
                    <TableRow key={s.id} sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 500 }}>{dataFormatada}</TableCell>
                      <TableCell align="center">{s.approved?.full ?? 0}</TableCell>
                      <TableCell align="center">{s.approved?.half ?? 0}</TableCell>
                      <TableCell align="center">{s.approved?.social ?? 0}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: "#16a34a" }}>
                        {s.approved?.total ?? 0}
                      </TableCell>
                      <TableCell sx={{ color: "#94a3b8", fontSize: "0.8rem" }}>{hora}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </Card>
      )}
    </div>
  );
};

export default DashboardSection;
