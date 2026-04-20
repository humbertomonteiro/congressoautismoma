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
  Legend,
  ResponsiveContainer,
} from "recharts";

const SalesByDayChart = ({ checkouts }) => {
  const [period, setPeriod] = useState("month");

  // Processar os dados de ingressos por dia
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

    const ticketsByDay = {};
    approvedCheckouts.forEach((checkout) => {
      const date = checkout.timestamp?.toDate
        ? checkout.timestamp.toDate()
        : new Date(checkout.timestamp);
      const dayKey = format(date, "yyyy-MM-dd", { locale: ptBR });

      if (date >= startDate && date <= endDate) {
        const od = checkout.orderDetails || {};
        const full = od.allTickets ?? od.fullTickets ?? 0;
        const half = od.halfTickets || 0;
        const social = od.socialTickets || 0;
        const total = Number(full) + Number(half) + Number(social);

        if (!ticketsByDay[dayKey]) {
          ticketsByDay[dayKey] = { total: 0, full: 0, half: 0, social: 0 };
        }
        ticketsByDay[dayKey].total += total;
        ticketsByDay[dayKey].full += Number(full);
        ticketsByDay[dayKey].half += Number(half);
        ticketsByDay[dayKey].social += Number(social);
      }
    });

    // Ordenar e converter para formato do Recharts
    return Object.keys(ticketsByDay)
      .map((day) => ({
        name:
          period === "year"
            ? format(parseISO(day), "MMM", { locale: ptBR })
            : format(parseISO(day), "dd/MM", { locale: ptBR }),
        total: ticketsByDay[day].total,
        inteiros: ticketsByDay[day].full,
        meias: ticketsByDay[day].half,
        sociais: ticketsByDay[day].social,
      }))
      .sort((a, b) => new Date(a.name) - new Date(b.name));
  }, [checkouts, period]);

  return (
    <Box sx={{ width: "100%" }}>
      <Card sx={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        p: 2,
      }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography sx={{ color: "#0f172a", fontWeight: 700, fontSize: "0.95rem" }}>
            Ingressos por Dia
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
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              formatter={(value, name) => [value, name]}
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                fontSize: "0.82rem",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "0.78rem" }} />
            <Bar dataKey="inteiros" name="Inteiros" stackId="a" fill="#3b82f6" />
            <Bar dataKey="meias" name="Meias" stackId="a" fill="#a855f7" />
            <Bar dataKey="sociais" name="Sociais" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </Box>
  );
};

export default SalesByDayChart;
