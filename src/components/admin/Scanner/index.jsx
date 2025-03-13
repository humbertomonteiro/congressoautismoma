// src/components/admin/Scanner.js
import React, { useState, useEffect } from "react";
import Reader from "react-qr-scanner";
import styles from "./scanner.module.css";
import axios from "axios";
import { db } from "../../../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import {
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

const Scanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState("");
  const [validationStatus, setValidationStatus] = useState(null);
  const [validatedQRs, setValidatedQRs] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");

  useEffect(() => {
    const fetchValidatedQRs = async () => {
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
    };
    fetchValidatedQRs();
  }, []);

  const handleScan = async (data) => {
    console.log("Dados recebidos do QrScanner:", data);
    if (data && data.text) {
      const qrText = data.text;
      setResult(qrText);
      try {
        const response = await axios.post(
          "http://localhost:5000/api/payments/validate-qr-code",
          { qrData: qrText }
        );
        if (response.data.success) {
          setValidationStatus("Válido");
          const parsedData = JSON.parse(qrText);
          setValidatedQRs((prev) => [
            ...prev,
            {
              participantId: parsedData.participantId,
              email: parsedData.participantEmail || "Desconhecido",
              name: parsedData.participantName,
              date: parsedData.date,
            },
          ]);
        } else {
          setValidationStatus(response.data.message || "Inválido");
        }
      } catch (error) {
        console.error("Erro ao validar QR Code:", error);
        setValidationStatus(
          "Erro: " + (error.response?.data?.message || error.message)
        );
      }
      setIsScanning(false);
    } else {
      console.warn("Nenhum dado válido recebido do QR Code");
      setValidationStatus("Nenhum QR Code detectado");
      setIsScanning(false);
    }
  };

  const handleError = (err) => {
    console.error("Erro ao escanear QR Code:", err);
    setValidationStatus("Erro ao abrir a câmera: " + err.message);
    setIsScanning(false);
  };

  const handleStartScanning = () => {
    setIsScanning(true);
    setResult("");
    setValidationStatus(null);
  };

  const handleStopScanning = () => {
    setIsScanning(false);
    setResult("");
    setValidationStatus(null);
  };

  const filteredValidatedQRs = validatedQRs.filter((qr) =>
    qr.email.toLowerCase().includes(searchEmail.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <h1>Validação de QR Code</h1>
      <div className={styles.buttonContainer}>
        {!isScanning ? (
          <Button
            variant="contained"
            color="primary"
            onClick={handleStartScanning}
            className={styles.scanButton}
          >
            Iniciar Escaneamento
          </Button>
        ) : (
          <>
            <div className={styles.scannerWrapper}>
              <Reader
                delay={300}
                onScan={handleScan}
                onError={handleError}
                facingMode="environment"
                style={{ width: "100%", height: "auto" }}
                className={styles.qrScanner}
              />
            </div>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleStopScanning}
              className={styles.stopButton}
            >
              Parar Escaneamento
            </Button>
          </>
        )}
      </div>
      <p className={styles.result}>{result || "Escaneie um QR Code"}</p>
      {validationStatus && (
        <p
          className={
            validationStatus === "Válido" ? styles.valid : styles.invalid
          }
        >
          Status: {validationStatus}
        </p>
      )}

      <div className={styles.searchSection}>
        <TextField
          label="Buscar por Email"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          fullWidth
          margin="normal"
          className={styles.searchInput}
        />
      </div>

      <div className={styles.validatedSection}>
        <h2>QR Codes Validados</h2>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID do Participante</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredValidatedQRs.map((qr, index) => (
              <TableRow key={index}>
                <TableCell>{qr.participantId}</TableCell>
                <TableCell>{qr.name}</TableCell>
                <TableCell>{qr.email}</TableCell>
                <TableCell>{qr.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Scanner;
