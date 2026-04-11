import { useState, Fragment } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  InputAdornment,
  Alert,
  CircularProgress,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  MdSearch,
  MdPerson,
  MdBadge,
  MdCheckCircle,
  MdWarning,
} from "react-icons/md";

const formatDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const weekday = weekdays[new Date(`${iso}T12:00:00`).getDay()];
  return `${d}/${m}/${y} (${weekday})`;
};

const formatCpf = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const buildQrDataForDate = (qrToken, date) => {
  try {
    const obj = JSON.parse(qrToken);
    return JSON.stringify({ ...obj, date });
  } catch {
    return null;
  }
};

/**
 * ManualAuth — busca participante por CPF ou nome e credencia manualmente.
 *
 * Props:
 *   participantsCache: array de participantes carregados do Firestore
 *   isOnline: boolean
 *   eventDates: string[] — datas do evento (ex: ["2026-05-16","2026-05-17"])
 *   baseUrl: string — URL base da API
 *   onValidationResult: (result) => void
 *   onUpdateCache: (checkoutId, participantId, date) => void
 *   onQueueOffline: (qrData) => void
 */
const ManualAuth = ({
  participantsCache = [],
  isOnline,
  eventDates = [],
  baseUrl,
  onValidationResult,
  onUpdateCache,
  onQueueOffline,
}) => {
  const [searchMode, setSearchMode] = useState("cpf"); // "cpf" | "name"
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Participante selecionado para credenciar
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  // Dialog de confirmação
  const [confirmDialog, setConfirmDialog] = useState(null); // { date, qrData, participantName }

  // Resultados da busca (pode ter mais de um)
  const [searchResults, setSearchResults] = useState([]);

  // ── Busca ─────────────────────────────────────────────────────────────────
  const handleSearch = () => {
    setError("");
        setSelectedParticipant(null);
    setSearchResults([]);

    const raw = searchValue.trim();
    if (!raw) {
      setError("Digite um CPF ou nome para buscar.");
      return;
    }

    if (participantsCache.length === 0) {
      setError(
        isOnline
          ? "Cache de participantes ainda carregando. Aguarde."
          : "Sem cache disponível. Conecte-se à internet e recarregue."
      );
      return;
    }

    if (searchMode === "cpf") {
      const digits = raw.replace(/\D/g, "");
      if (digits.length !== 11) {
        setError("CPF inválido — informe os 11 dígitos.");
        return;
      }
      const found = participantsCache.filter((p) => {
        const pDoc = (p.document || p.cpf || "").replace(/\D/g, "");
        return pDoc === digits;
      });
      setSearchResults(found);
      if (found.length === 0) {
        setError("Nenhum participante encontrado com esse CPF.");
      } else if (found.length === 1) {
        setSelectedParticipant(found[0]);
      }
    } else {
      // Busca por nome — contém, case-insensitive
      const needle = raw.toLowerCase().trim();
      if (needle.length < 3) {
        setError("Digite pelo menos 3 letras para buscar por nome.");
        return;
      }
      const found = participantsCache.filter((p) =>
        (p.name || "").toLowerCase().includes(needle)
      );
      setSearchResults(found);
      if (found.length === 0) {
        setError("Nenhum participante encontrado com esse nome.");
      } else if (found.length === 1) {
        setSelectedParticipant(found[0]);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // ── Confirmar credenciamento ──────────────────────────────────────────────
  const handleCredenciarClick = (participant, date) => {
    if (!participant.qrToken) {
      onValidationResult({
        type: "error",
        name: participant.name,
        message: "Participante sem QR Code gerado. Verifique o cadastro.",
      });
      return;
    }
    const qrData = buildQrDataForDate(participant.qrToken, date);
    if (!qrData) {
      onValidationResult({
        type: "error",
        name: participant.name,
        message: "Erro ao montar dados do QR Code.",
      });
      return;
    }
    setConfirmDialog({
      date,
      qrData,
      participant,
    });
  };

  const handleConfirmCredenciamento = async () => {
    const { date, qrData, participant } = confirmDialog;
    setConfirmDialog(null);
    setLoading(true);

    try {
      if (!isOnline) {
        // Offline: valida localmente
        const checkedInDates = participant.checkedInDates || {};
        if (checkedInDates[date]) {
          onValidationResult({
            type: "already",
            name: participant.name,
            date,
            message: `Participante já credenciado em ${formatDate(date)}.`,
            checkedInAt: checkedInDates[date],
          });
          return;
        }
        onUpdateCache(participant.checkoutId, participant.participantId, date);
        onQueueOffline(qrData);
        onValidationResult({
          type: "success",
          name: participant.name,
          date,
          message: `Credenciado com sucesso (offline) para ${formatDate(date)}.`,
        });
        // Atualiza selecionado localmente para refletir novo estado
        setSelectedParticipant((prev) =>
          prev?.participantId === participant.participantId
            ? {
                ...prev,
                checkedInDates: {
                  ...(prev.checkedInDates || {}),
                  [date]: new Date().toISOString(),
                },
              }
            : prev
        );
        return;
      }

      // Online: chama backend
      const response = await axios.post(
        `${baseUrl}/credentials/validate-qr-code`,
        { qrData },
        { headers: { "Content-Type": "application/json" } }
      );

      const serviceResult = response.data.data || {};
      const participantName =
        serviceResult.participant?.name || participant.name;

      if (serviceResult.isValid) {
        onUpdateCache(participant.checkoutId, participant.participantId, date);
        onValidationResult({
          type: "success",
          name: participantName,
          date,
          message: serviceResult.message || "Credenciado com sucesso!",
        });
        setSelectedParticipant((prev) =>
          prev?.participantId === participant.participantId
            ? {
                ...prev,
                checkedInDates: {
                  ...(prev.checkedInDates || {}),
                  [date]: new Date().toISOString(),
                },
              }
            : prev
        );
      } else if (serviceResult.alreadyCheckedIn) {
        onValidationResult({
          type: "already",
          name: participantName,
          date,
          message: serviceResult.message || "Participante já credenciado.",
        });
      } else {
        onValidationResult({
          type: "error",
          name: participantName,
          message:
            serviceResult.message ||
            response.data.message ||
            "Erro na validação.",
        });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Erro desconhecido";
      if (msg.includes("já fez check-in")) {
        onValidationResult({
          type: "already",
          name: participant.name,
          date,
          message: msg,
        });
      } else {
        onValidationResult({
          type: "error",
          name: participant.name,
          message: msg,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Status por data ───────────────────────────────────────────────────────
  const getDateStatus = (participant, date) => {
    const checkedInDates = participant.checkedInDates || {};
    return checkedInDates[date]
      ? { checkedIn: true, at: checkedInDates[date] }
      : { checkedIn: false };
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* Card de busca */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
          mb: 2,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Buscar Participante
          </Typography>

          {/* Toggle CPF / Nome */}
          <ToggleButtonGroup
            value={searchMode}
            exclusive
            onChange={(_, val) => {
              if (val) {
                setSearchMode(val);
                setSearchValue("");
                setSearchResults([]);
                setSelectedParticipant(null);
                setError("");
                              }
            }}
            size="small"
            sx={{ mb: 2 }}
          >
            <ToggleButton value="cpf" sx={{ px: 2 }}>
              <MdBadge size={16} style={{ marginRight: 4 }} />
              CPF
            </ToggleButton>
            <ToggleButton value="name" sx={{ px: 2 }}>
              <MdPerson size={16} style={{ marginRight: 4 }} />
              Nome
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Input de busca */}
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <TextField
              value={searchValue}
              onChange={(e) => {
                const val = e.target.value;
                setSearchValue(
                  searchMode === "cpf" ? formatCpf(val) : val
                );
                setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                searchMode === "cpf"
                  ? "000.000.000-00"
                  : "Digite parte do nome..."
              }
              label={searchMode === "cpf" ? "CPF do participante" : "Nome do participante"}
              variant="outlined"
              size="medium"
              sx={{ flex: 1, minWidth: 220 }}
              disabled={loading}
              slotProps={{
                htmlInput: { maxLength: searchMode === "cpf" ? 14 : 100 },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      {searchMode === "cpf" ? (
                        <MdBadge size={18} color="#9e9e9e" />
                      ) : (
                        <MdPerson size={18} color="#9e9e9e" />
                      )}
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading || !searchValue.trim()}
              startIcon={
                loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <MdSearch size={18} />
                )
              }
              sx={{ height: 56, px: 3, borderRadius: 2, fontWeight: 700 }}
            >
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </Box>

          {/* Erro */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Múltiplos resultados */}
      {searchResults.length > 1 && !selectedParticipant && (
        <Card
          sx={{ borderRadius: 3, boxShadow: "0 2px 16px rgba(0,0,0,0.07)", mb: 2 }}
        >
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              {searchResults.length} participantes encontrados — selecione um:
            </Typography>
            <List disablePadding>
              {searchResults.map((p, i) => (
                <Fragment key={`${p.checkoutId}-${p.participantId}`}>
                  {i > 0 && <Divider />}
                  <ListItem
                    button
                    onClick={() => setSelectedParticipant(p)}
                    sx={{
                      borderRadius: 1,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Avatar sx={{ bgcolor: "primary.main", mr: 2, width: 36, height: 36 }}>
                      <MdPerson size={18} />
                    </Avatar>
                    <ListItemText
                      primary={
                        <Typography fontWeight={600}>{p.name}</Typography>
                      }
                      secondary={
                        <Box component="span">
                          {(p.document || p.cpf) && (
                            <span>
                              CPF:{" "}
                              {(p.document || p.cpf).replace(
                                /(\d{3})(\d{3})(\d{3})(\d{2})/,
                                "$1.$2.$3-$4"
                              )}{" "}
                              ·{" "}
                            </span>
                          )}
                          <span>{p.email || ""}</span>
                        </Box>
                      }
                    />
                    <Chip
                      label={
                        p.ticketType === "half"
                          ? "Meia"
                          : p.ticketType === "social"
                          ? "Social"
                          : "Inteira"
                      }
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </ListItem>
                </Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Participante selecionado */}
      {selectedParticipant && (
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
            border: "2px solid",
            borderColor: "primary.main",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            {/* Cabeçalho do participante */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Avatar
                sx={{ bgcolor: "primary.main", width: 48, height: 48 }}
              >
                <MdPerson size={24} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={700}>
                  {selectedParticipant.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedParticipant.email || "E-mail não informado"}
                </Typography>
              </Box>
              <Chip
                label={
                  selectedParticipant.ticketType === "half"
                    ? "Meia entrada"
                    : selectedParticipant.ticketType === "social"
                    ? "Social"
                    : "Inteira"
                }
                color="primary"
                size="small"
              />
            </Box>

            {(selectedParticipant.document || selectedParticipant.cpf) && (
              <Typography variant="body2" color="text.secondary" mb={2}>
                CPF:{" "}
                {(
                  selectedParticipant.document || selectedParticipant.cpf
                ).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
              </Typography>
            )}

            <Divider sx={{ mb: 2 }} />

            {/* Botões por data */}
            <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
              Credenciar para:
            </Typography>

            {eventDates.length === 0 ? (
              <Alert severity="warning">
                Nenhuma data de evento configurada.
              </Alert>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {eventDates.map((date) => {
                  const status = getDateStatus(selectedParticipant, date);
                  return (
                    <Box
                      key={date}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: status.checkedIn
                          ? "success.50"
                          : "grey.50",
                        border: "1px solid",
                        borderColor: status.checkedIn
                          ? "success.200"
                          : "grey.200",
                        gap: 2,
                        flexWrap: "wrap",
                      }}
                    >
                      <Box>
                        <Typography fontWeight={600} variant="body2">
                          {formatDate(date)}
                        </Typography>
                        {status.checkedIn && (
                          <Typography
                            variant="caption"
                            color="success.main"
                            sx={{ display: "flex", alignItems: "center", gap: 0.3 }}
                          >
                            <MdCheckCircle size={12} />
                            Credenciado em{" "}
                            {new Date(status.at).toLocaleString("pt-BR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </Typography>
                        )}
                      </Box>

                      {status.checkedIn ? (
                        <Chip
                          icon={<span style={{ display: "flex", paddingLeft: 8 }}><MdCheckCircle size={14} /></span>}
                          label="Já credenciado"
                          color="success"
                          size="small"
                        />
                      ) : !selectedParticipant.qrToken ? (
                        <Chip
                          icon={<span style={{ display: "flex", paddingLeft: 8 }}><MdWarning size={14} /></span>}
                          label="Sem QR Code"
                          color="warning"
                          size="small"
                        />
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() =>
                            handleCredenciarClick(selectedParticipant, date)
                          }
                          disabled={loading}
                          sx={{ borderRadius: 2, fontWeight: 700, px: 2 }}
                        >
                          Credenciar
                        </Button>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}

            {/* Botão voltar para resultados */}
            {searchResults.length > 1 && (
              <Button
                variant="text"
                size="small"
                onClick={() => setSelectedParticipant(null)}
                sx={{ mt: 2 }}
              >
                ← Voltar para resultados
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmação */}
      {confirmDialog && (
        <Dialog
          open={true}
          onClose={() => setConfirmDialog(null)}
          maxWidth="xs"
          fullWidth
          slotProps={{ paper: { sx: { borderRadius: 3 } } }}
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Confirmar Credenciamento
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              Credenciar{" "}
              <strong>{confirmDialog.participant.name}</strong> para{" "}
              <strong>{formatDate(confirmDialog.date)}</strong>?
            </Typography>
            {!isOnline && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Você está offline. O credenciamento será registrado localmente
                e sincronizado quando houver internet.
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button
              onClick={() => setConfirmDialog(null)}
              variant="outlined"
              color="inherit"
              sx={{ borderRadius: 2 }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmCredenciamento}
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              {loading ? "Processando..." : "Confirmar"}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default ManualAuth;
