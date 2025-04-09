import React from "react";
import { useEffect } from "react";
import {
  Button,
  Card,
  Box,
  useMediaQuery,
  useTheme,
  Typography,
} from "@mui/material";
import styles from "./dashboardSection.module.css";
import Loading from "../../../shared/Loading";
import Filters from "../Filters";
import Metrics from "../Metrics";
import StatusGrafic from "../StatusGrafic";
import CheckoutListCards from "../CheckoutListCards";
import { useDashboard } from "../../../../data/contexts/DashboardContext";
import SalesByDayChart from "../SalesByDayChart";

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

  if (loading || !metrics) return <Loading />;

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
        <SalesByDayChart
          checkouts={checkouts}
          formatToBrazilianCurrency={formatToBrazilianCurrency}
        />

        <Box
          sx={{
            width: "100%",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            alignItems: "center",
            p: 2,
            mt: isMobile ? 2 : 0,
          }}
        >
          <StatusGrafic chartData={chartData} />
          <Card sx={{ width: "100%", boxShadow: "none" }}>
            <Typography variant="subtitle">Gráfico de Status</Typography>:
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography sx={{ color: "#c2c2c2", fontSize: ".8rem" }}>
                  Aprovados:{" "}
                </Typography>
                <Box
                  sx={{
                    width: "15px",
                    height: "15px",
                    borderRadius: "50%",
                    backgroundColor: "#2E7D32",
                  }}
                ></Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography sx={{ color: "#c2c2c2", fontSize: ".8rem" }}>
                  Pendentes:{" "}
                </Typography>
                <Box
                  sx={{
                    width: "15px",
                    height: "15px",
                    borderRadius: "50%",
                    backgroundColor: "#FFB300",
                  }}
                ></Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography sx={{ color: "#c2c2c2", fontSize: ".8rem" }}>
                  Erros:{" "}
                </Typography>
                <Box
                  sx={{
                    width: "15px",
                    height: "15px",
                    borderRadius: "50%",
                    backgroundColor: "#D32F2F",
                  }}
                ></Box>
              </Box>
            </Box>
          </Card>
        </Box>
      </Box>

      {!isMobile && (
        <Card
          sx={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            mb: 4,
          }}
        >
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
    </div>
  );
};

export default DashboardSection;
