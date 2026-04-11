import React, { useState, useEffect, useRef, useCallback } from "react";
import Reader from "react-qr-scanner";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  Typography,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Alert,
  Tooltip,
  LinearProgress,
  Avatar,
} from "@mui/material";
import {
  MdCheckCircle,
  MdCancel,
  MdWarning,
  MdWifiOff,
  MdWifi,
  MdSync,
  MdFlipCameraAndroid,
  MdQrCodeScanner,
  MdManageSearch,
  MdHistory,
  MdAccessTime,
} from "react-icons/md";
import { db } from "../../../../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import ManualAuth from "./ManualAuth";
import styles from "./scanner.module.css";

// ── Configuração ─────────────────────────────────────────────────────────────
const BASE_URL =
  import.meta.env.VITE_ENV === "sandbox"
    ? import.meta.env.VITE_BASE_URL_SANDBOX
    : import.meta.env.VITE_BASE_URL_PRODUCTION;

const EVENT_DATES = ["2026-05-16", "2026-05-17"];
const CACHE_KEY = "scanner_participants_v2";
const PENDING_KEY = "scanner_pending_checkins";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const weekday = weekdays[new Date(`${iso}T12:00:00`).getDay()];
  return `${d}/${m}/${y} (${weekday})`;
};

const buildQrDataForDate = (qrToken, date) => {
  try {
    const obj = JSON.parse(qrToken);
    return JSON.stringify({ ...obj, date });
  } catch {
    return null;
  }
};

// ── Cache helpers ─────────────────────────────────────────────────────────────
const loadCacheFromStorage = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, cachedAt } = JSON.parse(raw);
    if (Date.now() - cachedAt > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
};

const saveCacheToStorage = (data) => {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, cachedAt: Date.now() })
    );
  } catch {
    // localStorage cheio — ignora
  }
};

const loadPendingFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
  } catch {
    return [];
  }
};

const savePendingToStorage = (arr) => {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(arr));
  } catch {}
};

// ── Validação offline ────────────────────────────────────────────────────────
const validateOffline = (qrData, participantsCache) => {
  let parsed;
  try {
    parsed = JSON.parse(qrData);
  } catch {
    return {
      type: "error",
      message: "QR Code com formato inválido.",
    };
  }

  const { checkoutId, participantId, date, signature } = parsed;

  if (!checkoutId || !participantId || !date || !signature) {
    return { type: "error", message: "QR Code incompleto." };
  }

  if (!EVENT_DATES.includes(date)) {
    return {
      type: "error",
      message: `Data ${date} não é válida para este evento.`,
    };
  }

  const participant = participantsCache.find(
    (p) => p.checkoutId === checkoutId && p.participantId === participantId
  );

  if (!participant) {
    return {
      type: "error",
      message:
        "Participante não encontrado no cache. Sincronize quando tiver internet.",
    };
  }

  if (!participant.qrToken) {
    return {
      type: "error",
      message: "Participante sem QR Code cadastrado.",
    };
  }

  let cachedToken;
  try {
    cachedToken = JSON.parse(participant.qrToken);
  } catch {
    return { type: "error", message: "QR Token inválido no cache." };
  }

  if (cachedToken.signature !== signature) {
    return {
      type: "error",
      message: "QR Code com assinatura inválida.",
    };
  }

  const checkedInDates = participant.checkedInDates || {};
  if (checkedInDates[date]) {
    return {
      type: "already",
      name: participant.name,
      date,
      message: `Participante já credenciado em ${formatDate(date)}.`,
      checkedInAt: checkedInDates[date],
    };
  }

  return {
    type: "success",
    name: participant.name,
    date,
    message: `Credenciado com sucesso (offline) para ${formatDate(date)}.`,
    checkoutId,
    participantId,
  };
};

