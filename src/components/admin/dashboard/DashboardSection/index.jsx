import React from "react";
import { Button, Card, Box, useMediaQuery, useTheme } from "@mui/material";
import styles from "./dashboardSection.module.css";
import Loading from "../../../shared/Loading";
import Filters from "../Filters";
import Metrics from "../Metrics";
import StatusGrafic from "../StatusGrafic";
import CheckoutListCards from "../CheckoutListCards";
import { DashboardProvider } from "../../../../data/contexts/DashboardContext";
import { useDashboard } from "../../../../data/contexts/DashboardContext";

const DashboardSection = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [openFiltersDrawer, setOpenFiltersDrawer] = React.useState(false);
  const [openManualPaymentModal, setOpenManualPaymentModal] =
    React.useState(false);

  return (
    <DashboardProvider>
      <DashboardContent
        isMobile={isMobile}
        openFiltersDrawer={openFiltersDrawer}
        setOpenFiltersDrawer={setOpenFiltersDrawer}
        openManualPaymentModal={openManualPaymentModal}
        setOpenManualPaymentModal={setOpenManualPaymentModal}
      />
    </DashboardProvider>
  );
};

const DashboardContent = ({
  isMobile,
  openFiltersDrawer,
  setOpenFiltersDrawer,
}) => {
  const { loading, metrics, chartData, updateMetrics } = useDashboard();

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

      <Metrics metrics={metrics} />
      <StatusGrafic chartData={chartData} />

      {/* {isMobile ? (
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
      )} */}

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
