import React, { useState } from "react";
import { db } from "../../../../../firebaseConfig";
import { collection, getDocs, where, query } from "firebase/firestore";
import axios from "axios";
import { toast } from "react-toastify";
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

const ManualAuth = () => {
  const [cpf, setCpf] = useState("");
  const [participant, setParticipant] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [qrData, setQrData] = useState("");

  // Função para formatar CPF
  const formatCpf = (value) => {
    const cleanCpf = value.replace(/[^\d]/g, "");
    if (cleanCpf.length <= 11) {
      return cleanCpf
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return cleanCpf;
  };

  // Manipulador de mudança no input do CPF
  const handleCpfChange = (e) => {
    const formattedCpf = formatCpf(e.target.value);
    setCpf(formattedCpf);
  };

  // Função para buscar participante por CPF ou documento
  const fetchParticipantByCpf = async () => {
    try {
      const cleanCpf = cpf.replace(/[^\d]/g, "").trim();
      if (cleanCpf.length !== 11) {
        throw new Error("CPF inválido. Deve conter 11 dígitos.");
      }

      setLoading(true);
      setErrorMessage("");
      console.log(`Buscando participante para identificador: ${cleanCpf}`);
      const checkoutsRef = collection(db, "checkouts");
      // Adiciona query para filtrar apenas checkouts com status "approved"
      const q = query(checkoutsRef, where("status", "==", "approved"));
      const snapshot = await getDocs(q);

      let matchingCheckout = null;
      let matchingParticipant = null;

      for (const doc of snapshot.docs) {
        const checkout = { id: doc.id, ...doc.data() };
        const participant = checkout.participants?.find((p) => {
          const participantCpf =
            p.cpf && typeof p.cpf === "string"
              ? p.cpf.replace(/[^\d]/g, "").trim()
              : null;
          const participantDocument =
            p.document && typeof p.document === "string"
              ? p.document.replace(/[^\d]/g, "").trim()
              : null;
          return (
            participantCpf === cleanCpf || participantDocument === cleanCpf
          );
        });
        if (participant) {
          console.log(
            `Participante encontrado: ${participant.name} no checkout ${doc.id}`,
            { foundBy: participant.cpf ? "cpf" : "document" }
          );
          matchingCheckout = checkout;
          matchingParticipant = participant;
          break;
        }
      }

      if (!matchingParticipant) {
        console.log(
          "Nenhum participante encontrado para este CPF ou documento."
        );
        throw new Error("Nenhum participante encontrado para este CPF.");
      }

      setParticipant(matchingParticipant);
      setCheckout(matchingCheckout);
    } catch (error) {
      console.error("Erro ao buscar participante:", error);
      setErrorMessage(
        error.message || "Erro ao buscar dados. Tente novamente."
      );
      setParticipant(null);
      setCheckout(null);
    } finally {
      setLoading(false);
    }
  };

  // Função para abrir o diálogo de confirmação
  const handleValidateClick = (date, qrRawData) => {
    setSelectedDate(date);
    setQrData(qrRawData);
    setOpenConfirmDialog(true);
  };

  // Função para validar o QR code
  const validateQrCode = async () => {
    setLoading(true);
    setOpenConfirmDialog(false);
    try {
      console.log("Enviando qrData para validação:", qrData);
      const response = await axios.post(
        `${
          import.meta.env.VITE_ENV === "sandbox"
            ? import.meta.env.VITE_BASE_URL_SANDBOX
            : import.meta.env.VITE_BASE_URL_PRODUCTION
        }/credentials/validate-qr-code`,
        { qrData },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Resposta do backend:", response.data);

      if (response.data.success) {
        toast.success(
          `QR Code válido! Participante: ${participant.name}, Data: ${selectedDate}`,
          { position: "top-center", autoClose: 3000 }
        );
      } else {
        toast.error(`Erro: ${response.data.message || "QR Code inválido"}`, {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Erro desconhecido";
      console.error("Erro ao validar QR Code:", errorMessage);
      toast.error(`Erro: ${errorMessage}`, {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
      setSelectedDate("");
      setQrData("");
    }
  };

  return (
    <div style={styles.container}>
      <h1>Autenticação Manual por CPF</h1>
      <Card sx={styles.card}>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <TextField
              label="CPF do Participante"
              value={cpf}
              onChange={handleCpfChange}
              placeholder="Digite o CPF (ex: 123.456.789-00)"
              fullWidth
              variant="outlined"
              inputProps={{ maxLength: 14 }}
              disabled={loading}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={fetchParticipantByCpf}
              disabled={loading}
              sx={{ mt: 2, width: "100%", py: 1.5 }}
            >
              {loading ? "Buscando..." : "Buscar Participante"}
            </Button>
          </Box>
          {errorMessage && (
            <Typography color="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Typography>
          )}
          {participant && checkout && (
            <Box sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Participante Encontrado
              </Typography>
              <Typography>
                <strong>Nome:</strong> {participant.name}
              </Typography>
              <Typography>
                <strong>Email:</strong> {participant.email || "Não informado"}
              </Typography>
              <Typography>
                <strong>Checkout ID:</strong> {checkout.id}
              </Typography>
              <Typography sx={{ mt: 2, mb: 1 }}>
                <strong>Validar Ingresso:</strong>
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {participant.qrRawData?.["2026-05-31"] && (
                  <Button
                    variant="outlined"
                    onClick={() =>
                      handleValidateClick(
                        "2026-05-31",
                        participant.qrRawData["2026-05-31"]
                      )
                    }
                    disabled={loading}
                  >
                    Validar para 31/05/2026
                  </Button>
                )}
                {participant.qrRawData?.["2026-06-01"] && (
                  <Button
                    variant="outlined"
                    onClick={() =>
                      handleValidateClick(
                        "2026-06-01",
                        participant.qrRawData["2026-06-01"]
                      )
                    }
                    disabled={loading}
                  >
                    Validar para 01/06/2026
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Confirmação */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
      >
        <DialogTitle>Confirmar Validação</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja validar o ingresso de {participant?.name}{" "}
            para {selectedDate}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={validateQrCode} color="primary" disabled={loading}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

// Estilos inline
const styles = {
  container: {
    width: "600px",
    maxWidth: "100%",
    margin: "40px auto 20px",
    // padding: "20px",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },
};

export default ManualAuth;
