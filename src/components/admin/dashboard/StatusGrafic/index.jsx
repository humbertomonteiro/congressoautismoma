import { Box, Card, Typography } from "@mui/material";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";

const StatusGrafic = ({ chartData }) => {
  // Cores para cada fatia do gráfico (opcional, personalize conforme necessário)
  const COLORS = ["#2E7D32", "#FFB300", "#D32F2F", "#FF8042", "#8884D8"];

  return (
    <Box sx={{ mb: 2, width: "100%" }}>
      <Card sx={{ boxShadow: 0, border: "none" }}>
        <Typography sx={{ color: "#0f172a", fontWeight: 700, fontSize: "0.95rem", mb: 0.5 }}>
          Status dos Checkouts
        </Typography>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              label
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              fontSize: "0.82rem",
            }} />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </Box>
  );
};

export default StatusGrafic;
