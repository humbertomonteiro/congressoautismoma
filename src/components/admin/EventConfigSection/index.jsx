import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  MdAdd,
  MdDeleteOutline,
  MdEdit,
  MdHistory,
  MdWarning,
  MdCheckCircle,
  MdExpandMore,
  MdEventNote,
  MdConfirmationNumber,
  MdCalendarMonth,
  MdLocalOffer,
} from "react-icons/md";
import useEventConfig from "../../../data/hooks/useEventConfig";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return iso;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const formatTs = (ts) => {
  if (!ts) return "—";
  const date = ts?.toDate ? ts.toDate() : new Date(ts._seconds ? ts._seconds * 1000 : ts);
  return date.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

// Compara dois configs e retorna lista de mudanças legíveis
const diffConfig = (before, after) => {
  const changes = [];

  if (before.eventName !== after.eventName) {
    changes.push({
      field: "Nome do evento",
      from: before.eventName,
      to: after.eventName,
    });
  }

  const bd = [...(before.eventDates || [])].sort().join(", ");
  const ad = [...(after.eventDates || [])].sort().join(", ");
  if (bd !== ad) {
    changes.push({
      field: "Datas do evento",
      from: before.eventDates?.map(formatDate).join(", ") || "—",
      to: after.eventDates?.map(formatDate).join(", ") || "—",
    });
  }

  if (before.ticketPrices?.full !== after.ticketPrices?.full) {
    changes.push({
      field: "Preço inteira",
      from: `R$ ${Number(before.ticketPrices?.full).toFixed(2)}`,
      to: `R$ ${Number(after.ticketPrices?.full).toFixed(2)}`,
    });
  }

  if (before.ticketPrices?.half !== after.ticketPrices?.half) {
    changes.push({
      field: "Preço meia entrada",
      from: `R$ ${Number(before.ticketPrices?.half).toFixed(2)}`,
      to: `R$ ${Number(after.ticketPrices?.half).toFixed(2)}`,
    });
  }

  if (before.ticketPrices?.social !== after.ticketPrices?.social) {
    changes.push({
      field: "Preço social",
      from: `R$ ${Number(before.ticketPrices?.social ?? 0).toFixed(2)}`,
      to: `R$ ${Number(after.ticketPrices?.social ?? 0).toFixed(2)}`,
    });
  }

  const batchKeys = [
    { key: "full",   label: "Inteira" },
    { key: "half",   label: "Meia entrada" },
    { key: "social", label: "Social" },
  ];
  for (const { key, label } of batchKeys) {
    if (before.ticketBatches?.[key]?.label !== after.ticketBatches?.[key]?.label) {
      changes.push({
        field: `Lote — ${label}`,
        from: before.ticketBatches?.[key]?.label || "—",
        to: after.ticketBatches?.[key]?.label || "—",
      });
    }
    if (before.ticketBatches?.[key]?.availableUntil !== after.ticketBatches?.[key]?.availableUntil) {
      changes.push({
        field: `Disponibilidade — ${label}`,
        from: before.ticketBatches?.[key]?.availableUntil || "—",
        to: after.ticketBatches?.[key]?.availableUntil || "—",
      });
    }
  }

  return changes;
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function EventConfigSection() {
  const { config, loading, updateConfig, fetchAuditLog } = useEventConfig();

  // Form state (espelha o config atual ao entrar em modo edição)
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  // Confirmação
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Auditoria
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditData, setAuditData] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // ── Edição ────────────────────────────────────────────────────────────────
  const startEdit = () => {
    setForm({
      eventName: config.eventName,
      eventDates: [...config.eventDates],
      ticketPrices: { ...config.ticketPrices },
      ticketBatches: {
        full:   { ...config.ticketBatches.full },
        half:   { ...config.ticketBatches.half },
        social: { ...config.ticketBatches.social },
      },
    });
    setEditing(true);
    setSaveError("");
    setSaveSuccess(false);
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm(null);
  };

  const addDate = () => {
    setForm((prev) => ({ ...prev, eventDates: [...prev.eventDates, ""] }));
  };

  const removeDate = (i) => {
    setForm((prev) => ({
      ...prev,
      eventDates: prev.eventDates.filter((_, idx) => idx !== i),
    }));
  };

  const setDate = (i, val) => {
    setForm((prev) => {
      const dates = [...prev.eventDates];
      dates[i] = val;
      return { ...prev, eventDates: dates };
    });
  };

  // Validação client-side rápida
  const validateForm = () => {
    if (!form.eventName.trim()) return "Nome do evento é obrigatório.";
    if (form.eventDates.length === 0) return "Adicione pelo menos uma data.";
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    for (const d of form.eventDates) {
      if (!dateRe.test(d)) return `Data "${d}" inválida (use YYYY-MM-DD).`;
    }
    const { full, half, social } = form.ticketPrices;
    if (isNaN(full)   || full   < 0) return "Preço da inteira inválido.";
    if (isNaN(half)   || half   < 0) return "Preço da meia inválido.";
    if (isNaN(social) || social < 0) return "Preço do social inválido.";
    return null;
  };

  const handleSaveClick = () => {
    const err = validateForm();
    if (err) { setSaveError(err); return; }
    setSaveError("");
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await updateConfig({
        eventName: form.eventName.trim(),
        eventDates: form.eventDates.map((d) => d.trim()).filter(Boolean),
        ticketPrices: {
          full:   parseFloat(form.ticketPrices.full),
          half:   parseFloat(form.ticketPrices.half),
          social: parseFloat(form.ticketPrices.social),
        },
        ticketBatches: {
          full:   { label: form.ticketBatches.full.label.trim(),   availableUntil: form.ticketBatches.full.availableUntil.trim() },
          half:   { label: form.ticketBatches.half.label.trim(),   availableUntil: form.ticketBatches.half.availableUntil.trim() },
          social: { label: form.ticketBatches.social.label.trim(), availableUntil: form.ticketBatches.social.availableUntil.trim() },
        },
      });
      setSaveSuccess(true);
      setConfirmOpen(false);
      setEditing(false);
      setForm(null);
    } catch (err) {
      setSaveError(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  // ── Auditoria ─────────────────────────────────────────────────────────────
  const openAudit = async () => {
    setAuditOpen(true);
    setAuditLoading(true);
    try {
      const data = await fetchAuditLog();
      setAuditData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: "center" }}>
          Carregando configuração do evento…
        </Typography>
      </Box>
    );
  }

  const changes = form ? diffConfig(config, form) : [];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 700 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Configuração do Evento
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Alterações propagam em tempo real para todos os usuários conectados.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Histórico de alterações">
            <Button size="small" startIcon={<MdHistory size={16} />} variant="outlined" onClick={openAudit}>
              Histórico
            </Button>
          </Tooltip>
          {!editing && (
            <Button size="small" startIcon={<MdEdit size={16} />} variant="contained" onClick={startEdit}>
              Editar
            </Button>
          )}
        </Box>
      </Box>

      {saveSuccess && (
        <Alert severity="success" icon={<MdCheckCircle size={18} />} sx={{ mb: 2 }} onClose={() => setSaveSuccess(false)}>
          Configuração atualizada com sucesso.
        </Alert>
      )}

      {/* ── Visualização / Edição ────────────────────────────────────────── */}
      {!editing ? (
        // Modo leitura
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <ConfigCard
            icon={<MdEventNote size={20} color="#1976d2" />}
            title="Nome do evento"
            value={config.eventName}
          />
          <ConfigCard
            icon={<MdCalendarMonth size={20} color="#1976d2" />}
            title="Datas do evento"
            value={
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.5 }}>
                {config.eventDates.map((d) => (
                  <Chip key={d} label={formatDate(d)} size="small" variant="outlined" color="primary" />
                ))}
              </Box>
            }
          />
          <ConfigCard
            icon={<MdConfirmationNumber size={20} color="#1976d2" />}
            title="Preços dos ingressos"
            value={
              <Box sx={{ display: "flex", gap: 3, mt: 0.75, flexWrap: "wrap" }}>
                {[
                  { label: "Inteira",      val: config.ticketPrices.full,   color: "primary.main" },
                  { label: "Meia entrada", val: config.ticketPrices.half,   color: "secondary.main" },
                  { label: "Social",       val: config.ticketPrices.social, color: "success.main" },
                ].map(({ label, val, color }) => (
                  <Box key={label} sx={{ minWidth: 90 }}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography fontWeight={700} color={color}>
                      R$ {Number(val ?? 0).toFixed(2).replace(".", ",")}
                    </Typography>
                  </Box>
                ))}
              </Box>
            }
          />
          <ConfigCard
            icon={<MdLocalOffer size={20} color="#1976d2" />}
            title="Lotes dos ingressos"
            value={
              <Box sx={{ display: "flex", gap: 3, mt: 0.75, flexWrap: "wrap" }}>
                {[
                  { label: "Inteira",      key: "full" },
                  { label: "Meia entrada", key: "half" },
                  { label: "Social",       key: "social" },
                ].map(({ label, key }) => (
                  <Box key={key} sx={{ minWidth: 130 }}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography fontWeight={600} sx={{ fontSize: "0.9rem" }}>
                      {config.ticketBatches[key].label || "—"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Até: {config.ticketBatches[key].availableUntil || "—"}
                    </Typography>
                  </Box>
                ))}
              </Box>
            }
          />
          {config.updatedAt && (
            <Typography variant="caption" color="text.disabled">
              Última atualização: {formatTs(config.updatedAt)} — {config.updatedBy}
            </Typography>
          )}
        </Box>
      ) : (
        // Modo edição
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Nome */}
          <TextField
            label="Nome do evento *"
            value={form.eventName}
            onChange={(e) => setForm((p) => ({ ...p, eventName: e.target.value }))}
            fullWidth
            helperText="Este é o valor usado para filtrar checkouts, scanner e emails."
          />

          {/* Datas */}
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
              Datas do evento *
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {form.eventDates.map((d, i) => (
                <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <TextField
                    size="small"
                    type="date"
                    value={d}
                    onChange={(e) => setDate(i, e.target.value)}
                    sx={{ width: 180 }}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <Tooltip title="Remover esta data">
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={form.eventDates.length <= 1}
                        onClick={() => removeDate(i)}
                      >
                        <MdDeleteOutline size={18} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              ))}
              <Button
                size="small"
                startIcon={<MdAdd size={16} />}
                onClick={addDate}
                sx={{ alignSelf: "flex-start", mt: 0.5 }}
                disabled={form.eventDates.length >= 14}
              >
                Adicionar data
              </Button>
            </Box>
          </Box>

          {/* Preços */}
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
              Preços dos ingressos (R$)
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {[
                { key: "full",   label: "Inteira" },
                { key: "half",   label: "Meia entrada" },
                { key: "social", label: "Social" },
              ].map(({ key, label }) => (
                <TextField
                  key={key}
                  size="small"
                  label={label}
                  type="number"
                  value={form.ticketPrices[key] ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, ticketPrices: { ...p.ticketPrices, [key]: e.target.value } }))
                  }
                  sx={{ width: 150 }}
                  slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                />
              ))}
            </Box>
          </Box>

          {/* Lotes */}
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
              Lotes dos ingressos
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                { key: "full",   label: "Inteira" },
                { key: "half",   label: "Meia entrada" },
                { key: "social", label: "Social" },
              ].map(({ key, label }) => (
                <Box key={key}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: "block" }}>
                    {label}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                    <TextField
                      size="small"
                      label="Lote / Fase"
                      placeholder="Ex: 2° Lote, Pré-Venda…"
                      value={form.ticketBatches[key].label}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          ticketBatches: {
                            ...p.ticketBatches,
                            [key]: { ...p.ticketBatches[key], label: e.target.value },
                          },
                        }))
                      }
                      sx={{ width: 200 }}
                    />
                    <TextField
                      size="small"
                      label="Disponível até"
                      placeholder="Ex: 01/04 ou enquanto durar"
                      value={form.ticketBatches[key].availableUntil}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          ticketBatches: {
                            ...p.ticketBatches,
                            [key]: { ...p.ticketBatches[key], availableUntil: e.target.value },
                          },
                        }))
                      }
                      sx={{ width: 260 }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {saveError && <Alert severity="error">{saveError}</Alert>}

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" onClick={cancelEdit} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleSaveClick} disabled={saving}>
              Revisar e salvar
            </Button>
          </Box>
        </Box>
      )}

      {/* ── Dialog: confirmação com diff ──────────────────────────────── */}
      <Dialog open={confirmOpen} onClose={() => !saving && setConfirmOpen(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
          <MdWarning size={22} color="#d97706" />
          Confirmar alterações
        </DialogTitle>
        <DialogContent>
          {changes.length === 0 ? (
            <Alert severity="info">Nenhuma alteração detectada.</Alert>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                As seguintes alterações serão aplicadas imediatamente para <strong>todos os usuários</strong>:
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {changes.map((c, i) => (
                  <Box key={i} sx={{ p: 1.5, bgcolor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      {c.field}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5, flexWrap: "wrap" }}>
                      <Chip label={c.from} size="small" sx={{ bgcolor: "#fee2e2", color: "#dc2626", fontFamily: "monospace", fontSize: "0.72rem" }} />
                      <Typography variant="caption" color="text.secondary">→</Typography>
                      <Chip label={c.to} size="small" sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontFamily: "monospace", fontSize: "0.72rem" }} />
                    </Box>
                  </Box>
                ))}
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Esta ação ficará registrada no histórico de alterações com seu e-mail.
              </Alert>
            </Box>
          )}
          {saveError && <Alert severity="error" sx={{ mt: 1 }}>{saveError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setConfirmOpen(false)} variant="outlined" disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleConfirm}
            disabled={saving || changes.length === 0}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <MdCheckCircle size={16} />}
            sx={{ fontWeight: 700 }}
          >
            {saving ? "Salvando…" : "Confirmar alterações"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: histórico de auditoria ───────────────────────────── */}
      <Dialog open={auditOpen} onClose={() => setAuditOpen(false)} maxWidth="md" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Histórico de alterações</DialogTitle>
        <DialogContent dividers>
          {auditLoading ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : auditData.length === 0 ? (
            <Typography color="text.secondary">Nenhuma alteração registrada.</Typography>
          ) : (
            auditData.map((entry, i) => {
              const changes = entry.before ? diffConfig(entry.before, entry.after) : [];
              return (
                <Accordion key={i} disableGutters sx={{ mb: 1, boxShadow: "none", border: "1px solid", borderColor: "divider", borderRadius: "8px !important" }}>
                  <AccordionSummary expandIcon={<MdExpandMore size={18} />}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {formatTs(entry.changedAt)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        por {entry.changedBy} · {changes.length} campo{changes.length !== 1 ? "s" : ""} alterado{changes.length !== 1 ? "s" : ""}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {changes.length === 0 ? (
                      <Typography variant="caption" color="text.secondary">Sem diff disponível.</Typography>
                    ) : (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                        {changes.map((c, j) => (
                          <Box key={j} sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                            <Typography variant="caption" fontWeight={700} sx={{ minWidth: 150 }}>{c.field}</Typography>
                            <Chip label={c.from} size="small" sx={{ bgcolor: "#fee2e2", color: "#dc2626", fontSize: "0.68rem" }} />
                            <Typography variant="caption">→</Typography>
                            <Chip label={c.to} size="small" sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontSize: "0.68rem" }} />
                          </Box>
                        ))}
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAuditOpen(false)} variant="outlined">Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Sub-componente: card de informação ────────────────────────────────────────
function ConfigCard({ icon, title, value }) {
  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "#fafafa",
        display: "flex",
        gap: 1.5,
        alignItems: "flex-start",
      }}
    >
      <Box sx={{ mt: 0.3, flexShrink: 0 }}>{icon}</Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
          {title}
        </Typography>
        {typeof value === "string" ? (
          <Typography fontWeight={600} sx={{ mt: 0.25 }}>{value}</Typography>
        ) : (
          value
        )}
      </Box>
    </Box>
  );
}
