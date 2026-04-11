import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSend,
  MdOutlineHistory,
  MdPeople,
  MdEmail,
  MdAutorenew,
  MdCheckCircle,
  MdPause,
  MdPlayArrow,
  MdOutlineFilterList,
  MdRefresh,
} from "react-icons/md";
import AudienceForm from "../AudienceForm";
import CampaignForm from "../CampaignForm";
import CampaignLogsModal from "../CampaignLogsModal";
import styles from "../EmailSection/emailSection.module.css";

const BASE_URL =
  import.meta.env.VITE_ENV === "production"
    ? `${import.meta.env.VITE_BASE_URL_PRODUCTION}/email`
    : `${import.meta.env.VITE_BASE_URL_SANDBOX}/email`;

// ── Helpers de exibição ───────────────────────────────────────────────────────
const FILTER_LABELS = {
  checkoutStatus: {
    label: "Status",
    values: {
      approved: { text: "Aprovado", color: "success" },
      pending: { text: "Pendente", color: "warning" },
      error: { text: "Erro", color: "error" },
      expired: { text: "Expirado", color: "default" },
    },
  },
  paymentMethod: {
    label: "Pagamento",
    values: {
      creditCard: { text: "Cartão", color: "info" },
      boleto: { text: "Boleto", color: "default" },
      pix: { text: "PIX", color: "success" },
    },
  },
  ticketType: {
    label: "Ingresso",
    values: {
      full: { text: "Inteira", color: "primary" },
      half: { text: "Meia", color: "secondary" },
    },
  },
};

