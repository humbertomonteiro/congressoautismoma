import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  Chip,
  IconButton,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  MdOutlineTrendingUp,
  MdOutlineTrendingDown,
  MdOutlineAccountBalance,
  MdOutlineHourglassEmpty,
  MdDeleteOutline,
  MdCheckCircleOutline,
  // MdCancelOutlined,
  MdRefresh,
} from "react-icons/md";
import useCaixaData from "../../../../data/hooks/useCaixaData";

// ── helpers ──────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
};

const formatTimestamp = (ts) => {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ── MetricCard ────────────────────────────────────────────────────────────────
const MetricCard = ({ icon, iconColor, label, value, sub }) => (
  <Card
    sx={{
      flex: "1 1 200px",
      minWidth: 180,
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    }}
  >
    <CardContent
      sx={{ display: "flex", alignItems: "center", gap: 2, py: 2.5, px: 2 }}
    >
      <Box sx={{ color: iconColor, flexShrink: 0 }}>{icon}</Box>
      <Box>
        <Typography sx={{ color: "#888", fontSize: "0.8rem" }}>
          {label}
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: "1.3rem", color: "#333" }}>
          {value}
        </Typography>
        {sub && (
          <Typography sx={{ color: "#aaa", fontSize: "0.73rem", mt: 0.25 }}>
            {sub}
          </Typography>
        )}
      </Box>
    </CardContent>
  </Card>
);

