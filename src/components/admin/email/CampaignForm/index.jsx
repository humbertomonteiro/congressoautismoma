import { useState, useRef } from "react";
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
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  MdExpandMore,
  MdPeople,
  MdOutlineCode,
  MdContentCopy,
  MdPreview,
} from "react-icons/md";

// ── Variáveis disponíveis no template ─────────────────────────────────────────
const VARIABLES = [
  { key: "{{nome}}", desc: "Nome do participante" },
  { key: "{{email}}", desc: "E-mail do participante" },
  { key: "{{cpf}}", desc: "CPF do participante" },
  { key: "{{ticketType}}", desc: '"Inteira" ou "Meia entrada"' },
  { key: "{{paymentMethod}}", desc: "Método de pagamento" },
  { key: "{{total}}", desc: "Valor total do pedido" },
  { key: "{{coupon}}", desc: "Código do cupom utilizado" },
  { key: "{{transactionId}}", desc: "ID da transação" },
];

// ── Template HTML inicial (boilerplate mínimo) ────────────────────────────────
const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; }
    .header { background: #1976d2; color: #fff; padding: 32px 24px; text-align: center; }
    .body { padding: 32px 24px; color: #333; line-height: 1.6; }
    .footer { background: #f9f9f9; padding: 16px 24px; text-align: center; color: #999; font-size: 12px; }
    .btn { display: inline-block; background: #1976d2; color: #fff; padding: 12px 28px;
           border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Congresso Autismo MA 2026</h1>
    </div>
    <div class="body">
      <p>Olá, <strong>{{nome}}</strong>!</p>
      <p>Escreva sua mensagem aqui...</p>
    </div>
    <div class="footer">
      <p>Congresso Autismo MA 2026 · Se tiver dúvidas, responda este e-mail.</p>
    </div>
  </div>
</body>
</html>`;

// ── Componente ────────────────────────────────────────────────────────────────
export default function CampaignForm({ open, initialData = {}, audiences, audienceSizes, onSave, onClose }) {
  const isEdit = !!initialData?.id;

  const [name, setName] = useState(initialData?.name ?? "");
  const [subject, setSubject] = useState(initialData?.subject ?? "");
  const [audienceId, setAudienceId] = useState(initialData?.audienceId ?? "");
  const [htmlBody, setHtmlBody] = useState(initialData?.htmlBody ?? DEFAULT_HTML);
  const [includeTicket, setIncludeTicket] = useState(initialData?.includeTicket ?? false);
  const [sendOnNew, setSendOnNew] = useState(initialData?.sendOnNew ?? false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const textareaRef = useRef(null);

  const selectedAudience = audiences.find((a) => a.id === audienceId);

  // Insere variável no cursor do textarea
  const insertVariable = (varKey) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = htmlBody.slice(0, start);
    const after = htmlBody.slice(end);
    const newVal = before + varKey + after;
    setHtmlBody(newVal);
    // Restaura cursor após inserção
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + varKey.length, start + varKey.length);
    });
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Nome é obrigatório."); return; }
    if (!subject.trim()) { setError("Assunto é obrigatório."); return; }
    if (!audienceId) { setError("Selecione um público."); return; }
    if (!htmlBody.trim()) { setError("O corpo HTML não pode estar vazio."); return; }

    setSaving(true);
    setError("");
    try {
      await onSave({
        ...(isEdit ? { id: initialData.id } : {}),
        name: name.trim(),
        subject: subject.trim(),
        audienceId,
        htmlBody,
        includeTicket,
        sendOnNew,
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Erro ao salvar.");
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3, height: "90vh" } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {isEdit ? "Editar Campanha" : "Nova Campanha"}
        </DialogTitle>

        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          {/* Identificação */}
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="Nome da campanha *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ flex: "1 1 200px" }}
            />
            <TextField
              label="Assunto do e-mail *"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              sx={{ flex: "2 1 300px" }}
            />
          </Box>

          {/* Público */}
          <FormControl fullWidth>
            <InputLabel>Público-alvo *</InputLabel>
            <Select
              value={audienceId}
              label="Público-alvo *"
              onChange={(e) => setAudienceId(e.target.value)}
            >
              {audiences.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                    <MdPeople size={16} />
                    <span>{a.name}</span>
                    {audienceSizes[a.id] !== undefined && (
                      <Chip
                        label={`${audienceSizes[a.id]} pessoas`}
                        size="small"
                        sx={{ ml: "auto", fontSize: "0.7rem" }}
                      />
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedAudience && (
            <Alert severity="info" sx={{ py: 0.5 }}>
              <strong>{selectedAudience.name}</strong>
              {audienceSizes[audienceId] !== undefined && (
                <> · <strong>{audienceSizes[audienceId]}</strong> pessoas</>
              )}
              {selectedAudience.description && ` · ${selectedAudience.description}`}
            </Alert>
          )}

          {/* Opções */}
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            <FormControlLabel
              control={<Switch checked={sendOnNew} onChange={(e) => setSendOnNew(e.target.checked)} />}
              label={
                <Box>
                  <Typography variant="body2" fontWeight={600}>Auto-disparo</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Enviar automaticamente quando um novo participante do público entrar
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={<Switch checked={includeTicket} onChange={(e) => setIncludeTicket(e.target.checked)} />}
              label={
                <Box>
                  <Typography variant="body2" fontWeight={600}>Incluir ingresso em PDF</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Gera e anexa o ingresso com QR Code ao e-mail
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Divider>
            <Chip
              icon={<span style={{ display:"flex",paddingLeft:6 }}><MdOutlineCode size={14}/></span>}
              label="Corpo HTML"
              size="small"
            />
          </Divider>

          {/* Referência de variáveis */}
          <Accordion disableGutters sx={{ borderRadius: "8px !important", border: "1px solid", borderColor: "divider" }}>
            <AccordionSummary expandIcon={<MdExpandMore size={20} />}>
              <Typography variant="body2" fontWeight={600}>
                Variáveis disponíveis — clique para inserir no cursor
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {VARIABLES.map(({ key, desc }) => (
                  <Tooltip title={desc} key={key}>
                    <Chip
                      label={key}
                      size="small"
                      variant="outlined"
                      onClick={() => insertVariable(key)}
                      sx={{
                        fontFamily: "monospace",
                        cursor: "pointer",
                        "&:hover": { bgcolor: "primary.50", borderColor: "primary.main" },
                      }}
                      deleteIcon={<MdContentCopy size={14} />}
                      onDelete={() => navigator.clipboard?.writeText(key)}
                    />
                  </Tooltip>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Editor HTML */}
          <Box sx={{ position: "relative", flex: 1, minHeight: 280 }}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 0.5 }}>
              <Button
                size="small"
                startIcon={<MdPreview size={16} />}
                onClick={() => setPreviewOpen(true)}
                disabled={!htmlBody.trim()}
              >
                Pré-visualizar
              </Button>
            </Box>
            <textarea
              ref={textareaRef}
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              spellCheck={false}
              style={{
                width: "100%",
                height: "340px",
                fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
                fontSize: "13px",
                lineHeight: "1.5",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                background: "#1e1e1e",
                color: "#d4d4d4",
              }}
            />
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={onClose} variant="outlined" disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ fontWeight: 700 }}
          >
            {saving ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar campanha"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Pré-visualização ── */}
      {previewOpen && (
        <Dialog
          open
          onClose={() => setPreviewOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
            Pré-visualização
            <Typography variant="caption" color="text.secondary" alignSelf="center">
              Variáveis exibidas literalmente
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <iframe
              srcDoc={htmlBody}
              title="preview"
              style={{ width: "100%", height: "560px", border: "none" }}
              sandbox="allow-same-origin"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setPreviewOpen(false)} variant="contained">Fechar</Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}
