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
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
    setEndDateFilter,
    setAttendedFilter,
    eventFilter,
    setEventFilter,
  } = useDashboard();

  // Formata usando campos locais para evitar desvio de timezone (UTC vs BRT)
  const toLocalDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const handleStartDateChange = (date) => {
    setStartDateFilter(date ? toLocalDateString(date) : "");
  };

  const handleEndDateChange = (date) => {
    setEndDateFilter(date ? toLocalDateString(date) : "");
  };

  // Converte "YYYY-MM-DD" de volta para Date local (evita UTC midnight)
  const parseLocalDate = (str) => {
    if (!str) return null;
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
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
      <Typography sx={{ color: "#0f172a", fontWeight: 700, fontSize: "0.95rem", mb: 2 }}>
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
          <InputLabel sx={{ color: "#64748b" }}>Evento</InputLabel>
          <Select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            label="Evento"
            sx={{ borderRadius: "10px" }}
          >
            <MenuItem value="Congresso Autismo MA 2025">Congresso Autismo MA 2025</MenuItem>
            <MenuItem value="Congresso Autismo MA 2026">Congresso Autismo MA 2026</MenuItem>
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
            <MenuItem value="test">Teste</MenuItem>
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
          selected={parseLocalDate(startDateFilter)}
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
          selected={parseLocalDate(endDateFilter)}
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
            borderColor: "#fecaca",
            color: "#dc2626",
            borderRadius: "10px",
            textTransform: "none",
            fontSize: "0.85rem",
            "&:hover": { borderColor: "#dc2626", backgroundColor: "#fff1f2" },
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
