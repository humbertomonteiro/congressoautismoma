import {
  Box,
  Card,
  CardContent,
  Typography,
  Modal,
  IconButton,
  Button,
} from "@mui/material";
import { IoTicketOutline } from "react-icons/io5";
import {
  RiMoneyDollarCircleLine,
  RiMoneyDollarCircleFill,
} from "react-icons/ri";
import { HiDotsVertical } from "react-icons/hi";
import { useState } from "react";

const MetricsDetailsModal = ({
  open,
  onClose,
  title,
  metrics,
  formatToBrazilianCurrency,
  type,
}) => {
  // Garantir que safeMetrics tenha todos os campos esperados com valores padrão
  const safeMetrics = {
    successTicketsFull: metrics?.successTicketsFull || 0,
    successTicketsHalf: metrics?.successTicketsHalf || 0,
    successValueGross: metrics?.successValueGross || 0,
    successValueNet: metrics?.successValueNet || 0,
    totalGrossMasterVisa: metrics?.totalGrossMasterVisa || 0,
    totalFeeMasterVisa: metrics?.totalFeeMasterVisa || 0,
    totalGrossPix: metrics?.totalGrossPix || 0,
    totalFeePix: metrics?.totalFeePix || 0,
    totalGrossBoleto: metrics?.totalGrossBoleto || 0,
    totalFeeBoleto: metrics?.totalFeeBoleto || 0,
    totalGrossElo: metrics?.totalGrossElo || 0,
    totalFeeElo: metrics?.totalFeeElo || 0,
    totalGrossOthers: metrics?.totalGrossOthers || 0,
    totalTicketsMasterVisa: metrics?.totalTicketsMasterVisa || 0,
    totalTicketsPix: metrics?.totalTicketsPix || 0,
    totalTicketsBoleto: metrics?.totalTicketsBoleto || 0,
    totalTicketsElo: metrics?.totalTicketsElo || 0,
    totalTicketsOthers: metrics?.totalTicketsOthers || 0,
  };

  const renderContent = () => {
    switch (type) {
      case "tickets":
        return (
          <>
            <Typography variant="h6" sx={{ color: "#1976D2", mb: 2 }}>
              Ingressos por Método de Pagamento
            </Typography>
            <Typography sx={{ color: "#666666" }}>
              <strong>PIX:</strong> {safeMetrics.totalTicketsPix}
            </Typography>
            <Typography sx={{ color: "#666666" }}>
              <strong>Boleto:</strong> {safeMetrics.totalTicketsBoleto}
            </Typography>
            <Typography sx={{ color: "#666666" }}>
              <strong>Visa/MasterCard:</strong>{" "}
              {safeMetrics.totalTicketsMasterVisa}
            </Typography>
            <Typography sx={{ color: "#666666" }}>
              <strong>Elo:</strong> {safeMetrics.totalTicketsElo}
            </Typography>
            <Typography sx={{ color: "#666666" }}>
              <strong>Outros:</strong> {safeMetrics.totalTicketsOthers}
            </Typography>
            <Typography sx={{ color: "#333333", fontWeight: 500, mt: 2 }}>
              <strong>Total:</strong>{" "}
              {safeMetrics.successTicketsFull + safeMetrics.successTicketsHalf}
            </Typography>
          </>
        );
      case "gross":
        return (
          <>
            <Typography variant="h6" sx={{ color: "#1976D2", mb: 2 }}>
              Taxas por Método de Pagamento
            </Typography>
            <Typography sx={{ color: "#666666" }}>
              <strong>PIX:</strong>{" "}
              {formatToBrazilianCurrency(safeMetrics.totalFeePix)}
            </Typography>
            <Typography sx={{ color: "#666666" }}>
              <strong>Boleto:</strong>{" "}
              {formatToBrazilianCurrency(safeMetrics.totalFeeBoleto)}
            </Typography>
            <Typography sx={{ color: "#666666" }}>
              <strong>Visa/MasterCard:</strong>{" "}
              {formatToBrazilianCurrency(safeMetrics.totalFeeMasterVisa)}
            </Typography>
            <Typography sx={{ color: "#666666" }}>
              <strong>Elo:</strong>{" "}
              {formatToBrazilianCurrency(safeMetrics.totalFeeElo)}
            </Typography>
            <Typography sx={{ color: "#666666" }}>
              <strong>Outros:</strong>{" "}
              {formatToBrazilianCurrency(
                safeMetrics.successValueGross -
                  safeMetrics.successValueNet -
                  (safeMetrics.totalFeePix +
                    safeMetrics.totalFeeBoleto +
                    safeMetrics.totalFeeMasterVisa +
                    safeMetrics.totalFeeElo)
              )}
            </Typography>
            <Typography sx={{ color: "#333333", fontWeight: 500, mt: 2 }}>
              <strong>Total de Taxas:</strong>{" "}
              {formatToBrazilianCurrency(
                safeMetrics.successValueGross - safeMetrics.successValueNet
              )}
            </Typography>
          </>
        );
      case "net":
        return (
          <>
            <Typography variant="h6" sx={{ color: "#1976D2", mb: 2 }}>
              Valor Líquido por Método de Pagamento
            </Typography>
            <Typography sx={{ color: "#666666" }}>
              <strong>PIX:</strong>{" "}
              {formatToBrazilianCurrency(
                safeMetrics.totalGrossPix - safeMetrics.totalFeePix
              )}
            </Typography>
            <Typography sx={{ color: "#666666" }}>
              <strong>Boleto:</strong>{" "}
              {formatToBrazilianCurrency(
                safeMetrics.totalGrossBoleto - safeMetrics.totalFeeBoleto
              )}
            </Typography>
            <Typography sx={{ color: "#666666" }}>
              <strong>Visa/MasterCard:</strong>{" "}
              {formatToBrazilianCurrency(
                safeMetrics.totalGrossMasterVisa -
                  safeMetrics.totalFeeMasterVisa
              )}
            </Typography>
            <Typography sx={{ color: "#666666" }}>
              <strong>Elo:</strong>{" "}
              {formatToBrazilianCurrency(
                safeMetrics.totalGrossElo - safeMetrics.totalFeeElo
              )}
            </Typography>
            <Typography sx={{ color: "#666666" }}>
              <strong>Outros:</strong>{" "}
              {formatToBrazilianCurrency(
                safeMetrics.totalGrossOthers -
                  (safeMetrics.successValueGross -
                    safeMetrics.successValueNet -
                    (safeMetrics.totalFeePix +
                      safeMetrics.totalFeeBoleto +
                      safeMetrics.totalFeeMasterVisa +
                      safeMetrics.totalFeeElo))
              )}
            </Typography>
            <Typography sx={{ color: "#333333", fontWeight: 500, mt: 2 }}>
              <strong>Total Líquido:</strong>{" "}
              {formatToBrazilianCurrency(safeMetrics.successValueNet)}
            </Typography>
          </>
        );
      default:
        return (
          <Typography sx={{ color: "#666666" }}>
            Nenhuma informação disponível para este tipo.
          </Typography>
        );
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          maxWidth: "90%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          p: 4,
        }}
      >
        <Typography
          variant="h5"
          sx={{ color: "#333333", fontWeight: 600, mb: 3 }}
        >
          {title || "Detalhes"}
        </Typography>
        {renderContent()}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button
            variant="outlined"
            onClick={onClose}
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
      </Box>
    </Modal>
  );
};

