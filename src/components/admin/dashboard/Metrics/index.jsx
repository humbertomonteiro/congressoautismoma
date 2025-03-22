import { Box, Card, CardContent, Typography } from "@mui/material";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { TbDiscountFilled } from "react-icons/tb";
import { FaTicketAlt } from "react-icons/fa";

const Metrics = ({ metrics }) => {
  return (
    <Box
      sx={{
        maxWidth: "100%",
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 2,
        pedding: "20px",
        marginBottom: "24px",
      }}
    >
      <Card
        sx={{
          flex: "1 1 30%",
          minWidth: "250px",
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

      <Card
        sx={{
          flex: "1 1 30%",
          minWidth: "250px",
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
      <Card
        sx={{
          flex: "1 1 30%",
          minWidth: "250px",
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
    </Box>
  );
};

export default Metrics;
