import React, { useState, useEffect } from "react";
import Reader from "react-qr-scanner";
import styles from "./scanner.module.css";
import axios from "axios";
import { toast } from "react-toastify";
import { Button, Card, Box, Typography, CircularProgress } from "@mui/material";
import ManualAuth from "./ManualAuth";

const Scanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState("");
  const [validationStatus, setValidationStatus] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // Verificar se há múltiplas câmeras disponíveis
    const checkCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setHasMultipleCameras(videoDevices.length > 1);
      } catch (err) {
        console.error("Erro ao verificar dispositivos de câmera:", err);
      }
    };
    checkCameras();
  }, []);

  const handleScan = async (data) => {
    if (!data || !data.text) {
      console.log("Nenhum dado escaneado ou texto ausente.");
      return;
    }

    const qrText = data.text;
    console.log("QR Code lido:", qrText);

    setResult(qrText);
    setIsValidating(true);
    setValidationStatus("Validando...");

    // Garantir pelo menos 1 segundo de animação
    const startTime = Date.now();
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(qrText);
        console.log("Dados parseados do QR:", parsedData);
      } catch (parseError) {
        console.error("Erro ao parsear QR como JSON:", parseError.message);
        setValidationStatus("Erro: Formato de QR Code inválido");
        setIsValidating(false);
        return;
      }

      if (
        !parsedData.checkoutId ||
        !parsedData.participantId ||
        !parsedData.date
      ) {
        console.error("Dados do QR incompletos:", parsedData);
        setValidationStatus("Erro: Dados do QR incompletos");
        setIsValidating(false);
        return;
      }

      console.log("Enviando qrData para validação:", qrText);
      const response = await axios.post(
        `${
          import.meta.env.VITE_ENV === "sandbox"
            ? import.meta.env.VITE_BASE_URL_SANDBOX
            : import.meta.env.VITE_BASE_URL_PRODUCTION
        }/credentials/validate-qr-code`,
        { qrData: qrText },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Resposta do backend:", response.data);

      // Garantir que a animação dure pelo menos 1 segundo
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - elapsedTime));
      }

      if (response.data.success) {
        setValidationStatus("Válido");
        toast.success(
          `QR Code válido! Participante: ${parsedData.participantName}, Data: ${parsedData.date}`,
          { position: "top-center", autoClose: 3000 }
        );
        setIsScanning(false); // Fechar a câmera
      } else {
        setValidationStatus(response.data.message || "Inválido");
        toast.error(`Erro: ${response.data.message || "QR Code inválido"}`, {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Erro desconhecido";
      console.error("Erro ao validar QR Code:", errorMessage);

      // Garantir que a animação dure pelo menos 1 segundo
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - elapsedTime));
      }

      setValidationStatus(`Erro: ${errorMessage}`);
      toast.error(`Erro: ${errorMessage}`, {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleError = (err) => {
    console.error("Erro ao escanear QR Code:", err);
    setValidationStatus(`Erro ao abrir a câmera: ${err.message}`);
    setIsScanning(false);
    toast.error(`Erro ao abrir a câmera: ${err.message}`, {
      position: "top-center",
      autoClose: 3000,
    });
  };

  const handleStartScanning = () => {
    setIsScanning(true);
    setResult("");
    setValidationStatus(null);
    console.log("Escaneamento iniciado.");
  };

  const handleStopScanning = () => {
    setIsScanning(false);
    setResult("");
    setValidationStatus(null);
    console.log("Escaneamento parado.");
  };

  const handleToggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    setIsScanning(false); // Para o escaneamento para reiniciar o stream
    setTimeout(() => setIsScanning(true), 100); // Reinicia após um pequeno delay
    console.log(
      "Câmera alternada para:",
      facingMode === "environment" ? "frente" : "trás"
    );
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Válido":
        return { bgcolor: "#e8f5e9", borderLeft: "4px solid #4caf50" };
      case "Inválido":
        return { bgcolor: "#ffebee", borderLeft: "4px solid #f44336" };
      case "Validando...":
        return { bgcolor: "#e0f7fa", borderLeft: "4px solid #00bcd4" };
      default:
        return status?.startsWith("Erro")
          ? { bgcolor: "#fff3e0", borderLeft: "4px solid #ff9800" }
          : {};
    }
  };

  const videoConstraints = {
    facingMode: facingMode,
    width: { ideal: 1280 },
    height: { ideal: 720 },
  };

  return (
    <div className={styles.container}>
      <h1>Validação de QR Code</h1>
      <Card
        sx={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          p: "20px",
          width: "600px",
          maxWidth: "100%",
          mx: "auto",
          mb: 3,
        }}
      >
        <Box sx={{ mb: 3 }}>
          {!isScanning ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartScanning}
              sx={{ width: { xs: "100%", sm: "auto" }, py: 1.5 }}
            >
              Iniciar Escaneamento
            </Button>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box
                sx={{
                  position: "relative",
                  border: "2px dashed #ccc",
                  borderRadius: 2,
                  overflow: "hidden",
                  width: { xs: "100%", sm: "400px" },
                }}
              >
                <Reader
                  delay={500}
                  onScan={handleScan}
                  onError={handleError}
                  constraints={{ video: videoConstraints }}
                  style={{ width: "100%", height: "auto" }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    border: "20px solid rgba(0, 0, 0, 0.2)",
                    pointerEvents: "none",
                  }}
                />
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleStopScanning}
                  sx={{ width: { xs: "100%", sm: "auto" }, py: 1.5 }}
                >
                  Parar Escaneamento
                </Button>
                {hasMultipleCameras && (
                  <Button
                    variant="outlined"
                    onClick={handleToggleCamera}
                    sx={{ width: { xs: "100%", sm: "auto" }, py: 1.5 }}
                  >
                    Alternar para Câmera{" "}
                    {facingMode === "environment" ? "Frontal" : "Traseira"}
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Box>
        {result && (
          <Box
            sx={{
              mb: 3,
              padding: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...getStatusStyle(validationStatus),
            }}
          >
            {isValidating ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="h6" color="info.main">
                  Validando...
                </Typography>
              </Box>
            ) : validationStatus === "Válido" ? (
              (() => {
                const parsed = JSON.parse(result);
                return (
                  <>
                    <Typography variant="h6" color="success.main">
                      QR Code Válido
                    </Typography>
                    <Typography>
                      <strong>Nome:</strong> {parsed.participantName}
                    </Typography>
                    <Typography>
                      <strong>Evento:</strong> {parsed.eventName}
                    </Typography>
                    <Typography>
                      <strong>Data:</strong> {parsed.date}
                    </Typography>
                  </>
                );
              })()
            ) : (
              <Typography
                variant="h6"
                color={
                  validationStatus?.startsWith("Erro")
                    ? "error.main"
                    : validationStatus === "Validando..."
                    ? "info.main"
                    : "text.primary"
                }
              >
                {validationStatus || "Escaneie um QR Code"}
              </Typography>
            )}
          </Box>
        )}
      </Card>
      <ManualAuth />
    </div>
  );
};

export default Scanner;