const Metrics = ({ metrics, formatToBrazilianCurrency }) => {
  const [openModal, setOpenModal] = useState(null);

  const safeMetrics = metrics || {
    successTicketsFull: 0,
    successTicketsHalf: 0,
    successValueGross: 0,
    successValueNet: 0,
    totalGrossMasterVisa: 0,
    totalFeeMasterVisa: 0,
    totalGrossPix: 0,
    totalFeePix: 0,
    totalGrossBoleto: 0,
    totalFeeBoleto: 0,
    totalGrossElo: 0,
    totalFeeElo: 0,
    totalGrossOthers: 0,
    totalTicketsMasterVisa: 0,
    totalTicketsPix: 0,
    totalTicketsBoleto: 0,
    totalTicketsElo: 0,
    totalTicketsOthers: 0,
  };

  return (
    <Box
      sx={{
        maxWidth: "100%",
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 2,
        marginBottom: "24px",
      }}
    >
      {/* Card: Total de Ingressos */}
      <Card
        sx={{
          flex: "1 1 30%",
          minWidth: "250px",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          position: "relative",
        }}
      >
        <CardContent sx={{ py: 3, px: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
            }}
          >
            <IoTicketOutline size={40} color="#1976D2" />
            <Box sx={{ textAlign: "left", ml: 2 }}>
              <Typography
                variant="h6"
                sx={{ color: "#666666", fontWeight: 400, fontSize: ".9rem" }}
              >
                Total de Ingressos
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
                {safeMetrics.successTicketsFull +
                  safeMetrics.successTicketsHalf}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#999999", fontSize: "0.8rem", mt: 1 }}
              >
                Inteiros: {safeMetrics.successTicketsFull} | Meias:{" "}
                {safeMetrics.successTicketsHalf}
              </Typography>
            </Box>
            <IconButton
              sx={{ position: "relative", bottom: "30px" }}
              onClick={() => setOpenModal("tickets")}
            >
              <HiDotsVertical size={20} color="#666666" />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Card: Valor Bruto */}
      <Card
        sx={{
          flex: "1 1 30%",
          minWidth: "250px",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          position: "relative",
        }}
      >
        <CardContent sx={{ py: 3, px: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
            }}
          >
            <RiMoneyDollarCircleLine size={40} color="#FFB300" />
            <Box sx={{ textAlign: "center", ml: 2 }}>
              <Typography
                variant="h6"
                sx={{ color: "#666666", fontWeight: 400, fontSize: ".9rem" }}
              >
                Valor Bruto
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
                {formatToBrazilianCurrency(safeMetrics.successValueGross)}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#999999", fontSize: "0.8rem", mt: 1 }}
              >
                Taxas:{" "}
                {formatToBrazilianCurrency(
                  safeMetrics.successValueGross - safeMetrics.successValueNet
                )}
              </Typography>
            </Box>
            <IconButton
              sx={{ position: "relative", bottom: "30px" }}
              onClick={() => setOpenModal("gross")}
            >
              <HiDotsVertical size={20} color="#666666" />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Card: Valor Líquido */}
      <Card
        sx={{
          flex: "1 1 30%",
          minWidth: "250px",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          position: "relative",
        }}
      >
        <CardContent sx={{ py: 3, px: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
            }}
          >
            <RiMoneyDollarCircleFill size={40} color="#2E7D32" />
            <Box sx={{ textAlign: "center", ml: 2 }}>
              <Typography
                variant="h6"
                sx={{ color: "#666666", fontWeight: 400, fontSize: ".9rem" }}
              >
                Valor Líquido
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
                {formatToBrazilianCurrency(safeMetrics.successValueNet)}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#999999", fontSize: "0.8rem", mt: 1 }}
              >
                Valor bruto - taxas
              </Typography>
            </Box>
            <IconButton
              sx={{ position: "relative", bottom: "30px" }}
              onClick={() => setOpenModal("net")}
            >
              <HiDotsVertical size={20} color="#666666" />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      {openModal && (
        <MetricsDetailsModal
          open={!!openModal}
          onClose={() => setOpenModal(null)}
          title={
            openModal === "tickets"
              ? "Detalhes dos Ingressos"
              : openModal === "gross"
              ? "Detalhes do Valor Bruto"
              : "Detalhes do Valor Líquido"
          }
          metrics={metrics}
          formatToBrazilianCurrency={formatToBrazilianCurrency}
          type={openModal}
        />
      )}
    </Box>
  );
};

export default Metrics;
