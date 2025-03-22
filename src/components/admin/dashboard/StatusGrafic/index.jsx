import { Box, Card, Typography } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const StatusGrafic = ({ chartData }) => {
  return (
    <Box item xs={12} sx={{ marginBottom: "24px" }}>
      <Card
        sx={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          p: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{ color: "#333333", fontWeight: 500, mb: 2 }}
        >
          Status dos Checkouts
        </Typography>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#666666" />
            <YAxis stroke="#666666" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </Box>
  );
};

export default StatusGrafic;
