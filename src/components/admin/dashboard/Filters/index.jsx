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
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useDashboard } from "../../../../data/contexts/DashboardContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { startOfDay, endOfDay } from "date-fns";
import { format } from "date-fns";

const Filters = ({ isMobile, setOpenFiltersDrawer }) => {
  const {
    statusFilter,
    setStatusFilter,
    methodFilter,
    setMethodFilter,
    payerSearchQuery,
    setPayerSearchQuery,
    participantSearchQuery,
    setParticipantSearchQuery,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    attendedFilter,
    setAttendedFilter,
    eventFilter,
    setEventFilter,
    setEndDateFilter,
  } = useDashboard();

  const handleStartDateChange = (date) => {
    if (date) {
      console.log("Date recebido do DatePicker:", date);
      console.log("ISO original:", date.toISOString());

      // Cria uma nova instância e adiciona um dia
      const adjustedDate = new Date(date);
      adjustedDate.setDate(adjustedDate.getDate() + 1); // Adiciona 1 dia
      adjustedDate.setHours(0, 0, 0, 0); // Garante o início do dia

      const formattedDate = adjustedDate.toISOString().split("T")[0];
      console.log("Data ajustada:", formattedDate);

      setStartDateFilter(formattedDate);
    } else {
      setStartDateFilter("");
    }
  };

  const handleEndDateChange = (date) => {
    if (date) {
      const localDate = endOfDay(date);
      setEndDateFilter(localDate.toISOString().split("T")[0]);
    } else {
      setEndDateFilter("");
    }
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setMethodFilter("");
    setPayerSearchQuery("");
    setParticipantSearchQuery("");
    setStartDateFilter("");
    setEndDateFilter("");
    setAttendedFilter(false);
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
          <InputLabel sx={{ color: "#666666" }}>Evento</InputLabel>
          <Select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            label="Método"
            sx={{ borderRadius: "10px" }}
          >
            <MenuItem value="">{eventFilter}</MenuItem>
            <MenuItem value="Congresso Autismo MA 2025">2025</MenuItem>
            <MenuItem value="Congresso Autismo MA 2026">2026</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel sx={{ color: "#666666" }}>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
            sx={{ borderRadius: "10px" }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="approved">Aprovado</MenuItem>
            <MenuItem value="pending">Pendente</MenuItem>
            <MenuItem value="error">Erro</MenuItem>
            <MenuItem value="tested">Teste</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel sx={{ color: "#666666" }}>Método</InputLabel>
          <Select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            label="Método"
            sx={{ borderRadius: "10px" }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="creditCard">Cartão de Crédito</MenuItem>
            <MenuItem value="pix">PIX</MenuItem>
            <MenuItem value="boleto">Boleto</MenuItem>
            <MenuItem value="cash">Dinheiro</MenuItem>
            <MenuItem value="debitCard">Débito</MenuItem>
            <MenuItem value="courtesy">Cortesia</MenuItem>
            <MenuItem value="internal">Interno</MenuItem>
            <MenuItem value="falha-tecnica">Falha Técnica</MenuItem>
          </Select>
        </FormControl>
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
          label="Buscar por nome ou documento do comprador"
          value={payerSearchQuery}
          onChange={(e) => {
            setPayerSearchQuery(e.target.value);
          }}
          sx={{ borderRadius: "10px" }}
        />
        <TextField
          fullWidth
          label="Buscar por nome, documento ou email dos participantes"
          value={participantSearchQuery}
          onChange={(e) => {
            setParticipantSearchQuery(e.target.value);
          }}
          sx={{ borderRadius: "10px" }}
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
        <DatePicker
          selected={startDateFilter ? new Date(startDateFilter) : null}
          onChange={handleStartDateChange}
          dateFormat="dd/MM/yyyy"
          placeholderText="DD/MM/YYYY"
          customInput={
            <TextField
              fullWidth
              label="Data Inicial"
              sx={{ borderRadius: "10px" }}
            />
          }
        />
        <DatePicker
          selected={endDateFilter ? new Date(endDateFilter) : null}
          onChange={handleEndDateChange}
          dateFormat="dd/MM/yyyy"
          placeholderText="DD/MM/YYYY"
          customInput={
            <TextField
              fullWidth
              label="Data Final"
              sx={{ borderRadius: "10px" }}
            />
          }
        />
        {/* <FormControlLabel
          control={
            <Checkbox
              checked={attendedFilter}
              onChange={(e) => setAttendedFilter(e.target.checked)}
              color="primary"
            />
          }
          label="Participantes presentes"
        /> */}
        <Button
          variant="outlined"
          onClick={handleClearFilters}
          sx={{
            borderColor: "#D32F2F",
            color: "#D32F2F",
            borderRadius: "10px",
            textTransform: "none",
            "&:hover": { borderColor: "#B71C1C", color: "#B71C1C" },
          }}
        >
          Limpar Filtros
        </Button>
      </Box>
      {isMobile && (
        <Button
          variant="outlined"
          onClick={() => setOpenFiltersDrawer(false)}
          sx={{
            mt: 2,
            borderColor: "#1976D2",
            color: "#1976D2",
            borderRadius: "10px",
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
