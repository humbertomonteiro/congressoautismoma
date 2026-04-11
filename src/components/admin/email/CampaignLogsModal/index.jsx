import { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Tooltip,
} from "@mui/material";
import { MdCheckCircle, MdCancel, MdRefresh, MdEmail } from "react-icons/md";

const formatDateTime = (ts) => {
  if (!ts) return "—";
  // Firestore Timestamp ou string ISO
  const date = ts?.toDate ? ts.toDate() : new Date(ts._seconds ? ts._seconds * 1000 : ts);
  return date.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function CampaignLogsModal({ open, campaignId, campaignName, baseUrl, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${baseUrl}/campaigns/${campaignId}/logs?limit=200`);
      setLogs(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Erro ao carregar logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && campaignId) fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, campaignId]);

  const sent = logs.filter((l) => l.status === "sent").length;
  const errors = logs.filter((l) => l.status === "error").length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MdEmail size={22} />
          Histórico de envios
        </Box>
        <Typography variant="body2" color="text.secondary" fontWeight={400}>
          {campaignName}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {/* Resumo */}
        {!loading && logs.length > 0 && (
          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <Chip
              icon={<span style={{ display:"flex",paddingLeft:6 }}><MdCheckCircle size={14}/></span>}
              label={`${sent} enviados`}
              color="success"
              variant="outlined"
            />
            {errors > 0 && (
              <Chip
                icon={<span style={{ display:"flex",paddingLeft:6 }}><MdCancel size={14}/></span>}
                label={`${errors} com erro`}
                color="error"
                variant="outlined"
              />
            )}
            <Box sx={{ ml: "auto" }}>
              <Button size="small" startIcon={<MdRefresh size={16} />}
                onClick={fetchLogs} disabled={loading}>
                Atualizar
              </Button>
            </Box>
          </Box>
        )}

        {loading && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {!loading && logs.length === 0 && !error && (
          <Box sx={{ textAlign: "center", py: 5 }}>
            <MdEmail size={48} color="#bdbdbd" style={{ marginBottom: 8 }} />
            <Typography color="text.secondary">
              Nenhum envio registrado para esta campanha.
            </Typography>
          </Box>
        )}

        {!loading && logs.length > 0 && (
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            {/* Header da tabela */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 180px 100px 140px",
                px: 2,
                py: 1,
                bgcolor: "grey.50",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              {["E-mail", "Participante", "Status", "Data/Hora"].map((h) => (
                <Typography key={h} variant="caption" fontWeight={700} color="text.secondary">
                  {h}
                </Typography>
              ))}
            </Box>

            {/* Linhas */}
            <Box sx={{ maxHeight: 420, overflowY: "auto" }}>
              {logs.map((log, i) => (
                <Box key={log.id || i}>
                  {i > 0 && <Divider />}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 180px 100px 140px",
                      px: 2,
                      py: 1.2,
                      alignItems: "center",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    {/* E-mail */}
                    <Typography variant="body2" noWrap sx={{ pr: 1 }}>
                      {log.email}
                    </Typography>

                    {/* Checkout ID (abreviado) */}
                    <Tooltip title={`Checkout: ${log.checkoutId}`}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        sx={{ fontFamily: "monospace" }}
                      >
                        {log.checkoutId?.slice(0, 12)}…
                      </Typography>
                    </Tooltip>

                    {/* Status */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      {log.status === "sent" ? (
                        <MdCheckCircle size={16} color="#2e7d32" />
                      ) : (
                        <MdCancel size={16} color="#c62828" />
                      )}
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color={log.status === "sent" ? "success.main" : "error.main"}
                      >
                        {log.status === "sent" ? "Enviado" : "Erro"}
                      </Typography>
                    </Box>

                    {/* Data */}
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(log.sentAt)}
                    </Typography>
                  </Box>

                  {/* Mensagem de erro, se houver */}
                  {log.status === "error" && log.errorMessage && (
                    <Box sx={{ px: 2, pb: 1 }}>
                      <Typography variant="caption" color="error.main">
                        ↳ {log.errorMessage}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
