import React from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from "@mui/material";
import { useDashboard } from "../../../../data/contexts/DashboardContext";

const formatToBrazilianDate = (isoDate) => {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
};

const formatToISODate = (brazilianDate) => {
  if (!brazilianDate) return "";
  const [day, month, year] = brazilianDate.split("/");
  return `${year}-${month}-${day}`;
};

const Filters = ({ isMobile, setOpenFiltersDrawer }) => {
  const {
    statusFilter,
    setStatusFilter,
    methodFilter,
    setMethodFilter,
    searchQuery,
    setSearchQuery,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
  } = useDashboard();

  // Converte as datas do formato ISO (YYYY-MM-DD) para o formato brasileiro (DD/MM/YYYY) para exibição
  const formattedStartDate = formatToBrazilianDate(startDateFilter);
  const formattedEndDate = formatToBrazilianDate(endDateFilter);

  // Funções para lidar com a mudança nos campos de data
  const handleStartDateChange = (e) => {
    const isoDate = e.target.value; // Valor do input no formato YYYY-MM-DD
    setStartDateFilter(isoDate); // Mantém no formato ISO para o contexto
  };

  const handleEndDateChange = (e) => {
    const isoDate = e.target.value; // Valor do input no formato YYYY-MM-DD
    setEndDateFilter(isoDate); // Mantém no formato ISO para o contexto
  };

  return (
    <Box sx={{ p: "20px" }}>
      <Typography
        variant="h6"
        sx={{ color: "#333333", fontWeight: 500, mb: 2, borderRadius: "12px" }}
      >
        Filtros
      </Typography>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <FormControl fullWidth>
          <InputLabel sx={{ color: "#666666" }}>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
            sx={{ borderRadius: "8px", backgroundColor: "#FAFAFA" }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="approved">Aprovado</MenuItem>
            <MenuItem value="pending">Pendente</MenuItem>
            <MenuItem value="error">Erro</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel sx={{ color: "#666666" }}>Método</InputLabel>
          <Select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            label="Método"
            sx={{ borderRadius: "8px", backgroundColor: "#FAFAFA" }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="creditCard">Cartão de Crédito</MenuItem>
            <MenuItem value="pix">PIX</MenuItem>
            <MenuItem value="boleto">Boleto</MenuItem>
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label="Buscar por documento do pagador"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ borderRadius: "10px", backgroundColor: "#FAFAFA" }}
        />
      </Box>
      <Box
        sx={{
          mt: 2,
          display: "flex",
          gap: 2,
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <TextField
          fullWidth
          label="Data Inicial"
          type="date"
          value={startDateFilter} // Mantém no formato YYYY-MM-DD para o input
          onChange={handleStartDateChange}
          InputLabelProps={{ shrink: true }}
          sx={{ borderRadius: "10px", backgroundColor: "#FAFAFA" }}
        />
        <TextField
          fullWidth
          label="Data Final"
          type="date"
          value={endDateFilter} // Mantém no formato YYYY-MM-DD para o input
          onChange={handleEndDateChange}
          InputLabelProps={{ shrink: true }}
          sx={{ borderRadius: "10px", backgroundColor: "#FAFAFA" }}
        />
      </Box>
      {isMobile && (
        <Button
          variant="outlined"
          onClick={() => setOpenFiltersDrawer(false)}
          sx={{
            mt: 2,
            borderColor: "#1976D2",
            color: "#1976D2",
            borderRadius: "8px",
            textTransform: "none",
            "&:hover": { borderColor: "#1565C0", color: "#1565C0" },
          }}
        >
          Fechar
        </Button>
      )}
    </Box>
  );
};

export default Filters;
