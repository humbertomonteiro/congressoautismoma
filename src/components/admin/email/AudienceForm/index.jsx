import { useState, useEffect, useRef } from "react";
import useEventConfig from "../../../../data/hooks/useEventConfig";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Divider,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  RadioGroup,
  Radio,
  FormLabel,
  CircularProgress,
  Alert,
  Tooltip,
} from "@mui/material";
import { MdPeople, MdOutlineFilterList, MdRefresh } from "react-icons/md";

// ── Opções dos filtros ────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "", label: "Qualquer status" },
  { value: "approved", label: "Aprovado" },
  { value: "pending", label: "Pendente" },
  { value: "error", label: "Erro / Falha" },
  { value: "expired", label: "Expirado" },
  { value: "test", label: "Teste" },
  { value: "canceled", label: "Cancelado" },
];

const PAYMENT_OPTIONS = [
  { value: "", label: "Qualquer método" },
  { value: "creditCard", label: "Cartão de crédito" },
  { value: "boleto", label: "Boleto bancário" },
  { value: "pix", label: "PIX" },
];

const TICKET_OPTIONS = [
  { value: "", label: "Qualquer tipo" },
  { value: "full", label: "Inteira" },
  { value: "half", label: "Meia entrada" },
];

const COUPON_MODES = [
  { value: "any", label: "Qualquer (com ou sem cupom)" },
  { value: "none", label: "Sem cupom" },
  { value: "specific", label: "Cupom específico" },
];

const EMAIL_SENT_OPTIONS = [
  { value: "", label: "Qualquer" },
  { value: "true", label: "Já recebeu e-mail de confirmação" },
  { value: "false", label: "Ainda não recebeu e-mail" },
];

const CHECKED_IN_OPTIONS = [
  { value: "", label: "Qualquer" },
  { value: "true", label: "Já credenciado no evento" },
  { value: "false", label: "Ainda não credenciado" },
];

// ── Converte objeto de filtros salvo → estado do formulário ──────────────────
function filtersToForm(filters = {}) {
  let couponMode = "any";
  let couponValue = "";
  if (filters.coupon === "") couponMode = "none";
  else if (filters.coupon !== undefined && filters.coupon !== null) {
    couponMode = "specific";
    couponValue = filters.coupon;
  }

  return {
    eventName: filters.eventName ?? "",
    checkoutStatus: filters.checkoutStatus ?? "",
    paymentMethod: filters.paymentMethod ?? "",
    ticketType: filters.ticketType ?? "",
    excludeCourtesy: filters.excludeCourtesy ?? false,
    couponMode,
    couponValue,
    emailSent:
      filters.participantEmailSent === true
        ? "true"
        : filters.participantEmailSent === false
        ? "false"
        : "",
    checkedIn:
      filters.participantCheckedIn === true
        ? "true"
        : filters.participantCheckedIn === false
        ? "false"
        : "",
    checkedInDate: filters.participantCheckedInDate ?? "",
    notes: filters.notes ?? "",
  };
}

