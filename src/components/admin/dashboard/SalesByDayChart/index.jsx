import { useState, useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Box,
  Card,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const SalesByDayChart = ({ checkouts, formatToBrazilianCurrency }) => {
  const [period, setPeriod] = useState("month");

  // Processar os dados de vendas
  const salesData = useMemo(() => {
    const approvedCheckouts = checkouts.filter((c) => c.status === "approved");

    const now = new Date();
    let startDate, endDate;
    switch (period) {
      case "week":
        startDate = startOfWeek(now, { locale: ptBR });
        endDate = endOfWeek(now, { locale: ptBR });
        break;
      case "year":
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      case "month":
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
    }

    const salesByDay = {};
    approvedCheckouts.forEach((checkout) => {
      const date = parseISO(checkout.timestamp); // Converte para Date corretamente
      const dayKey = format(date, "yyyy-MM-dd", { locale: ptBR });

      if (date >= startDate && date <= endDate) {
        salesByDay[dayKey] =
          (salesByDay[dayKey] || 0) + parseFloat(checkout.totalAmount || 0);
      }
    });

    // Ordenar e converter para formato do Recharts
    return Object.keys(salesByDay)
      .map((day) => ({
        name:
          period === "year"
            ? format(parseISO(day), "MMM", { locale: ptBR })
            : format(parseISO(day), "dd/MM", { locale: ptBR }),
        value: salesByDay[day],
      }))
      .sort((a, b) => new Date(a.name) - new Date(b.name));
  }, [checkouts, period]);

  return (
    <Box sx={{ marginBottom: "24px", width: "100%" }}>
      <Card
        sx={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          p: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: "#333333", fontWeight: 500 }}>
            Vendas por Dia
          </Typography>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="period-select-label">Período</InputLabel>
            <Select
              labelId="period-select-label"
              value={period}
              label="Período"
              onChange={(e) => setPeriod(e.target.value)}
              sx={{ height: "40px" }}
            >
              <MenuItem value="week">Semana</MenuItem>
              <MenuItem value="month">Mês</MenuItem>
              <MenuItem value="year">Ano</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesData}>
            <XAxis dataKey="name" stroke="#666666" />
            <YAxis stroke="#666666" />
            <Tooltip
              formatter={(value) => formatToBrazilianCurrency(value)}
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            />
            <Bar dataKey="value" fill="#1976D2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </Box>
  );
};

export default SalesByDayChart;
