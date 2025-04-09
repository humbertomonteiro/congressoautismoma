// src/components/Scanner.jsx
import React, { useState, useEffect } from "react";
import Reader from "react-qr-scanner";
import styles from "./scanner.module.css";
import axios from "axios";
import { db } from "../../../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Collapse,
} from "@mui/material";
import { MdExpandMore, MdExpandLess } from "react-icons/md";

const Scanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState("");
  const [validationStatus, setValidationStatus] = useState(null);
  const [validatedQRs, setValidatedQRs] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [expandedCard, setExpandedCard] = useState(null);

  useEffect(() => {
    const fetchValidatedQRs = async () => {
      try {
        const snapshot = await getDocs(collection(db, "checkouts"));
        const validated = [];
        snapshot.forEach((doc) => {
          const checkout = doc.data();
          checkout.participants.forEach((participant, index) => {
            if (participant.validated) {
              const participantId = `${checkout.transactionId}-${index}`;
              if (participant.validated["2025-05-31"]) {
                validated.push({
                  participantId,
                  email: participant.email,
                  name: participant.name,
                  date: "2025-05-31",
                });
              }
              if (participant.validated["2025-06-01"]) {
                validated.push({
                  participantId,
                  email: participant.email,
                  name: participant.name,
                  date: "2025-06-01",
                });
              }
            }
          });
        });
        setValidatedQRs(validated);
        console.log("QR codes validados carregados:", validated);
      } catch (error) {
        console.error("Erro ao buscar QR codes validados:", error.message);
      }
    };
    fetchValidatedQRs();
  }, []);

  const handleScan = async (data) => {
    if (!data || !data.text) {
      console.log("Nenhum dado escaneado ou texto ausente.");
      return;
    }

    const qrText = data.text;
    console.log("QR Code lido:", qrText);

    setResult(qrText);
    setValidationStatus("Validando...");

    try {
      let parsedData;
      try {
        parsedData = JSON.parse(qrText);
        console.log("Dados parseados do QR:", parsedData);
      } catch (parseError) {
        console.error("Erro ao parsear QR como JSON:", parseError.message);
        setValidationStatus("Erro: Formato de QR Code inválido");
        return;
      }

      if (
        !parsedData.checkoutId ||
        !parsedData.participantId ||
        !parsedData.date
      ) {
        console.error("Dados do QR incompletos:", parsedData);
        setValidationStatus("Erro: Dados do QR incompletos");
        return;
      }

      console.log("Enviando qrData para validação:", qrText);
      const response = await axios.post(
        "http://localhost:5000/api/credentials/validate-qr-code",
        { qrData: qrText },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Resposta do backend:", response.data);

      if (response.data.success) {
        setValidationStatus("Válido");
        setValidatedQRs((prev) => [
          ...prev,
          {
            participantId: parsedData.participantId,
            email: parsedData.participantEmail || "Desconhecido",
            name: parsedData.participantName,
            date: parsedData.date,
            eventName: parsedData.eventName,
          },
        ]);
        setIsScanning(false);
      } else {
        setValidationStatus(response.data.message || "Inválido");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Erro desconhecido";
      console.error("Erro ao validar QR Code:", errorMessage);
      setValidationStatus(`Erro: ${errorMessage}`);
    }
  };

  const handleError = (err) => {
    console.error("Erro ao escanear QR Code:", err);
    setValidationStatus(`Erro ao abrir a câmera: ${err.message}`);
    setIsScanning(false);
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

  const filteredValidatedQRs = validatedQRs.filter((qr) =>
    qr.email.toLowerCase().includes(searchEmail.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <h1>Validação de QR Code</h1>
      <Card
        sx={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          p: "20px",
          width: "100%",
          maxWidth: "1200px", // Ajuste conforme o layout do dashboard
          mx: "auto",
          mb: 3,
        }}
      >
        {/* Scanner e Botões */}
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
                  width: { xs: "100%", sm: "400px" }, // Limita o tamanho do scanner
                }}
              >
                <Reader
                  delay={500}
                  onScan={handleScan}
                  onError={handleError}
                  facingMode="user"
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
              <Button
                variant="contained"
                color="secondary"
                onClick={handleStopScanning}
                sx={{ width: { xs: "100%", sm: "auto" }, py: 1.5 }}
              >
                Parar Escaneamento
              </Button>
            </Box>
          )}
        </Box>
        {/* Resultado */}
        {result && (
          <Box
            sx={{
              mb: 3,
              padding: "20px",
              ...getStatusStyle(validationStatus),
            }}
          >
            {validationStatus === "Válido" ? (
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
        {/* Busca e Lista de Validados */}
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Buscar por Email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            fullWidth
            variant="outlined"
          />
        </Box>
      </Card>
      <Box sx={{ backgroundColor: "#FFFFFF", borderRadius: "12px", p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          QR Codes Validados ({filteredValidatedQRs.length})
        </Typography>
        {filteredValidatedQRs.map((qr, index) => (
          <Card
            key={index}
            sx={{
              mb: 1,
              borderLeft: "4px solid #4caf50",
              "&:hover": { boxShadow: 4 },
            }}
          >
            <CardContent sx={{ p: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography variant="subtitle1">{qr.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {qr.email} | {qr.date}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() =>
                    setExpandedCard(expandedCard === index ? null : index)
                  }
                >
                  {expandedCard === index ? <MdExpandLess /> : <MdExpandMore />}
                </IconButton>
              </Box>
              <Collapse in={expandedCard === index}>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>ID do Participante:</strong> {qr.participantId}
                </Typography>
              </Collapse>
            </CardContent>
          </Card>
        ))}
      </Box>
    </div>
  );
};

export default Scanner;