// ── Converte estado do formulário → objeto de filtros para salvar ─────────────
function formToFilters(form) {
  const filters = {};

  if (form.eventName?.trim()) filters.eventName = form.eventName.trim();
  if (form.checkoutStatus) filters.checkoutStatus = form.checkoutStatus;
  if (form.paymentMethod) filters.paymentMethod = form.paymentMethod;
  if (form.ticketType) filters.ticketType = form.ticketType;
  if (form.excludeCourtesy) filters.excludeCourtesy = true;

  if (form.couponMode === "none") filters.coupon = "";
  else if (form.couponMode === "specific" && form.couponValue)
    filters.coupon = form.couponValue;

  if (form.emailSent === "true") filters.participantEmailSent = true;
  else if (form.emailSent === "false") filters.participantEmailSent = false;

  if (form.checkedIn === "true") filters.participantCheckedIn = true;
  else if (form.checkedIn === "false") filters.participantCheckedIn = false;

  if (form.checkedInDate) filters.participantCheckedInDate = form.checkedInDate;
  if (form.notes.trim()) filters.notes = form.notes.trim();

  return filters;
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function AudienceForm({
  open,
  initialData = {},
  baseUrl,
  onSave,
  onClose,
}) {
  const isEdit = !!initialData?.id;
  const { config: eventConfig } = useEventConfig();
  const EVENT_DATES = eventConfig.eventDates;

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [form, setForm] = useState(() => filtersToForm(initialData?.filters));

  const [estimate, setEstimate] = useState(null); // número | null
  const [estimating, setEstimating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [eventNames, setEventNames] = useState([]);

  const debounceRef = useRef(null);

  // Carrega nomes de eventos disponíveis
  useEffect(() => {
    axios
      .get(`${baseUrl}/audiences/event-names`)
      .then((r) => setEventNames(r.data.data || []))
      .catch(() => {});
  }, [baseUrl]);

  // Quando os filtros mudam, agenda estimativa
  useEffect(() => {
    clearTimeout(debounceRef.current);
    setEstimate(null);
    debounceRef.current = setTimeout(() => runEstimate(), 600);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const runEstimate = async () => {
    setEstimating(true);
    try {
      const filters = formToFilters(form);
      const res = await axios.post(`${baseUrl}/audiences/estimate-filters`, {
        filters,
      });
      setEstimate(res.data.data?.count ?? 0);
    } catch {
      setEstimate(null);
    } finally {
      setEstimating(false);
    }
  };

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...(isEdit ? { id: initialData.id } : {}),
        name: name.trim(),
        description: description.trim(),
        filters: formToFilters(form),
      };
      await onSave(payload);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Erro ao salvar.");
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        {isEdit ? "Editar Público" : "Novo Público"}
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        {/* Estimativa ao vivo */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            mb: 2,
            bgcolor: "primary.50",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "primary.200",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <MdPeople size={22} color="#1976d2" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Estimativa com estes filtros
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {estimating ? (
                  <CircularProgress size={18} />
                ) : estimate !== null ? (
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    color="primary.main"
                  >
                    {estimate.toLocaleString("pt-BR")}
                  </Typography>
                ) : (
                  <Typography variant="h5" color="text.disabled">
                    —
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  participantes
                </Typography>
              </Box>
            </Box>
          </Box>
          <Tooltip title="Recalcular estimativa">
            <span>
              <Button
                size="small"
                onClick={runEstimate}
                disabled={estimating}
                startIcon={<MdRefresh size={16} />}
              >
                Recalcular
              </Button>
            </span>
          </Tooltip>
        </Box>

        {/* Identificação */}
        <TextField
          label="Nome do público *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="Descrição (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={2}
          sx={{ mb: 3 }}
        />

        <Divider sx={{ mb: 2 }}>
          <Chip
            icon={
              <span style={{ display: "flex", paddingLeft: 6 }}>
                <MdOutlineFilterList size={14} />
              </span>
            }
            label="Filtros do Checkout"
            size="small"
          />
        </Divider>

        {/* Nome do evento */}
        <FormControl fullWidth sx={{ mb: 2 }} size="small">
          <InputLabel>Evento</InputLabel>
          <Select
            value={form.eventName}
            label="Evento"
            onChange={(e) => set("eventName", e.target.value)}
          >
            <MenuItem value="">Todos os eventos</MenuItem>
            {eventNames.map((n) => (
              <MenuItem key={n} value={n}>{n}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Status */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Status do checkout</InputLabel>
          <Select
            value={form.checkoutStatus}
            label="Status do checkout"
            onChange={(e) => set("checkoutStatus", e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Método de pagamento */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Método de pagamento</InputLabel>
          <Select
            value={form.paymentMethod}
            label="Método de pagamento"
            onChange={(e) => set("paymentMethod", e.target.value)}
          >
            {PAYMENT_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Cupom */}
        <Box sx={{ mb: 2 }}>
          <FormControl component="fieldset">
            <FormLabel sx={{ fontSize: "0.85rem", mb: 0.5 }}>
              Cupom de desconto
            </FormLabel>
            <RadioGroup
              row
              value={form.couponMode}
              onChange={(e) => set("couponMode", e.target.value)}
            >
              {COUPON_MODES.map((o) => (
                <FormControlLabel
                  key={o.value}
                  value={o.value}
                  control={<Radio size="small" />}
                  label={o.label}
                />
              ))}
            </RadioGroup>
          </FormControl>
          {form.couponMode === "specific" && (
            <TextField
              label="Código do cupom"
              value={form.couponValue}
              onChange={(e) => set("couponValue", e.target.value)}
              size="small"
              sx={{ mt: 1, width: 220 }}
            />
          )}
        </Box>

        {/* Excluir cortesias */}
        <FormControlLabel
          control={
            <Switch
              checked={form.excludeCourtesy}
              onChange={(e) => set("excludeCourtesy", e.target.checked)}
            />
          }
          label="Excluir ingressos de cortesia"
          sx={{ mb: 1 }}
        />

        {/* Observações do checkout */}
        <TextField
          label="Observações do pedido contém (campo notes)"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          fullWidth
          size="small"
          helperText="Deixe em branco para ignorar este filtro"
          sx={{ mb: 2 }}
        />

        <Divider sx={{ mb: 2 }}>
          <Chip label="Filtros do Participante" size="small" />
        </Divider>

        {/* Tipo de ingresso */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Tipo de ingresso</InputLabel>
          <Select
            value={form.ticketType}
            label="Tipo de ingresso"
            onChange={(e) => set("ticketType", e.target.value)}
          >
            {TICKET_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* E-mail enviado */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>E-mail de confirmação</InputLabel>
          <Select
            value={form.emailSent}
            label="E-mail de confirmação"
            onChange={(e) => set("emailSent", e.target.value)}
          >
            {EMAIL_SENT_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Credenciado */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Status de credenciamento</InputLabel>
          <Select
            value={form.checkedIn}
            label="Status de credenciamento"
            onChange={(e) => {
              set("checkedIn", e.target.value);
              if (e.target.value !== "true") set("checkedInDate", "");
            }}
          >
            {CHECKED_IN_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Data específica de check-in (só aparece se filtrou por credenciado) */}
        {form.checkedIn === "true" && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Data do check-in (opcional)</InputLabel>
            <Select
              value={form.checkedInDate}
              label="Data do check-in (opcional)"
              onChange={(e) => set("checkedInDate", e.target.value)}
            >
              <MenuItem value="">Qualquer data</MenuItem>
              {EVENT_DATES.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={
            saving ? <CircularProgress size={16} color="inherit" /> : null
          }
          sx={{ fontWeight: 700 }}
        >
          {saving
            ? "Salvando…"
            : isEdit
            ? "Salvar alterações"
            : "Criar público"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
