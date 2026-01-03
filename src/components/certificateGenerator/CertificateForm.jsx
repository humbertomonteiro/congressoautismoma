import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Box,
  Fade,
  IconButton,
} from "@mui/material";
import { IoMdClose } from "react-icons/io";
import FeedbackAlert from "./FeedbackAlert";

const CertificateForm = ({
  formData,
  onChange,
  onSubmit,
  loading,
  errorMessage,
  success,
  handleManualDownload,
}) => {
  const [windowLocation, setWindowLocation] = useState(null);
  const [showSuccessCard, setShowSuccessCard] = useState(success);

  // Atualizar showSuccessCard quando success mudar
  useEffect(() => {
    setShowSuccessCard(success);
  }, [success]);

  // Definir windowLocation na montagem do componente
  useEffect(() => {
    setWindowLocation(window.location.pathname);
  }, []);

  // Formatar CPF durante a digitação
  const handleCpfChange = (e) => {
    let value = e.target.value.replace(/[^\d]/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 9) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3");
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d{3})/, "$1.$2.");
    }
    onChange("cpf")(value);
  };

  // Função para fechar o card de sucesso
  const handleCloseSuccessCard = () => {
    setShowSuccessCard(false);
  };

  return (
    <Paper
      elevation={6}
      sx={{
        p: 3,
        borderRadius: "16px",
        bgcolor: "#FFFFFF",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        width: "100%",
        position: "relative",
        zIndex: 1,
        overflow: "hidden",
      }}
    >
      <Typography
        variant="h6"
        sx={{ color: "#333333", fontWeight: 500, mb: 2, borderRadius: "12px" }}
      >
        {windowLocation !== "/dashboard"
          ? "Emita seu Certificado - Congresso Autismo MA 2025"
          : "Emitir Certificado"}
      </Typography>
      {windowLocation !== "/dashboard" && (
        <Typography
          variant="body1"
          sx={{
            color: "#555",
            lineHeight: 1.6,
          }}
        >
          Foi um prazer tê-lo no Congresso Autismo MA 2025! Preencha os campos
          abaixo para gerar seu certificado de 30 horas. <br />
          <strong>O nome completo é indispensável.</strong>
        </Typography>
      )}
      <form
        onSubmit={onSubmit}
        style={{ position: "relative", zIndex: 2, gap: 0 }}
      >
        <TextField
          label="CPF"
          value={formData.cpf}
          onChange={handleCpfChange}
          fullWidth
          margin="normal"
          required
          variant="outlined"
          InputProps={{
            sx: { borderRadius: "10px", bgcolor: "#F9FAFB" },
          }}
          InputLabelProps={{ sx: { color: "#555" } }}
        />
        <TextField
          label="Nome Completo"
          value={formData.name}
          onChange={(e) => onChange("name")(e.target.value)}
          fullWidth
          margin="normal"
          required
          variant="outlined"
          helperText="Insira seu nome completo para seu certificado."
          InputProps={{
            sx: { borderRadius: "10px", bgcolor: "#F9FAFB" },
          }}
          InputLabelProps={{ sx: { color: "#555" } }}
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{
            py: 1.5,
            bgcolor: "#1976D2",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "1.1rem",
            "&:hover": { bgcolor: "#1565C0" },
            "&:disabled": { bgcolor: "#B0BEC5" },
          }}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Gerar Certificado"
          )}
        </Button>
      </form>

      {errorMessage && (
        <FeedbackAlert
          type="error"
          message={errorMessage}
          handleManualDownload={null}
        />
      )}

      {showSuccessCard && (
        <Fade in={showSuccessCard}>
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "rgba(0, 0, 0, 0.5)", // Fundo semi-transparente
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1300, // Acima do formulário
            }}
          >
            <Paper
              elevation={12}
              sx={{
                p: 4,
                borderRadius: "16px",
                bgcolor: "#FFFFFF",
                width: { xs: "90%", sm: "400px" },
                textAlign: "center",
                position: "relative",
                boxShadow: "0 12px 40px rgba(0, 0, 0, 0.2)",
                border: "1px solid #E0E0E0",
              }}
            >
              <IconButton
                onClick={handleCloseSuccessCard}
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  color: "#555",
                }}
              >
                <IoMdClose />
              </IconButton>
              <Typography
                variant="h6"
                sx={{ color: "#1A3C6C", fontWeight: 600, mb: 2 }}
              >
                Sucesso!
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "#333", mb: 3, lineHeight: 1.6 }}
              >
                Seu certificado foi gerado com sucesso!{" "}
                {handleManualDownload
                  ? "Clique abaixo para baixar manualmente."
                  : "O download foi iniciado automaticamente."}
              </Typography>
              {handleManualDownload && (
                <Button
                  variant="contained"
                  onClick={handleManualDownload}
                  sx={{
                    bgcolor: "#08B182",
                    color: "#FFFFFF",
                    borderRadius: "10px",
                    py: 1.2,
                    px: 3,
                    textTransform: "none",
                    fontWeight: 600,
                    "&:hover": { bgcolor: "#079669" },
                  }}
                >
                  Baixar Certificado
                </Button>
              )}
            </Paper>
          </Box>
        </Fade>
      )}
    </Paper>
  );
};

export default CertificateForm;
