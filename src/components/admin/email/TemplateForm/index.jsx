import React, { useState, useEffect } from "react";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
} from "@mui/material";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";

const TemplateForm = ({
  initialData,
  onSave,
  onCancel,
  availableForTemplates,
}) => {
  const [subject, setSubject] = useState(initialData.subject || "");
  const [title, setTitle] = useState(initialData.title || "");
  const [body, setBody] = useState(initialData.body || "");
  const [statusFilter, setStatusFilter] = useState(
    initialData.statusFilter || ""
  );
  const [includeQRCodes, setIncludeQRCodes] = useState(
    initialData.includeQRCodes || false
  );
  const [targetCount, setTargetCount] = useState(0);

  const isProduction = import.meta.env.VITE_ENV === "production";
  const baseUrl = isProduction
    ? `${import.meta.env.VITE_BASE_URL_PRODUCTION}/email`
    : `${import.meta.env.VITE_BASE_URL_SANDBOX}/email`;

  useEffect(() => {
    if (statusFilter) {
      fetchTargetCount(statusFilter);
    }
  }, [statusFilter]);

  const fetchTargetCount = async (status) => {
    try {
      const response = await axios.get(
        `${baseUrl}/checkouts/count?status=${status}`
      );
      setTargetCount(response.data.data.targetCount);
    } catch (error) {
      console.error("Erro ao buscar contagem de alvos:", error);
      setTargetCount(0);
    }
  };

  const handleSubmit = (sendImmediately) => {
    const templateData = {
      subject,
      title,
      body,
      sendType: "status", // Fixo como status
      statusFilter,
      includeQRCodes,
    };
    onSave(templateData, sendImmediately);
  };

  const isCreationBlocked = targetCount > availableForTemplates;

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Typography variant="h6" sx={{ color: "#333", fontWeight: 500, mb: 2 }}>
        {initialData.id ? "Editar Template" : "Novo Template"}
      </Typography>
      <TextField
        label="Assunto"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        fullWidth
        margin="normal"
        required
        sx={{ backgroundColor: "#FAFAFA", borderRadius: "8px" }}
      />
      <TextField
        label="Título"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        fullWidth
        margin="normal"
        sx={{ backgroundColor: "#FAFAFA", borderRadius: "8px" }}
      />
      <Typography variant="body2" sx={{ color: "#666", mb: 1, mt: 2 }}>
        Corpo do Email
      </Typography>
      <ReactQuill
        value={body}
        onChange={setBody}
        theme="snow"
        style={{
          backgroundColor: "#FAFAFA",
          borderRadius: "8px",
        }}
      />
      <FormControl fullWidth margin="normal" sx={{ mt: 3 }}>
        <InputLabel sx={{ color: "#666" }}>Filtro de Status</InputLabel>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ backgroundColor: "#FAFAFA", borderRadius: "8px" }}
        >
          <MenuItem value="approved">Aprovado</MenuItem>
          <MenuItem value="pending">Pendente</MenuItem>
          <MenuItem value="error">Erro</MenuItem>
          <MenuItem value="test">Teste</MenuItem>
        </Select>
      </FormControl>
      <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
        <Typography variant="body2" sx={{ color: "#666", mr: 2 }}>
          Incluir QR Codes{" "}
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={includeQRCodes}
              onChange={(e) => setIncludeQRCodes(e.target.checked)}
            />
          }
        />
      </Box>
      {statusFilter && (
        <Typography
          sx={{ mt: 1, color: isCreationBlocked ? "#D32F2F" : "#666" }}
        >
          Emails a enviar: {targetCount} (Disponíveis: {availableForTemplates})
          {isCreationBlocked && " - Limite excedido"}
        </Typography>
      )}
      <Box sx={{ mt: 3, display: "flex", flexWrap: "wrap", gap: 2 }}>
        {/* <Button
          variant="contained"
          onClick={() => handleSubmit(false)}
          disabled={isCreationBlocked}
          sx={{
            backgroundColor: "#1976D2",
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 500,
            flex: "1 1 30%",
            "&:hover": { backgroundColor: "#1565C0" },
          }}
        >
          {initialData.id ? "Atualizar" : "Criar"}
        </Button> */}
        <Button
          variant="contained"
          onClick={() => handleSubmit(true)}
          disabled={isCreationBlocked}
          sx={{
            backgroundColor: "#2E7D32",
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 500,
            flex: "1 1 30%",
            "&:hover": { backgroundColor: "#1B5E20" },
          }}
        >
          {initialData.id ? "Atualizar e Enviar" : "Criar e Enviar"}
        </Button>
        <Button
          variant="outlined"
          onClick={onCancel}
          sx={{
            borderColor: "#1976D2",
            color: "#1976D2",
            borderRadius: "8px",
            textTransform: "none",
            flex: "1 1 33%",
            "&:hover": { borderColor: "#1565C0", color: "#1565C0" },
          }}
        >
          Cancelar
        </Button>
      </Box>
    </Box>
  );
};

export default TemplateForm;