// ── EntryForm ─────────────────────────────────────────────────────────────────
const EntryForm = ({ addEntry, RECEITA_CATEGORIES, DESPESA_CATEGORIES }) => {
  const emptyForm = {
    type: "receita",
    category: "ingressos",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  };
  const [form, setForm] = useState(emptyForm);

  const categories =
    form.type === "receita" ? RECEITA_CATEGORIES : DESPESA_CATEGORIES;

  const handleTypeChange = (type) => {
    const defaultCat = type === "receita" ? "ingressos" : "marketing";
    setForm((p) => ({ ...p, type, category: defaultCat }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.amount ||
      isNaN(parseFloat(form.amount)) ||
      parseFloat(form.amount) <= 0
    )
      return;
    await addEntry({
      type: form.type,
      category: form.category,
      amount: parseFloat(parseFloat(form.amount).toFixed(2)),
      description: form.description.trim() || "",
      date: form.date,
    });
    setForm(emptyForm);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        p: 3,
        backgroundColor: "#fff",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        mb: 3,
      }}
    >
      <Typography
        variant="h6"
        sx={{ width: "100%", color: "#333", fontWeight: 600 }}
      >
        Novo Lançamento
      </Typography>

      <FormControl sx={{ minWidth: 140 }}>
        <InputLabel>Tipo</InputLabel>
        <Select
          label="Tipo"
          value={form.type}
          onChange={(e) => handleTypeChange(e.target.value)}
        >
          <MenuItem value="receita">Receita</MenuItem>
          <MenuItem value="despesa">Despesa</MenuItem>
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 180 }}>
        <InputLabel>Categoria</InputLabel>
        <Select
          label="Categoria"
          value={form.category}
          onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
        >
          {categories.map((c) => (
            <MenuItem key={c.value} value={c.value}>
              {c.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Valor (R$)"
        type="number"
        inputProps={{ min: 0, step: "0.01" }}
        value={form.amount}
        onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
        sx={{ minWidth: 140 }}
        required
      />

      <TextField
        label="Descrição (opcional)"
        value={form.description}
        onChange={(e) =>
          setForm((p) => ({ ...p, description: e.target.value }))
        }
        sx={{ flexGrow: 1, minWidth: 200 }}
      />

      <TextField
        label="Data"
        type="date"
        value={form.date}
        onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
        sx={{ minWidth: 150 }}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Button
        type="submit"
        variant="contained"
        sx={{
          alignSelf: "flex-end",
          height: 56,
          px: 3,
          textTransform: "none",
          fontWeight: 600,
          backgroundColor: form.type === "receita" ? "#2E7D32" : "#D32F2F",
          "&:hover": {
            backgroundColor: form.type === "receita" ? "#1B5E20" : "#B71C1C",
          },
        }}
      >
        Adicionar
      </Button>
    </Box>
  );
};

// ── EntriesList ───────────────────────────────────────────────────────────────
const EntriesList = ({
  entries,
  formatCurrency,
  deleteEntry,
  canDelete,
  typeFilter,
}) => {
  const filtered = typeFilter
    ? entries.filter((e) => e.type === typeFilter)
    : entries;

  if (filtered.length === 0)
    return (
      <Typography sx={{ color: "#aaa", py: 4, textAlign: "center" }}>
        Nenhum lançamento encontrado.
      </Typography>
    );

  const categoryLabel = (entry) => {
    const list =
      entry.type === "receita"
        ? [
            { value: "ingressos", label: "Ingressos" },
            { value: "patrocinador", label: "Patrocinador" },
            { value: "aporte", label: "Aporte" },
            { value: "doacao", label: "Doação" },
            { value: "outros", label: "Outros" },
          ]
        : [
            { value: "marketing", label: "Marketing" },
            { value: "infraestrutura", label: "Infraestrutura" },
            { value: "alimentacao", label: "Alimentação" },
            { value: "logistica", label: "Logística" },
            { value: "pessoal", label: "Pessoal / Palestrantes" },
            { value: "material", label: "Material" },
            { value: "tecnologia", label: "Tecnologia" },
            { value: "outros", label: "Outros" },
          ];
    return (
      list.find((c) => c.value === entry.category)?.label || entry.category
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {filtered.map((entry) => (
        <Box
          key={entry.id}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 2,
            backgroundColor: "#fff",
            borderRadius: "10px",
            borderLeft: `5px solid ${
              entry.type === "receita" ? "#2E7D32" : "#D32F2F"
            }`,
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Chip
                label={categoryLabel(entry)}
                size="small"
                sx={{
                  backgroundColor:
                    entry.type === "receita" ? "#E8F5E9" : "#FFEBEE",
                  color: entry.type === "receita" ? "#2E7D32" : "#C62828",
                  fontSize: "0.72rem",
                  height: 22,
                }}
              />
              {entry.subcategory === "vendedor" && (
                <Chip
                  label={`Vendedor: ${entry.sellerName || "—"}`}
                  size="small"
                  sx={{
                    backgroundColor: "#E3F2FD",
                    color: "#1565C0",
                    fontSize: "0.72rem",
                    height: 22,
                  }}
                />
              )}
              {entry.description && (
                <Typography sx={{ color: "#555", fontSize: "0.85rem" }} noWrap>
                  {entry.description}
                </Typography>
              )}
            </Box>
            <Typography sx={{ color: "#999", fontSize: "0.75rem", mt: 0.5 }}>
              {entry.date
                ? formatDate(entry.date)
                : formatTimestamp(entry.timestamp)}
            </Typography>
          </Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "1rem",
              color: entry.type === "receita" ? "#2E7D32" : "#D32F2F",
              whiteSpace: "nowrap",
            }}
          >
            {entry.type === "receita" ? "+" : "-"}{" "}
            {formatCurrency(entry.amount)}
          </Typography>
          {canDelete && (
            <Tooltip title="Remover">
              <IconButton
                size="small"
                onClick={() => deleteEntry(entry.id)}
                sx={{ color: "#ccc" }}
              >
                <MdDeleteOutline size={18} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ))}
    </Box>
  );
};

// ── PendingApprovals ──────────────────────────────────────────────────────────
const PendingApprovals = ({
  pendingCheckouts,
  approveCheckout,
  rejectCheckout,
  formatCurrency,
}) => {
  if (pendingCheckouts.length === 0)
    return (
      <Typography sx={{ color: "#aaa", py: 4, textAlign: "center" }}>
        Nenhum checkout pendente de aprovação.
      </Typography>
    );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {pendingCheckouts.map((c) => {
        const amount =
          parseFloat(c.totalAmount) || parseFloat(c.orderDetails?.total) || 0;
        const tickets =
          (c.orderDetails?.allTickets || c.orderDetails?.fullTickets || 0) +
          (c.orderDetails?.halfTickets || 0) +
          (c.orderDetails?.socialTickets || 0);
        return (
          <Box
            key={c.id}
            sx={{
              p: 2,
              backgroundColor: "#fff",
              borderRadius: "10px",
              borderLeft: "5px solid #FFB300",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 0.5,
                    flexWrap: "wrap",
                  }}
                >
                  <Chip
                    label="Pendente"
                    size="small"
                    sx={{
                      backgroundColor: "#FFF8E1",
                      color: "#F57F17",
                      fontSize: "0.72rem",
                      height: 22,
                    }}
                  />
                  <Chip
                    label={c.seller?.name || "Vendedor"}
                    size="small"
                    sx={{
                      backgroundColor: "#E3F2FD",
                      color: "#1565C0",
                      fontSize: "0.72rem",
                      height: 22,
                    }}
                  />
                  <Chip
                    label={c.paymentMethod}
                    size="small"
                    sx={{
                      backgroundColor: "#F3E5F5",
                      color: "#6A1B9A",
                      fontSize: "0.72rem",
                      height: 22,
                    }}
                  />
                </Box>
                <Typography
                  sx={{ color: "#333", fontWeight: 500, fontSize: "0.9rem" }}
                >
                  {c.participants?.[0]?.name || "—"}
                </Typography>
                <Typography sx={{ color: "#888", fontSize: "0.78rem" }}>
                  {tickets} ingresso(s) · {formatTimestamp(c.timestamp)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Typography
                  sx={{ fontWeight: 700, fontSize: "1.05rem", color: "#333" }}
                >
                  {formatCurrency(amount)}
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<MdCheckCircleOutline />}
                  onClick={() => approveCheckout(c)}
                  sx={{
                    backgroundColor: "#2E7D32",
                    textTransform: "none",
                    "&:hover": { backgroundColor: "#1B5E20" },
                  }}
                >
                  Aprovar
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={<MdCheckCircleOutline />}
                  onClick={() => rejectCheckout(c.id)}
                  sx={{ textTransform: "none" }}
                >
                  Rejeitar
                </Button>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

// ── BreakdownBlock ────────────────────────────────────────────────────────────
const BreakdownBlock = ({ title, color, items, formatCurrency }) => (
  <Box
    sx={{
      p: 2.5,
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      flex: "1 1 280px",
    }}
  >
    <Typography sx={{ fontWeight: 600, color, mb: 1.5, fontSize: "0.9rem" }}>
      {title}
    </Typography>
    {items.map(({ label, value }) =>
      value > 0 ? (
        <Box
          key={label}
          sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}
        >
          <Typography sx={{ color: "#666", fontSize: "0.83rem" }}>
            {label}
          </Typography>
          <Typography sx={{ color, fontWeight: 600, fontSize: "0.83rem" }}>
            {formatCurrency(value)}
          </Typography>
        </Box>
      ) : null
    )}
  </Box>
);

// ── CaixaSection (main) ───────────────────────────────────────────────────────
const CaixaSection = () => {
  const [tab, setTab] = useState(0);
  const {
    entries,
    pendingCheckouts,
    loading,
    metrics,
    addEntry,
    deleteEntry,
    approveCheckout,
    rejectCheckout,
    refresh,
    formatCurrency,
    RECEITA_CATEGORIES,
    DESPESA_CATEGORIES,
  } = useCaixaData();

  const receitaBreakdown = RECEITA_CATEGORIES.map((c) => ({
    label: c.label,
    value: metrics.receitaByCategory[c.value] || 0,
  }));

  const despesaBreakdown = DESPESA_CATEGORIES.map((c) => ({
    label: c.label,
    value: metrics.despesaByCategory[c.value] || 0,
  }));

  return (
    <Box sx={{ p: 3, backgroundColor: "#F5F7FA", minHeight: "100vh" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#333" }}>
          Caixa do Evento
        </Typography>
        <Button
          variant="outlined"
          startIcon={<MdRefresh />}
          onClick={refresh}
          disabled={loading}
          sx={{ textTransform: "none" }}
        >
          Atualizar
        </Button>
      </Box>

      {/* Métricas principais */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <MetricCard
          icon={<MdOutlineTrendingUp size={36} />}
          iconColor="#2E7D32"
          label="Total de Receitas"
          value={formatCurrency(metrics.totalReceitas)}
          sub={`Ingressos: ${formatCurrency(
            metrics.receitaByCategory["ingressos"] || 0
          )}`}
        />
        <MetricCard
          icon={<MdOutlineTrendingDown size={36} />}
          iconColor="#D32F2F"
          label="Total de Despesas"
          value={formatCurrency(metrics.totalDespesas)}
        />
        <MetricCard
          icon={<MdOutlineAccountBalance size={36} />}
          iconColor={metrics.saldo >= 0 ? "#1565C0" : "#B71C1C"}
          label="Saldo"
          value={formatCurrency(metrics.saldo)}
          sub={metrics.saldo >= 0 ? "Positivo" : "Negativo"}
        />
        <MetricCard
          icon={<MdOutlineHourglassEmpty size={36} />}
          iconColor="#F57F17"
          label="Aguardando Aprovação"
          value={String(metrics.pendingCount)}
          sub={
            metrics.pendingCount > 0
              ? `${formatCurrency(metrics.pendingValue)} em aberto`
              : "Tudo em dia"
          }
        />
      </Box>

      {/* Breakdowns */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <BreakdownBlock
          title="Receitas por categoria"
          color="#2E7D32"
          items={[
            ...receitaBreakdown,
            { label: "└ Via vendedores", value: metrics.receitaVendedores },
          ]}
          formatCurrency={formatCurrency}
        />
        <BreakdownBlock
          title="Despesas por categoria"
          color="#D32F2F"
          items={despesaBreakdown}
          formatCurrency={formatCurrency}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Formulário de novo lançamento */}
      <EntryForm
        addEntry={addEntry}
        RECEITA_CATEGORIES={RECEITA_CATEGORIES}
        DESPESA_CATEGORIES={DESPESA_CATEGORIES}
      />

      {/* Tabs: lançamentos + aprovações */}
      <Box
        sx={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          p: 2,
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2, borderBottom: "1px solid #eee" }}
        >
          <Tab label="Todas as Entradas" sx={{ textTransform: "none" }} />
          <Tab label="Receitas" sx={{ textTransform: "none" }} />
          <Tab label="Despesas" sx={{ textTransform: "none" }} />
          <Tab
            label={
              metrics.pendingCount > 0 ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  Aprovações
                  <Chip
                    label={metrics.pendingCount}
                    size="small"
                    sx={{
                      backgroundColor: "#FFB300",
                      color: "#fff",
                      height: 18,
                      fontSize: "0.7rem",
                    }}
                  />
                </Box>
              ) : (
                "Aprovações"
              )
            }
            sx={{ textTransform: "none" }}
          />
        </Tabs>

        {tab === 0 && (
          <EntriesList
            entries={entries}
            formatCurrency={formatCurrency}
            deleteEntry={deleteEntry}
            canDelete
          />
        )}
        {tab === 1 && (
          <EntriesList
            entries={entries}
            formatCurrency={formatCurrency}
            deleteEntry={deleteEntry}
            canDelete
            typeFilter="receita"
          />
        )}
        {tab === 2 && (
          <EntriesList
            entries={entries}
            formatCurrency={formatCurrency}
            deleteEntry={deleteEntry}
            canDelete
            typeFilter="despesa"
          />
        )}
        {tab === 3 && (
          <PendingApprovals
            pendingCheckouts={pendingCheckouts}
            approveCheckout={approveCheckout}
            rejectCheckout={rejectCheckout}
            formatCurrency={formatCurrency}
          />
        )}
      </Box>
    </Box>
  );
};

export default CaixaSection;
