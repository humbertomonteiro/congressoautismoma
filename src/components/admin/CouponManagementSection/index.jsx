import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Switch,
  FormControlLabel,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import {
  MdEdit,
  MdDelete,
  MdAdd,
  MdClose,
  MdContentCopy,
} from "react-icons/md";
import { toast } from "react-toastify";
import CouponAdminService from "../../../data/services/CouponAdminService";

const EMPTY_FORM = {
  code: "",
  description: "",
  discountType: "fixed",
  discountValue: "",
  minTickets: "0",
  active: true,
  expiresAt: "",
};

const fmtBRL = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const fmtDate = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("pt-BR");
};

const CouponManagementSection = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    code: "",
  });

  const fetchCoupons = async () => {
    try {
      const data = await CouponAdminService.listCoupons();
      setCoupons(data || []);
    } catch (err) {
      toast.error("Erro ao carregar cupons: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditingId(coupon.id);
    let expiresAt = "";
    if (coupon.expiresAt) {
      const d = coupon.expiresAt.toDate
        ? coupon.expiresAt.toDate()
        : new Date(coupon.expiresAt);
      if (!isNaN(d)) expiresAt = d.toISOString().split("T")[0];
    }
    setForm({
      code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "fixed",
      discountValue: String(coupon.discountValue ?? ""),
      minTickets: String(coupon.minTickets ?? "0"),
      active: coupon.active !== false,
      expiresAt,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      toast.error("Informe o código do cupom.");
      return;
    }
    if (!form.discountValue || Number(form.discountValue) <= 0) {
      toast.error("Informe um valor de desconto válido.");
      return;
    }
    if (form.discountType === "percent" && Number(form.discountValue) > 100) {
      toast.error("Desconto percentual não pode ser maior que 100%.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toLowerCase(),
        description: form.description,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minTickets: parseInt(form.minTickets) || 0,
        active: form.active,
        expiresAt: form.expiresAt
          ? new Date(form.expiresAt).toISOString()
          : null,
      };

      if (editingId) {
        await CouponAdminService.updateCoupon(editingId, payload);
        toast.success("Cupom atualizado!");
      } else {
        await CouponAdminService.createCoupon(payload);
        toast.success("Cupom criado!");
      }
      setDialogOpen(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await CouponAdminService.deleteCoupon(deleteDialog.id);
      toast.success("Cupom removido.");
      setDeleteDialog({ open: false, id: null, code: "" });
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      await CouponAdminService.updateCoupon(coupon.id, {
        active: !coupon.active,
      });
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, active: !c.active } : c))
      );
    } catch (err) {
      toast.error("Erro ao alterar status: " + err.message);
    }
  };

  const discountLabel = (coupon) => {
    if (!coupon.discountType) return "—";
    if (coupon.discountType === "fixed") {
      return `${fmtBRL(coupon.discountValue)} por ingresso inteiro`;
    }
    return `${coupon.discountValue}% sobre o subtotal`;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "#333" }}>
            Gerenciar Cupons
          </Typography>
          <Typography variant="body2" sx={{ color: "#666", mt: 0.5 }}>
            Crie e gerencie cupons de desconto fixo ou percentual
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<MdAdd />}
          onClick={handleOpenCreate}
          sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 500 }}
        >
          Novo Cupom
        </Button>
      </Box>

      {/* Tabela */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#F5F5F5" }}>
                <TableCell sx={{ fontWeight: "bold" }}>Código</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Descrição</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Desconto</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Mín. Inteiros</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Expira em</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="right">
                  Ações
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {coupons.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 4, color: "#999" }}
                  >
                    Nenhum cupom cadastrado.
                  </TableCell>
                </TableRow>
              )}
              {coupons.map((coupon) => (
                <TableRow key={coupon.id} hover>
                  <TableCell>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "monospace",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          color: "#1976D2",
                          bgcolor: "#E3F2FD",
                          px: 1,
                          py: 0.25,
                          borderRadius: "4px",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {coupon.code}
                      </Typography>
                      <Tooltip title="Copiar código">
                        <IconButton
                          size="small"
                          onClick={() => {
                            const base = import.meta.env.VITE_CHECKOUT_URL ||
                              `${window.location.origin}/checkout`;
                            const params = new URLSearchParams({ coupon: coupon.code });
                            if (coupon.minTickets > 0) params.set("all", coupon.minTickets);
                            navigator.clipboard.writeText(`${base}?${params.toString()}`);
                            toast.success("Link do cupom copiado!");
                          }}
                        >
                          <MdContentCopy size={14} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{ fontSize: "0.85rem", color: "#555", maxWidth: 180 }}
                  >
                    {coupon.description || (
                      <span style={{ color: "#bbb" }}>—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={discountLabel(coupon)}
                      size="small"
                      color={
                        coupon.discountType === "percent"
                          ? "secondary"
                          : "primary"
                      }
                      variant="outlined"
                      sx={{ fontSize: "0.78rem" }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.85rem", color: "#555" }}>
                    {coupon.minTickets > 0 ? (
                      coupon.minTickets
                    ) : (
                      <span style={{ color: "#bbb" }}>—</span>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.85rem", color: "#555" }}>
                    {fmtDate(coupon.expiresAt)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={coupon.active}
                      onChange={() => handleToggleActive(coupon)}
                      size="small"
                      color="success"
                    />
                    <Typography
                      component="span"
                      sx={{
                        fontSize: "0.78rem",
                        color: coupon.active ? "#2E7D32" : "#aaa",
                        ml: 0.5,
                      }}
                    >
                      {coupon.active ? "Ativo" : "Inativo"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      sx={{ color: "#1976D2" }}
                      onClick={() => handleOpenEdit(coupon)}
                    >
                      <MdEdit size={18} />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{ color: "#D32F2F", ml: 0.5 }}
                      onClick={() =>
                        setDeleteDialog({
                          open: true,
                          id: coupon.id,
                          code: coupon.code,
                        })
                      }
                    >
                      <MdDelete size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog criar/editar */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {editingId ? "Editar Cupom" : "Novo Cupom"}
          <IconButton size="small" onClick={() => setDialogOpen(false)}>
            <MdClose />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            pt: "16px !important",
          }}
        >
          <TextField
            label="Código do cupom"
            value={form.code}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                code: e.target.value.toLowerCase().replace(/\s/g, ""),
              }))
            }
            fullWidth
            required
            helperText="Somente letras minúsculas e números, sem espaços"
            slotProps={{
              input: {
                style: {
                  fontFamily: "monospace",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                },
              },
            }}
            disabled={!!editingId}
          />

          <TextField
            label="Descrição (uso interno)"
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            fullWidth
            placeholder="Ex: Cupom para parceiros terapeutas"
          />

          <FormControl fullWidth required>
            <InputLabel>Tipo de desconto</InputLabel>
            <Select
              value={form.discountType}
              label="Tipo de desconto"
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  discountType: e.target.value,
                  discountValue: "",
                }))
              }
            >
              <MenuItem value="fixed">
                <Box>
                  <Typography fontWeight={500}>Valor fixo (R$)</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Desconto em reais por ingresso inteiro
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="percent">
                <Box>
                  <Typography fontWeight={500}>Percentual (%)</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Percentual sobre o subtotal total da compra
                  </Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <TextField
            label={
              form.discountType === "fixed"
                ? "Desconto por ingresso inteiro (R$)"
                : "Desconto (%)"
            }
            value={form.discountValue}
            onChange={(e) =>
              setForm((p) => ({ ...p, discountValue: e.target.value }))
            }
            type="number"
            fullWidth
            required
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    {form.discountType === "fixed" ? "R$" : "%"}
                  </InputAdornment>
                ),
                inputProps: {
                  min: 0,
                  max: form.discountType === "percent" ? 100 : undefined,
                  step: "0.01",
                },
              },
            }}
            helperText={
              form.discountType === "fixed"
                ? "Ex: 326.10 → cliente paga R$ 347,90 por ingresso inteiro"
                : "Ex: 15 → 15% de desconto sobre o total"
            }
          />

          <TextField
            label="Mínimo de ingressos inteiros (0 = sem mínimo)"
            value={form.minTickets}
            onChange={(e) =>
              setForm((p) => ({ ...p, minTickets: e.target.value }))
            }
            type="number"
            fullWidth
            slotProps={{ input: { inputProps: { min: 0 } } }}
          />

          <TextField
            label="Data de expiração (opcional)"
            value={form.expiresAt}
            onChange={(e) =>
              setForm((p) => ({ ...p, expiresAt: e.target.value }))
            }
            type="date"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.active}
                onChange={(e) =>
                  setForm((p) => ({ ...p, active: e.target.checked }))
                }
                color="success"
              />
            }
            label={form.active ? "Cupom ativo" : "Cupom inativo"}
          />

          {/* Preview do desconto */}
          {form.discountValue && Number(form.discountValue) > 0 && (
            <Box
              sx={{
                p: 1.5,
                bgcolor: "#F0F7FF",
                borderRadius: "8px",
                border: "1px solid #BBDEFB",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "#1565C0", fontSize: "0.82rem" }}
              >
                {form.discountType === "fixed"
                  ? `Com 1 ingresso inteiro: desconto de ${fmtBRL(
                      form.discountValue
                    )}. Com 2: ${fmtBRL(Number(form.discountValue) * 2)}.`
                  : `${form.discountValue}% de desconto sobre o total da compra.`}
                {form.minTickets > 0 &&
                  ` Exige mínimo de ${form.minTickets} ingresso(s) inteiro(s).`}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ textTransform: "none" }}
          >
            {saving ? (
              <CircularProgress size={20} />
            ) : editingId ? (
              "Salvar"
            ) : (
              "Criar Cupom"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog confirmar exclusão */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, code: "" })}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja remover o cupom{" "}
            <strong style={{ fontFamily: "monospace", color: "#1976D2" }}>
              {deleteDialog.code}
            </strong>
            ? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, id: null, code: "" })}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            sx={{ textTransform: "none" }}
          >
            Remover
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CouponManagementSection;