function FilterChips({ filters = {} }) {
  const chips = [];

  if (filters.eventName) chips.push({ label: `Evento: ${filters.eventName}`, color: "primary" });
  if (filters.checkoutStatus) {
    const v = FILTER_LABELS.checkoutStatus.values[filters.checkoutStatus];
    if (v) chips.push({ label: v.text, color: v.color });
  }
  if (filters.paymentMethod) {
    const v = FILTER_LABELS.paymentMethod.values[filters.paymentMethod];
    if (v) chips.push({ label: v.text, color: v.color });
  }
  if (filters.ticketType) {
    const v = FILTER_LABELS.ticketType.values[filters.ticketType];
    if (v) chips.push({ label: v.text, color: v.color });
  }
  if (filters.excludeCourtesy) chips.push({ label: "Sem cortesia", color: "default" });
  if (filters.coupon === "") chips.push({ label: "Sem cupom", color: "default" });
  if (filters.coupon && filters.coupon !== "") chips.push({ label: `Cupom: ${filters.coupon}`, color: "info" });
  if (filters.participantEmailSent === true) chips.push({ label: "E-mail enviado", color: "success" });
  if (filters.participantEmailSent === false) chips.push({ label: "Sem e-mail", color: "warning" });
  if (filters.participantCheckedIn === true) chips.push({ label: "Credenciado", color: "success" });
  if (filters.participantCheckedIn === false) chips.push({ label: "Não credenciado", color: "warning" });
  if (filters.participantCheckedInDate) chips.push({ label: `Check-in ${filters.participantCheckedInDate}`, color: "info" });
  if (filters.notes) chips.push({ label: `Obs: "${filters.notes}"`, color: "default" });

  if (chips.length === 0) return <Typography variant="caption" color="text.disabled">Sem filtros</Typography>;

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {chips.map((c, i) => (
        <Chip key={i} label={c.label} color={c.color} size="small" variant="outlined" />
      ))}
    </Box>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function EmailSectionContainer() {
  const [activeTab, setActiveTab] = useState(0);

  // Dados
  const [campaigns, setCampaigns] = useState([]);
  const [audiences, setAudiences] = useState([]);
  const [stats, setStats] = useState({ totalSent: 0, available: 3000 });
  const [audienceSizes, setAudienceSizes] = useState({}); // { [audienceId]: number }

  // Carregamento
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // Formulários (Dialogs)
  const [audienceForm, setAudienceForm] = useState(null); // null | {} | { id, ...data }
  const [campaignForm, setCampaignForm] = useState(null); // null | {} | { id, ...data }

  // Logs
  const [logsModal, setLogsModal] = useState(null); // null | campaignId

  // Confirmação de ações destrutivas
  const [confirmDialog, setConfirmDialog] = useState(null); // { type, id, name }

  // Disparo em andamento
  const [dispatching, setDispatching] = useState(null); // null | campaignId
  const [dispatchResult, setDispatchResult] = useState(null);

  // ── Fetches ─────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [campRes, audRes, statsRes] = await Promise.all([
        axios.get(`${BASE_URL}/campaigns`),
        axios.get(`${BASE_URL}/audiences`),
        axios.get(`${BASE_URL}/stats`),
      ]);
      setCampaigns(campRes.data.data || []);
      setAudiences(audRes.data.data || []);
      setStats(statsRes.data.data || { totalSent: 0, available: 3000 });
    } catch (err) {
      console.error("[EmailSection] Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAudienceSizes = useCallback(async (audienceList) => {
    const entries = await Promise.allSettled(
      audienceList.map((a) =>
        axios
          .get(`${BASE_URL}/audiences/${a.id}/estimate`)
          .then((r) => [a.id, r.data.data?.count ?? 0])
      )
    );
    const sizes = {};
    entries.forEach((e) => {
      if (e.status === "fulfilled") {
        const [id, count] = e.value;
        sizes[id] = count;
      }
    });
    setAudienceSizes(sizes);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (audiences.length > 0) fetchAudienceSizes(audiences);
  }, [audiences, fetchAudienceSizes]);

  // ── Campanhas CRUD ───────────────────────────────────────────────────────────
  const handleSaveCampaign = async (data) => {
    if (data.id) {
      const { id, ...rest } = data;
      await axios.put(`${BASE_URL}/campaigns/${id}`, rest);
    } else {
      await axios.post(`${BASE_URL}/campaigns`, data);
    }
    setCampaignForm(null);
    fetchAll();
  };

  const handleDeleteCampaign = async (id) => {
    await axios.delete(`${BASE_URL}/campaigns/${id}`);
    setConfirmDialog(null);
    fetchAll();
  };

  const handleToggleCampaignActive = async (campaign) => {
    await axios.put(`${BASE_URL}/campaigns/${campaign.id}`, {
      active: !campaign.active,
    });
    fetchAll();
  };

  const handleDispatch = async (campaignId) => {
    setDispatching(campaignId);
    setDispatchResult(null);
    try {
      const res = await axios.post(`${BASE_URL}/campaigns/${campaignId}/dispatch`);
      setDispatchResult({ success: true, ...res.data.data });
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setDispatchResult({ success: false, message: msg });
    } finally {
      setDispatching(null);
      fetchAll();
    }
  };

  // ── Audiências CRUD ──────────────────────────────────────────────────────────
  const handleSaveAudience = async (data) => {
    if (data.id) {
      const { id, ...rest } = data;
      await axios.put(`${BASE_URL}/audiences/${id}`, rest);
    } else {
      await axios.post(`${BASE_URL}/audiences`, data);
    }
    setAudienceForm(null);
    fetchAll();
  };

  const handleDeleteAudience = async (id) => {
    await axios.delete(`${BASE_URL}/audiences/${id}`);
    setConfirmDialog(null);
    fetchAll();
  };

  // ── Lookup helpers ───────────────────────────────────────────────────────────
  const getAudienceName = (audienceId) =>
    audiences.find((a) => a.id === audienceId)?.name ?? "—";

  const getAudienceFilters = (audienceId) =>
    audiences.find((a) => a.id === audienceId)?.filters ?? {};

  // ── Render tab: Campanhas ─────────────────────────────────────────────────
  const renderCampaigns = () => (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<MdAdd size={18} />}
          onClick={() => setCampaignForm({})}
          disabled={audiences.length === 0}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          Nova Campanha
        </Button>
      </Box>

      {audiences.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Crie ao menos um <strong>Público</strong> antes de criar campanhas.
        </Alert>
      )}

      {campaigns.length === 0 && !loading ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <MdEmail size={56} color="#bdbdbd" style={{ marginBottom: 12 }} />
          <Typography color="text.secondary">
            Nenhuma campanha criada ainda.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {campaigns.map((c) => (
            <Box key={c.id} sx={{ flex: "1 1 340px", minWidth: 0 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                  border: "1px solid",
                  borderColor: c.active ? "primary.200" : "grey.200",
                  opacity: c.active ? 1 : 0.65,
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  {/* Header */}
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                        {c.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {c.subject}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
                      <Chip
                        label={c.active ? "Ativa" : "Pausada"}
                        color={c.active ? "success" : "default"}
                        size="small"
                      />
                      {c.sendOnNew && (
                        <Chip
                          icon={<span style={{ display: "flex", paddingLeft: 6 }}><MdAutorenew size={12} /></span>}
                          label="Auto-disparo"
                          color="info"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Público */}
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      PÚBLICO
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                      <MdPeople size={16} color="#666" />
                      <Typography variant="body2" fontWeight={500}>
                        {getAudienceName(c.audienceId)}
                      </Typography>
                      {audienceSizes[c.audienceId] !== undefined && (
                        <Chip
                          label={`${audienceSizes[c.audienceId]} pessoas`}
                          size="small"
                          sx={{ fontSize: "0.7rem" }}
                        />
                      )}
                    </Box>
                    <Box sx={{ mt: 0.5 }}>
                      <FilterChips filters={getAudienceFilters(c.audienceId)} />
                    </Box>
                  </Box>

                  {/* Stats */}
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Enviados</Typography>
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        {c.sentCount ?? 0}
                      </Typography>
                    </Box>
                    {c.includeTicket && (
                      <Chip label="Inclui ingresso" size="small" variant="outlined" />
                    )}
                  </Box>
                </CardContent>

                <Divider />
                <CardActions sx={{ px: 2, py: 1, gap: 0.5 }}>
                  {/* Disparar */}
                  {c.active && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={
                        dispatching === c.id
                          ? <CircularProgress size={14} color="inherit" />
                          : <MdSend size={14} />
                      }
                      disabled={!!dispatching}
                      onClick={() =>
                        setConfirmDialog({ type: "dispatch", id: c.id, name: c.name, audienceId: c.audienceId })
                      }
                      sx={{ borderRadius: 2, fontWeight: 700, mr: "auto" }}
                    >
                      Disparar
                    </Button>
                  )}

                  {/* Logs */}
                  <Tooltip title="Ver histórico de envios">
                    <IconButton size="small" onClick={() => setLogsModal(c.id)}>
                      <MdOutlineHistory size={18} />
                    </IconButton>
                  </Tooltip>

                  {/* Ativar/pausar */}
                  <Tooltip title={c.active ? "Pausar campanha" : "Ativar campanha"}>
                    <IconButton size="small" onClick={() => handleToggleCampaignActive(c)}>
                      {c.active ? <MdPause size={18} /> : <MdPlayArrow size={18} />}
                    </IconButton>
                  </Tooltip>

                  {/* Editar */}
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => setCampaignForm(c)}>
                      <MdEdit size={18} />
                    </IconButton>
                  </Tooltip>

                  {/* Excluir */}
                  <Tooltip title="Excluir">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        setConfirmDialog({ type: "campaign", id: c.id, name: c.name })
                      }
                    >
                      <MdDelete size={18} />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );

  // ── Render tab: Públicos ──────────────────────────────────────────────────
  const renderAudiences = () => (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<MdAdd size={18} />}
          onClick={() => setAudienceForm({})}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          Novo Público
        </Button>
      </Box>

      {audiences.length === 0 && !loading ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <MdPeople size={56} color="#bdbdbd" style={{ marginBottom: 12 }} />
          <Typography color="text.secondary">
            Nenhum público criado ainda.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {audiences.map((a) => {
            const usedBy = campaigns.filter((c) => c.audienceId === a.id).length;
            return (
              <Box key={a.id} sx={{ flex: "1 1 340px", minWidth: 0 }}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                  }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1.5 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={700}>
                          {a.name}
                        </Typography>
                        {a.description && (
                          <Typography variant="body2" color="text.secondary">
                            {a.description}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        {audienceSizes[a.id] !== undefined ? (
                          <Box sx={{ textAlign: "center" }}>
                            <Typography variant="h5" fontWeight={800} color="primary.main" lineHeight={1}>
                              {audienceSizes[a.id]}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">pessoas</Typography>
                          </Box>
                        ) : (
                          <CircularProgress size={20} />
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        FILTROS
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <FilterChips filters={a.filters} />
                      </Box>
                    </Box>

                    {usedBy > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Usado em {usedBy} campanha{usedBy > 1 ? "s" : ""}
                      </Typography>
                    )}
                  </CardContent>

                  <Divider />
                  <CardActions sx={{ px: 2, py: 1, justifyContent: "flex-end" }}>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => setAudienceForm(a)}>
                        <MdEdit size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={usedBy > 0 ? "Público em uso — não pode excluir" : "Excluir"}>
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={usedBy > 0}
                          onClick={() =>
                            setConfirmDialog({ type: "audience", id: a.id, name: a.name })
                          }
                        >
                          <MdDelete size={18} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Gerenciar E-mails
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Campanhas com públicos segmentados e disparo automático
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="h6" fontWeight={800} color={stats.available > 500 ? "success.main" : "error.main"}>
              {stats.available?.toLocaleString("pt-BR")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              e-mails disponíveis hoje
            </Typography>
          </Box>
          <Tooltip title="Atualizar dados">
            <IconButton onClick={fetchAll} disabled={loading}>
              {loading ? <CircularProgress size={18} /> : <MdRefresh size={20} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab
          icon={<MdEmail size={18} />}
          label={`Campanhas (${campaigns.length})`}
          iconPosition="start"
          sx={{ minHeight: 48, fontWeight: 600 }}
        />
        <Tab
          icon={<MdOutlineFilterList size={18} />}
          label={`Públicos (${audiences.length})`}
          iconPosition="start"
          sx={{ minHeight: 48, fontWeight: 600 }}
        />
      </Tabs>

      {activeTab === 0 && renderCampaigns()}
      {activeTab === 1 && renderAudiences()}

      {/* ── Dialog: formulário de Público ── */}
      {audienceForm !== null && (
        <AudienceForm
          open
          initialData={audienceForm}
          baseUrl={BASE_URL}
          onSave={handleSaveAudience}
          onClose={() => setAudienceForm(null)}
        />
      )}

      {/* ── Dialog: formulário de Campanha ── */}
      {campaignForm !== null && (
        <CampaignForm
          open
          initialData={campaignForm}
          audiences={audiences}
          audienceSizes={audienceSizes}
          onSave={handleSaveCampaign}
          onClose={() => setCampaignForm(null)}
        />
      )}

      {/* ── Dialog: logs de campanha ── */}
      {logsModal && (
        <CampaignLogsModal
          open
          campaignId={logsModal}
          campaignName={campaigns.find((c) => c.id === logsModal)?.name ?? ""}
          baseUrl={BASE_URL}
          onClose={() => setLogsModal(null)}
        />
      )}

      {/* ── Dialog: confirmação de exclusão ── */}
      {confirmDialog && confirmDialog.type !== "dispatch" && (
        <Dialog
          open
          onClose={() => setConfirmDialog(null)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle fontWeight={700}>Confirmar exclusão</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Tem certeza que deseja excluir{" "}
              <strong>{confirmDialog.name}</strong>? Esta ação não pode ser desfeita.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button onClick={() => setConfirmDialog(null)} variant="outlined">
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                if (confirmDialog.type === "campaign")
                  handleDeleteCampaign(confirmDialog.id);
                else handleDeleteAudience(confirmDialog.id);
              }}
            >
              Excluir
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* ── Dialog: confirmação de disparo ── */}
      {confirmDialog?.type === "dispatch" && (
        <Dialog
          open
          onClose={() => !dispatching && setConfirmDialog(null)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle fontWeight={700}>Confirmar disparo</DialogTitle>
          <DialogContent>
            {dispatching ? (
              <Box sx={{ textAlign: "center", py: 3 }}>
                <CircularProgress size={48} sx={{ mb: 2 }} />
                <Typography>Enviando e-mails…</Typography>
                <Typography variant="caption" color="text.secondary">
                  Isso pode levar alguns minutos.
                </Typography>
              </Box>
            ) : dispatchResult ? (
              <Box>
                {dispatchResult.success ? (
                  <Alert severity="success" icon={<MdCheckCircle size={20} />} sx={{ mb: 1 }}>
                    Disparo concluído com sucesso!
                  </Alert>
                ) : (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    {dispatchResult.message}
                  </Alert>
                )}
                {dispatchResult.success && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">✅ Enviados: <strong>{dispatchResult.sent}</strong></Typography>
                    <Typography variant="body2">⏭️ Ignorados (já receberam): <strong>{dispatchResult.skipped}</strong></Typography>
                    {dispatchResult.errors?.length > 0 && (
                      <Typography variant="body2" color="error">
                        ❌ Erros: <strong>{dispatchResult.errors.length}</strong>
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            ) : (
              <DialogContentText>
                Disparar campanha <strong>{confirmDialog.name}</strong> para{" "}
                {audienceSizes[confirmDialog.audienceId] !== undefined ? (
                  <strong>{audienceSizes[confirmDialog.audienceId]} pessoas</strong>
                ) : (
                  "o público selecionado"
                )}
                ? Participantes que já receberam esta campanha serão ignorados automaticamente.
              </DialogContentText>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            {!dispatching && (
              <Button
                onClick={() => {
                  setConfirmDialog(null);
                  setDispatchResult(null);
                }}
                variant="outlined"
              >
                {dispatchResult ? "Fechar" : "Cancelar"}
              </Button>
            )}
            {!dispatching && !dispatchResult && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<MdSend size={16} />}
                onClick={() => handleDispatch(confirmDialog.id)}
                sx={{ fontWeight: 700 }}
              >
                Confirmar disparo
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}