// ── Componente Principal ──────────────────────────────────────────────────────
const Scanner = () => {
  // Rede
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Cache de participantes
  const [participantsCache, setParticipantsCache] = useState(
    () => loadCacheFromStorage() || []
  );
  const [cacheLoading, setCacheLoading] = useState(false);
  const [cacheTime, setCacheTime] = useState(null);

  // Pendentes para sincronização offline
  const [pendingSync, setPendingSync] = useState(() =>
    loadPendingFromStorage()
  );
  const [syncing, setSyncing] = useState(false);

  // Scanner
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Resultado
  const [resultDialog, setResultDialog] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);

  // Abas
  const [activeTab, setActiveTab] = useState(0);

  // Previne duplo scan
  const processingRef = useRef(false);

  // ── Eventos de rede ──────────────────────────────────────────────────────
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Auto-sync ao voltar online
  useEffect(() => {
    if (isOnline && pendingSync.length > 0) {
      syncPendingCheckins();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // ── Câmeras ───────────────────────────────────────────────────────────────
  useEffect(() => {
    navigator.mediaDevices
      ?.enumerateDevices()
      .then((devices) => {
        setHasMultipleCameras(
          devices.filter((d) => d.kind === "videoinput").length > 1
        );
      })
      .catch(() => {});
  }, []);

  // ── Carregar cache de participantes ───────────────────────────────────────
  const loadParticipants = useCallback(async () => {
    if (!isOnline) return;
    setCacheLoading(true);
    try {
      // 1. Buscar checkouts aprovados
      const checkoutsSnap = await getDocs(
        query(collection(db, "checkouts"), where("status", "==", "approved"))
      );

      // 2. Carregar participantes de cada checkout em paralelo
      const participantPromises = checkoutsSnap.docs.map(async (checkoutDoc) => {
        const snap = await getDocs(
          collection(db, "checkouts", checkoutDoc.id, "participants")
        );
        return snap.docs.map((d) => ({
          participantId: d.id,
          checkoutId: checkoutDoc.id,
          ...d.data(),
        }));
      });

      const results = await Promise.all(participantPromises);
      const allParticipants = results.flat();

      setParticipantsCache(allParticipants);
      saveCacheToStorage(allParticipants);
      setCacheTime(new Date());
    } catch (err) {
      console.error("[Scanner] Erro ao carregar cache:", err);
    } finally {
      setCacheLoading(false);
    }
  }, [isOnline]);

  // Carrega cache na montagem
  useEffect(() => {
    const cached = loadCacheFromStorage();
    if (cached && cached.length > 0) {
      setParticipantsCache(cached);
      // Atualiza em background se online
      if (navigator.onLine) setTimeout(() => loadParticipants(), 1500);
    } else if (navigator.onLine) {
      loadParticipants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sincronizar check-ins offline ─────────────────────────────────────────
  const syncPendingCheckins = async () => {
    const pending = loadPendingFromStorage();
    if (!pending.length || syncing) return;

    setSyncing(true);
    const remaining = [];

    for (const item of pending) {
      try {
        await axios.post(
          `${BASE_URL}/credentials/validate-qr-code`,
          { qrData: item.qrData },
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (err) {
        const msg = err.response?.data?.message || "";
        // "já fez check-in" é aceitável — não retentar
        if (!msg.includes("já fez check-in")) {
          remaining.push(item);
        }
      }
    }

    setPendingSync(remaining);
    savePendingToStorage(remaining);
    setSyncing(false);

    // Recarregar cache após sync
    if (remaining.length < pending.length) {
      loadParticipants();
    }
  };

  // ── Atualizar cache local após check-in ──────────────────────────────────
  const updateCacheCheckin = useCallback(
    (checkoutId, participantId, date) => {
      const now = new Date().toISOString();
      setParticipantsCache((prev) => {
        const updated = prev.map((p) =>
          p.checkoutId === checkoutId && p.participantId === participantId
            ? {
                ...p,
                checkedIn: true,
                checkedInDates: { ...(p.checkedInDates || {}), [date]: now },
              }
            : p
        );
        saveCacheToStorage(updated);
        return updated;
      });
    },
    []
  );

  // ── Processar scan ────────────────────────────────────────────────────────
  const handleScan = async (data) => {
    if (!data?.text || processingRef.current || isValidating) return;

    processingRef.current = true;
    const qrText = data.text;
    setIsValidating(true);
    setIsScanning(false);

    const startTime = Date.now();
    let result;

    try {
      let parsed;
      try {
        parsed = JSON.parse(qrText);
      } catch {
        result = {
          type: "error",
          message: "Formato de QR Code inválido.",
        };
        return;
      }

      if (!isOnline) {
        // Validação offline
        const offlineResult = validateOffline(qrText, participantsCache);
        if (offlineResult.type === "success") {
          // Marca no cache e enfileira para sync
          updateCacheCheckin(
            offlineResult.checkoutId,
            offlineResult.participantId,
            offlineResult.date
          );
          const pending = loadPendingFromStorage();
          pending.push({ qrData: qrText, queuedAt: new Date().toISOString() });
          savePendingToStorage(pending);
          setPendingSync(pending);
        }
        result = offlineResult;
      } else {
        // Validação online
        try {
          const response = await axios.post(
            `${BASE_URL}/credentials/validate-qr-code`,
            { qrData: qrText },
            { headers: { "Content-Type": "application/json" } }
          );

          const serviceResult = response.data.data || {};
          const participantName =
            serviceResult.participant?.name || parsed.participantName;

          if (serviceResult.isValid) {
            updateCacheCheckin(
              parsed.checkoutId,
              parsed.participantId,
              parsed.date
            );
            result = {
              type: "success",
              name: participantName,
              date: parsed.date,
              message: serviceResult.message || "Credenciado com sucesso!",
            };
          } else if (serviceResult.alreadyCheckedIn) {
            result = {
              type: "already",
              name: participantName,
              date: parsed.date,
              message:
                serviceResult.message || "Participante já credenciado.",
            };
          } else {
            result = {
              type: "error",
              name: participantName,
              message:
                serviceResult.message || response.data.message || "QR Code inválido.",
            };
          }
        } catch (err) {
          const msg =
            err.response?.data?.message || err.message || "Erro desconhecido";
          if (msg.includes("já fez check-in")) {
            result = {
              type: "already",
              name: parsed.participantName,
              date: parsed.date,
              message: msg,
            };
          } else {
            result = {
              type: "error",
              name: parsed.participantName,
              message: msg,
            };
          }
        }
      }
    } finally {
      // Garantir mínimo de 800ms de feedback visual
      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        await new Promise((r) => setTimeout(r, 800 - elapsed));
      }

      const finalResult = result || {
        type: "error",
        message: "Erro desconhecido.",
      };
      setIsValidating(false);
      setResultDialog(finalResult);
      addToHistory(finalResult);
      processingRef.current = false;
    }
  };

  const handleError = () => {
    setIsScanning(false);
    processingRef.current = false;
  };

  const addToHistory = (result) => {
    setScanHistory((prev) => [
      { ...result, timestamp: new Date(), id: Date.now() },
      ...prev.slice(0, 49),
    ]);
  };

  const handleScanAgain = () => {
    setResultDialog(null);
    setIsScanning(true);
  };

  const handleToggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    setIsScanning(false);
    setTimeout(() => setIsScanning(true), 150);
  };

  // ── Dialog de resultado ───────────────────────────────────────────────────
  const renderResultDialog = () => {
    if (!resultDialog) return null;

    const { type, name, date, message, checkedInAt } = resultDialog;

    const config = {
      success: {
        icon: (
          <MdCheckCircle size={80} color="#2e7d32" style={{ marginBottom: 8 }} />
        ),
        title: "CREDENCIADO",
        titleColor: "#2e7d32",
        bgColor: "#f1f8e9",
        borderColor: "#4caf50",
        btnColor: "success",
        btnLabel: "Próximo",
      },
      already: {
        icon: (
          <MdWarning size={80} color="#e65100" style={{ marginBottom: 8 }} />
        ),
        title: "JÁ CREDENCIADO",
        titleColor: "#e65100",
        bgColor: "#fff8e1",
        borderColor: "#ff9800",
        btnColor: "warning",
        btnLabel: "Fechar",
      },
      error: {
        icon: <MdCancel size={80} color="#c62828" style={{ marginBottom: 8 }} />,
        title: "RECUSADO",
        titleColor: "#c62828",
        bgColor: "#ffebee",
        borderColor: "#f44336",
        btnColor: "error",
        btnLabel: "Tentar novamente",
      },
    }[type] || {
      icon: null,
      title: "RESULTADO",
      titleColor: "#000",
      bgColor: "#fff",
      borderColor: "#ccc",
      btnColor: "primary",
      btnLabel: "Fechar",
    };

    return (
      <Dialog
        open={true}
        onClose={handleScanAgain}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderTop: `6px solid ${config.borderColor}`,
            borderRadius: 3,
          },
        }}
      >
        <DialogContent
          sx={{
            textAlign: "center",
            py: 4,
            px: 3,
            bgcolor: config.bgColor,
          }}
        >
          {config.icon}
          <Typography
            variant="h4"
            fontWeight={900}
            color={config.titleColor}
            sx={{ letterSpacing: 1, mb: 2 }}
          >
            {config.title}
          </Typography>

          {name && (
            <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
              {name}
            </Typography>
          )}

          {date && (
            <Chip
              label={formatDate(date)}
              sx={{
                mb: 2,
                fontWeight: 700,
                bgcolor: config.borderColor,
                color: "#fff",
                fontSize: "0.85rem",
              }}
            />
          )}

          {type === "already" && checkedInAt && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.5,
                mt: 1,
              }}
            >
              <MdAccessTime size={16} color="#ff9800" />
              <Typography variant="body2" color="text.secondary">
                Registrado em{" "}
                {new Date(checkedInAt).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </Typography>
            </Box>
          )}

          {(type === "error" || type === "already") && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1.5, px: 1 }}
            >
              {message}
            </Typography>
          )}

          {!isOnline && type === "success" && (
            <Chip
              icon={<span style={{ display: "flex", paddingLeft: 8 }}><MdWifiOff size={14} /></span>}
              label="Validado offline · sincronizará quando tiver internet"
              size="small"
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: "center",
            pb: 3,
            bgcolor: config.bgColor,
          }}
        >
          <Button
            variant="contained"
            color={config.btnColor}
            onClick={handleScanAgain}
            size="large"
            sx={{ px: 5, py: 1.5, fontWeight: 700, borderRadius: 2 }}
          >
            {config.btnLabel}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box className={styles.container}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography variant="h5" fontWeight={700} color="text.primary">
          Credenciamento
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {pendingSync.length > 0 && (
            <Tooltip
              title={
                isOnline
                  ? "Clique para sincronizar check-ins offline"
                  : "Aguardando conexão para sincronizar"
              }
            >
              <Chip
                icon={
                  syncing ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <span style={{ display: "flex", paddingLeft: 8 }}><MdSync size={14} /></span>
                  )
                }
                label={`${pendingSync.length} pendente${pendingSync.length > 1 ? "s" : ""}`}
                color="warning"
                size="small"
                onClick={isOnline ? syncPendingCheckins : undefined}
                sx={{ cursor: isOnline ? "pointer" : "default" }}
              />
            </Tooltip>
          )}

          <Chip
            icon={<span style={{ display: "flex", paddingLeft: 8 }}>{isOnline ? <MdWifi size={14} /> : <MdWifiOff size={14} />}</span>}
            label={isOnline ? "Online" : "Offline"}
            color={isOnline ? "success" : "default"}
            size="small"
            variant="outlined"
          />

          <Tooltip
            title={
              isOnline
                ? `Atualizar cache de participantes${cacheTime ? ` · última sync: ${cacheTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}`
                : "Sem internet — cache não pode ser atualizado"
            }
          >
            <span>
              <IconButton
                size="small"
                onClick={loadParticipants}
                disabled={!isOnline || cacheLoading}
              >
                {cacheLoading ? (
                  <CircularProgress size={18} />
                ) : (
                  <MdSync size={18} />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Status do cache */}
      {cacheLoading && <LinearProgress sx={{ mb: 1.5, borderRadius: 1 }} />}

      {participantsCache.length > 0 ? (
        <Alert
          severity={isOnline ? "info" : "warning"}
          icon={isOnline ? <MdWifi size={18} /> : <MdWifiOff size={18} />}
          sx={{ mb: 2, py: 0.5 }}
        >
          {participantsCache.length} participantes carregados
          {!isOnline && " — modo offline ativo"}
          {cacheTime &&
            ` · sync ${cacheTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
        </Alert>
      ) : !isOnline ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>Sem internet e sem cache.</strong> Conecte-se à internet
          para carregar os participantes e permitir uso offline.
        </Alert>
      ) : null}

      {/* Abas */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab
          icon={<MdQrCodeScanner size={18} />}
          label="Scanner QR"
          iconPosition="start"
          sx={{ minHeight: 48 }}
        />
        <Tab
          icon={<MdManageSearch size={18} />}
          label="Busca Manual"
          iconPosition="start"
          sx={{ minHeight: 48 }}
        />
        <Tab
          icon={<MdHistory size={18} />}
          label={
            scanHistory.length > 0
              ? `Histórico (${scanHistory.length})`
              : "Histórico"
          }
          iconPosition="start"
          sx={{ minHeight: 48 }}
        />
      </Tabs>

      {/* Aba 0: Scanner de QR */}
      {activeTab === 0 && (
        <Card
          sx={{
            p: 3,
            borderRadius: 3,
            boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
          }}
        >
          {isValidating ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <CircularProgress size={56} thickness={4} />
              <Typography
                variant="h6"
                mt={2.5}
                color="text.secondary"
                fontWeight={500}
              >
                Validando QR Code...
              </Typography>
            </Box>
          ) : !isScanning ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <MdQrCodeScanner size={72} color="#bdbdbd" style={{ marginBottom: 16 }} />
              <Typography variant="body1" color="text.secondary" mb={3}>
                Aponte a câmera para o QR Code do ingresso
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => setIsScanning(true)}
                sx={{
                  px: 5,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: "1rem",
                }}
              >
                Iniciar Scanner
              </Button>
            </Box>
          ) : (
            <Box>
              {/* Viewfinder */}
              <Box
                sx={{
                  position: "relative",
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "3px solid",
                  borderColor: "primary.main",
                  maxWidth: 440,
                  mx: "auto",
                  boxShadow: "0 0 0 4px rgba(25,118,210,0.15)",
                }}
              >
                <Reader
                  delay={600}
                  onScan={handleScan}
                  onError={handleError}
                  constraints={{
                    video: {
                      facingMode,
                      width: { ideal: 1280 },
                      height: { ideal: 720 },
                    },
                  }}
                  style={{ width: "100%", display: "block" }}
                />
                {/* Mira central */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 180,
                      height: 180,
                      border: "2px solid rgba(255,255,255,0.8)",
                      borderRadius: 2,
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.3)",
                    }}
                  />
                </Box>
              </Box>

              {/* Botões de controle */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  mt: 2.5,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setIsScanning(false)}
                  sx={{ borderRadius: 2, px: 3 }}
                >
                  Parar
                </Button>
                {hasMultipleCameras && (
                  <Button
                    variant="outlined"
                    startIcon={<MdFlipCameraAndroid size={18} />}
                    onClick={handleToggleCamera}
                    sx={{ borderRadius: 2, px: 3 }}
                  >
                    Virar câmera
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Card>
      )}

      {/* Aba 1: Busca Manual */}
      {activeTab === 1 && (
        <ManualAuth
          participantsCache={participantsCache}
          isOnline={isOnline}
          eventDates={EVENT_DATES}
          baseUrl={BASE_URL}
          onValidationResult={(result) => {
            setResultDialog(result);
            addToHistory(result);
          }}
          onUpdateCache={updateCacheCheckin}
          onQueueOffline={(qrData) => {
            const pending = loadPendingFromStorage();
            pending.push({
              qrData,
              queuedAt: new Date().toISOString(),
            });
            savePendingToStorage(pending);
            setPendingSync(pending);
          }}
        />
      )}

      {/* Aba 2: Histórico */}
      {activeTab === 2 && (
        <Card
          sx={{ borderRadius: 3, boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}
        >
          {scanHistory.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <MdHistory size={56} color="#bdbdbd" style={{ marginBottom: 8 }} />
              <Typography color="text.secondary">
                Nenhum scan realizado nesta sessão
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {scanHistory.map((entry, i) => (
                <React.Fragment key={entry.id}>
                  {i > 0 && <Divider />}
                  <ListItem sx={{ py: 1.5 }}>
                    <Avatar
                      sx={{
                        bgcolor:
                          entry.type === "success"
                            ? "success.main"
                            : entry.type === "already"
                            ? "warning.main"
                            : "error.main",
                        mr: 2,
                        width: 36,
                        height: 36,
                      }}
                    >
                      {entry.type === "success" ? (
                        <MdCheckCircle size={18} />
                      ) : entry.type === "already" ? (
                        <MdWarning size={18} />
                      ) : (
                        <MdCancel size={18} />
                      )}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Typography variant="body1" fontWeight={600}>
                          {entry.name ||
                            (entry.type === "error"
                              ? "Erro de validação"
                              : "Desconhecido")}
                        </Typography>
                      }
                      secondary={
                        <Box
                          component="span"
                          sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}
                        >
                          {entry.date && (
                            <span>{formatDate(entry.date)}</span>
                          )}
                          <span>
                            {entry.timestamp.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                          {entry.type === "error" && (
                            <Typography
                              component="span"
                              variant="caption"
                              color="error"
                            >
                              {entry.message}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <Chip
                      label={
                        entry.type === "success"
                          ? "OK"
                          : entry.type === "already"
                          ? "Duplicado"
                          : "Erro"
                      }
                      color={
                        entry.type === "success"
                          ? "success"
                          : entry.type === "already"
                          ? "warning"
                          : "error"
                      }
                      size="small"
                      variant="outlined"
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </Card>
      )}

      {/* Dialog de resultado */}
      {renderResultDialog()}
    </Box>
  );
};

export default Scanner;
