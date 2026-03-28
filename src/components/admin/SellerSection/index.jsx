import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  Drawer,
  Divider,
  CircularProgress,
  Badge,
  InputAdornment,
  LinearProgress,
} from "@mui/material";
import InputMask from "react-input-mask";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import { toast } from "react-toastify";
import {
  MdDelete,
  MdEdit,
  MdAddAPhoto,
  MdPerson,
  MdVerified,
  MdClose,
  MdPersonAdd,
  MdTrendingUp,
  MdGroup,
  MdAttachMoney,
  MdSearch,
  MdClear,
  MdPayments,
  MdAdd,
  MdHistory,
  MdPercent,
} from "react-icons/md";
import { FaWhatsapp, FaPix } from "react-icons/fa6";
import styles from "./sellerSection.module.css";

// ─── helpers ────────────────────────────────────────────────────────────────

const fmt = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const compressToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 700;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = reject;
    img.src = url;
  });

// ─── constantes ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "",
  document: "",
  email: "",
  phone: "",
  pix: "",
  photoBase64: "",
  commission: "",
};

// ─── componente principal ────────────────────────────────────────────────────

const SellerSection = () => {
  const [sellers, setSellers] = useState([]);
  const [salesMap, setSalesMap] = useState({}); // name → { count, totalAmount }
  const [paymentsMap, setPaymentsMap] = useState({}); // sellerId → totalPaid
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    name: "",
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");

  // modal financeiro
  const [financeModal, setFinanceModal] = useState(null); // seller object
  const [payments, setPayments] = useState([]); // histórico do seller aberto
  const [paymentForm, setPaymentForm] = useState({ amount: "", note: "" });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentFetching, setPaymentFetching] = useState(false);

  const fileInputRef = useRef();

  // ── fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = async () => {
    try {
      setFetching(true);

      const [sellerSnap, checkoutSnap, paymentSnap] = await Promise.all([
        getDocs(collection(db, "sellers")),
        getDocs(collection(db, "checkouts")),
        getDocs(collection(db, "sellerPayments")),
      ]);

      const list = sellerSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSellers(list);

      // vendas por nome
      const sales = {};
      checkoutSnap.docs.forEach((d) => {
        const data = d.data();
        if (data?.seller?.name && data.status === "approved") {
          const n = data.seller.name;
          if (!sales[n]) sales[n] = { count: 0, totalAmount: 0 };
          sales[n].count += 1;
          sales[n].totalAmount += Number(data.totalAmount || 0);
        }
      });
      setSalesMap(sales);

      // pagamentos enviados por sellerId
      const paid = {};
      paymentSnap.docs.forEach((d) => {
        const data = d.data();
        paid[data.sellerId] =
          (paid[data.sellerId] || 0) + Number(data.amount || 0);
      });
      setPaymentsMap(paid);
    } catch {
      toast.error("Erro ao carregar dados.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ── foto ───────────────────────────────────────────────────────────────────

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Foto deve ter menos de 5MB.");
      return;
    }
    try {
      const base64 = await compressToBase64(file);
      setPhotoPreview(base64);
      setForm((p) => ({ ...p, photoBase64: base64 }));
    } catch {
      toast.error("Erro ao processar a imagem.");
    }
  };

  // ── cadastro / edição ──────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.document ||
      !form.email ||
      !form.phone ||
      !form.pix
    ) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    const commission =
      parseFloat(String(form.commission).replace(",", ".")) || 0;
    if (commission < 0 || commission > 100) {
      toast.error("Comissão deve ser entre 0 e 100%.");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, commission };
      if (editingId) {
        await updateDoc(doc(db, "sellers", editingId), payload);
        toast.success("Vendedor atualizado!");
      } else {
        await addDoc(collection(db, "sellers"), payload);
        toast.success("Vendedor cadastrado!");
      }
      resetForm();
      fetchAll();
    } catch (err) {
      toast.error("Erro ao salvar vendedor.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setPhotoPreview(null);
    setDrawerOpen(false);
  };

  const handleEdit = (seller) => {
    setEditingId(seller.id);
    setForm({
      name: seller.name || "",
      document: seller.document || "",
      email: seller.email || "",
      phone: seller.phone || "",
      pix: seller.pix || "",
      photoBase64: seller.photoBase64 || "",
      commission: seller.commission ?? "",
    });
    setPhotoPreview(seller.photoBase64 || null);
    setDrawerOpen(true);
  };

  const handleDelete = async () => {
    const { id } = deleteDialog;
    setDeleteDialog({ open: false, id: null, name: "" });
    try {
      await deleteDoc(doc(db, "sellers", id));
      setSellers((prev) => prev.filter((s) => s.id !== id));
      toast.success("Vendedor removido.");
    } catch {
      toast.error("Erro ao remover vendedor.");
    }
  };

  // ── modal financeiro ───────────────────────────────────────────────────────

  const openFinance = async (seller) => {
    setFinanceModal(seller);
    setPaymentFetching(true);
    try {
      const snap = await getDocs(
        query(
          collection(db, "sellerPayments"),
          where("sellerId", "==", seller.id)
        )
      );
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const ta = a.createdAt?.toDate?.() ?? new Date(a.createdAt ?? 0);
        const tb = b.createdAt?.toDate?.() ?? new Date(b.createdAt ?? 0);
        return tb - ta;
      });
      setPayments(list);
    } catch {
      toast.error("Erro ao carregar lançamentos.");
    } finally {
      setPaymentFetching(false);
    }
  };

  const closeFinance = () => {
    setFinanceModal(null);
    setPayments([]);
    setPaymentForm({ amount: "", note: "" });
  };

  const handleAddPayment = async () => {
    const amount = parseFloat(String(paymentForm.amount).replace(",", "."));
    if (!amount || amount <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    setPaymentLoading(true);
    try {
      const docRef = await addDoc(collection(db, "sellerPayments"), {
        sellerId: financeModal.id,
        sellerName: financeModal.name,
        amount,
        note: paymentForm.note.trim(),
        createdAt: serverTimestamp(),
      });
      const newPayment = {
        id: docRef.id,
        sellerId: financeModal.id,
        sellerName: financeModal.name,
        amount,
        note: paymentForm.note.trim(),
        createdAt: new Date(),
      };
      setPayments((prev) => [newPayment, ...prev]);
      setPaymentsMap((prev) => ({
        ...prev,
        [financeModal.id]: (prev[financeModal.id] || 0) + amount,
      }));
      setPaymentForm({ amount: "", note: "" });
      toast.success("Lançamento registrado!");
    } catch {
      toast.error("Erro ao registrar lançamento.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId, amount) => {
    try {
      await deleteDoc(doc(db, "sellerPayments", paymentId));
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      setPaymentsMap((prev) => ({
        ...prev,
        [financeModal.id]: Math.max(0, (prev[financeModal.id] || 0) - amount),
      }));
      toast.success("Lançamento removido.");
    } catch {
      toast.error("Erro ao remover lançamento.");
    }
  };

  // ── métricas ───────────────────────────────────────────────────────────────

  const totalVendas = Object.values(salesMap).reduce((a, v) => a + v.count, 0);
  const topSeller = sellers.reduce(
    (best, s) => {
      const count = salesMap[s.name]?.count || 0;
      return count > best.count ? { name: s.name, count } : best;
    },
    { name: "—", count: 0 }
  );

  const filteredSellers = search.trim()
    ? sellers.filter((s) =>
        [s.name, s.email, s.document, s.phone, s.pix]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : sellers;

  // ── cálculos por vendedor ──────────────────────────────────────────────────

  const getSellerFinance = (seller) => {
    const { count = 0, totalAmount = 0 } = salesMap[seller.name] || {};
    const commission = Number(seller.commission || 0);
    const toSend = (totalAmount * commission) / 100;
    const sent = paymentsMap[seller.id] || 0;
    const remaining = Math.max(0, toSend - sent);
    const progress = toSend > 0 ? Math.min(100, (sent / toSend) * 100) : 0;
    return { count, totalAmount, toSend, sent, remaining, progress };
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Box className={styles.container}>
      {/* ── Header ── */}
      <Box className={styles.pageHeader}>
        <Box>
          <Typography className={styles.pageTitle}>Vendedores</Typography>
          <Typography className={styles.pageSubtitle}>
            Gerencie vendedores, comissões e repasses
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<MdPersonAdd size={18} />}
          className={styles.addBtn}
          onClick={() => {
            resetForm();
            setDrawerOpen(true);
          }}
        >
          Novo vendedor
        </Button>
      </Box>

      {/* ── Stats ── */}
      <Box className={styles.statsRow}>
        <Box className={styles.statCard}>
          <Box className={styles.statIcon} style={{ background: "#e8f0fe" }}>
            <MdGroup size={22} color="#1967d2" />
          </Box>
          <Box>
            <Typography className={styles.statValue}>
              {sellers.length}
            </Typography>
            <Typography className={styles.statLabel}>
              Vendedores ativos
            </Typography>
          </Box>
        </Box>
        <Box className={styles.statCard}>
          <Box className={styles.statIcon} style={{ background: "#e6f4ea" }}>
            <MdAttachMoney size={22} color="#1e8e3e" />
          </Box>
          <Box>
            <Typography className={styles.statValue}>{totalVendas}</Typography>
            <Typography className={styles.statLabel}>
              Vendas aprovadas
            </Typography>
          </Box>
        </Box>
        <Box className={styles.statCard}>
          <Box className={styles.statIcon} style={{ background: "#fce8e6" }}>
            <MdTrendingUp size={22} color="#d93025" />
          </Box>
          <Box>
            <Typography className={styles.statValue}>
              {topSeller.count > 0 ? topSeller.count : "—"}
            </Typography>
            <Typography className={styles.statLabel} title={topSeller.name}>
              Top: {topSeller.count > 0 ? topSeller.name.split(" ")[0] : "—"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Busca ── */}
      <Box className={styles.searchRow}>
        <TextField
          placeholder="Buscar por nome, e-mail, CPF, telefone ou Pix..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MdSearch size={20} color="#90a4ae" />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch("")}>
                  <MdClear size={16} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              background: "#fff",
            },
          }}
        />
        {search && (
          <Typography className={styles.searchResult}>
            {filteredSellers.length === 0
              ? "Nenhum resultado"
              : `${filteredSellers.length} vendedor${
                  filteredSellers.length !== 1 ? "es" : ""
                } encontrado${filteredSellers.length !== 1 ? "s" : ""}`}
          </Typography>
        )}
      </Box>

      {/* ── Lista ── */}
      {fetching ? (
        <Box className={styles.loadingBox}>
          <CircularProgress size={32} />
        </Box>
      ) : sellers.length === 0 ? (
        <Box className={styles.emptyBox}>
          <MdPerson size={48} color="#bdbdbd" />
          <Typography className={styles.emptyMsg}>
            Nenhum vendedor cadastrado ainda.
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setDrawerOpen(true)}
            sx={{ mt: 1, textTransform: "none" }}
          >
            Cadastrar primeiro vendedor
          </Button>
        </Box>
      ) : filteredSellers.length === 0 ? (
        <Box className={styles.emptyBox}>
          <MdSearch size={40} color="#bdbdbd" />
          <Typography className={styles.emptyMsg}>
            Nenhum resultado para "{search}".
          </Typography>
        </Box>
      ) : (
        <Box className={styles.sellerGrid}>
          {filteredSellers.map((seller) => {
            const { count, totalAmount, toSend, sent, remaining, progress } =
              getSellerFinance(seller);
            const commission = Number(seller.commission || 0);
            return (
              <Box key={seller.id} className={styles.sellerCard}>
                <Box className={styles.cardAccent} />
                <Box className={styles.cardBody}>
                  {/* Avatar + ações */}
                  <Box className={styles.cardTop}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      badgeContent={
                        <Box className={styles.verifiedBadge}>
                          <MdVerified size={14} color="#1967d2" />
                        </Box>
                      }
                    >
                      <Avatar
                        src={seller.photoBase64 || undefined}
                        className={styles.sellerAvatar}
                      >
                        {!seller.photoBase64 && <MdPerson size={28} />}
                      </Avatar>
                    </Badge>
                    <Box className={styles.cardActions}>
                      <Tooltip title="Comissões e repasses">
                        <IconButton
                          size="small"
                          className={styles.financeBtn}
                          onClick={() => openFinance(seller)}
                        >
                          <MdPayments size={16} />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        className={styles.editBtn}
                        onClick={() => handleEdit(seller)}
                        title="Editar"
                      >
                        <MdEdit size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        className={styles.deleteBtn}
                        onClick={() =>
                          setDeleteDialog({
                            open: true,
                            id: seller.id,
                            name: seller.name,
                          })
                        }
                        title="Remover"
                      >
                        <MdDelete size={16} />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography className={styles.sellerName}>
                    {seller.name}
                  </Typography>
                  <Typography className={styles.sellerDoc}>
                    CPF: {seller.document}
                  </Typography>
                  <Typography className={styles.sellerEmail}>
                    {seller.email}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Box className={styles.contactChips}>
                    <Tooltip title={seller.phone}>
                      <Chip
                        icon={<FaWhatsapp color="#25D366" size={13} />}
                        label={seller.phone}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.72rem" }}
                      />
                    </Tooltip>
                    <Tooltip title={seller.pix}>
                      <Chip
                        icon={<FaPix color="#32bcad" size={13} />}
                        label={seller.pix}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.72rem", maxWidth: 160 }}
                      />
                    </Tooltip>
                  </Box>

                  {/* Financeiro resumido */}
                  <Box className={styles.financeResume}>
                    <Box className={styles.financeRow}>
                      <Box className={styles.financeItem}>
                        <Typography className={styles.financeLabel}>
                          Vendas
                        </Typography>
                        <Typography className={styles.financeValue}>
                          {count}
                        </Typography>
                      </Box>
                      <Box className={styles.financeItem}>
                        <Typography className={styles.financeLabel}>
                          Total vendido
                        </Typography>
                        <Typography className={styles.financeValue}>
                          {fmt(totalAmount)}
                        </Typography>
                      </Box>
                      <Box className={styles.financeItem}>
                        <Typography className={styles.financeLabel}>
                          Comissão
                        </Typography>
                        <Typography
                          className={styles.financeValue}
                          style={{ color: "#1967d2" }}
                        >
                          {commission}%
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Box className={styles.financeRow}>
                      <Box className={styles.financeItem}>
                        <Typography className={styles.financeLabel}>
                          A enviar
                        </Typography>
                        <Typography
                          className={styles.financeValue}
                          style={{ color: "#1e8e3e", fontWeight: 700 }}
                        >
                          {fmt(toSend)}
                        </Typography>
                      </Box>
                      <Box className={styles.financeItem}>
                        <Typography className={styles.financeLabel}>
                          Enviado
                        </Typography>
                        <Typography className={styles.financeValue}>
                          {fmt(sent)}
                        </Typography>
                      </Box>
                      <Box className={styles.financeItem}>
                        <Typography className={styles.financeLabel}>
                          Falta
                        </Typography>
                        <Typography
                          className={styles.financeValue}
                          style={{
                            color: remaining > 0 ? "#d93025" : "#1e8e3e",
                            fontWeight: 700,
                          }}
                        >
                          {remaining > 0 ? fmt(remaining) : "Quitado ✓"}
                        </Typography>
                      </Box>
                    </Box>

                    {toSend > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 0.3,
                          }}
                        >
                          <Typography
                            sx={{ fontSize: "0.7rem", color: "#90a4ae" }}
                          >
                            Progresso do repasse
                          </Typography>
                          <Typography
                            sx={{ fontSize: "0.7rem", color: "#90a4ae" }}
                          >
                            {Math.round(progress)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{
                            borderRadius: 4,
                            height: 6,
                            backgroundColor: "#e0e0e0",
                            "& .MuiLinearProgress-bar": {
                              backgroundColor:
                                progress >= 100 ? "#1e8e3e" : "#1967d2",
                            },
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Drawer: Cadastro / Edição
      ══════════════════════════════════════════════════════════════════════ */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={resetForm}
        PaperProps={{ className: styles.drawerPaper }}
      >
        <Box className={styles.drawerHeader}>
          <Typography className={styles.drawerTitle}>
            {editingId ? "Editar Vendedor" : "Novo Vendedor"}
          </Typography>
          <IconButton onClick={resetForm} size="small">
            <MdClose />
          </IconButton>
        </Box>
        <Divider />
        <Box className={styles.drawerContent}>
          {/* Foto */}
          <Box className={styles.photoArea}>
            <Box
              className={styles.photoUploadCircle}
              onClick={() => fileInputRef.current.click()}
            >
              {photoPreview ? (
                <Avatar
                  src={photoPreview}
                  className={styles.photoPreviewAvatar}
                />
              ) : (
                <Box className={styles.photoPlaceholder}>
                  <MdAddAPhoto size={28} color="#90a4ae" />
                  <Typography variant="caption" color="text.secondary" mt={0.5}>
                    Foto
                  </Typography>
                </Box>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handlePhotoChange}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {photoPreview ? "Clique para trocar" : "Opcional"}
            </Typography>
          </Box>

          <Box className={styles.fieldsStack}>
            <TextField
              label="Nome completo *"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              fullWidth
              disabled={loading}
              size="small"
            />
            <InputMask
              mask="999.999.999-99"
              value={form.document}
              onChange={(e) =>
                setForm((p) => ({ ...p, document: e.target.value }))
              }
              disabled={loading}
            >
              {(inputProps) => (
                <TextField
                  {...inputProps}
                  label="CPF *"
                  fullWidth
                  size="small"
                />
              )}
            </InputMask>
            <TextField
              label="E-mail *"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              fullWidth
              disabled={loading}
              size="small"
            />
            <InputMask
              mask="(99) 99999-9999"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
              disabled={loading}
            >
              {(inputProps) => (
                <TextField
                  {...inputProps}
                  label="Telefone / WhatsApp *"
                  fullWidth
                  size="small"
                />
              )}
            </InputMask>
            <TextField
              label="Chave Pix *"
              value={form.pix}
              onChange={(e) => setForm((p) => ({ ...p, pix: e.target.value }))}
              fullWidth
              disabled={loading}
              size="small"
              placeholder="CPF, e-mail, telefone ou chave aleatória"
            />
            <TextField
              label="Comissão (%)"
              value={form.commission}
              onChange={(e) =>
                setForm((p) => ({ ...p, commission: e.target.value }))
              }
              fullWidth
              disabled={loading}
              size="small"
              placeholder="Ex: 10"
              type="number"
              inputProps={{ min: 0, max: 100, step: 0.5 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <MdPercent size={16} color="#90a4ae" />
                  </InputAdornment>
                ),
              }}
              helperText="Percentual sobre o valor total de cada venda aprovada"
            />
          </Box>
        </Box>
        <Box className={styles.drawerFooter}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={resetForm}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            className={styles.saveBtn}
            startIcon={
              loading ? <CircularProgress size={14} color="inherit" /> : null
            }
          >
            {loading
              ? "Salvando..."
              : editingId
              ? "Salvar alterações"
              : "Cadastrar"}
          </Button>
        </Box>
      </Drawer>

      {/* ══════════════════════════════════════════════════════════════════════
          Modal: Financeiro do vendedor
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={!!financeModal}
        onClose={closeFinance}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {financeModal &&
          (() => {
            const { toSend, sent, remaining, progress, totalAmount, count } =
              getSellerFinance(financeModal);
            const commission = Number(financeModal.commission || 0);
            return (
              <>
                <DialogTitle sx={{ pb: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      src={financeModal.photoBase64 || undefined}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: "#e8f0fe",
                        color: "#1967d2",
                      }}
                    >
                      {!financeModal.photoBase64 && <MdPerson size={24} />}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={700} fontSize="1rem">
                        {financeModal.name}
                      </Typography>
                      <Typography fontSize="0.78rem" color="text.secondary">
                        Comissão: {commission}%
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={closeFinance}>
                      <MdClose />
                    </IconButton>
                  </Box>
                </DialogTitle>

                <DialogContent>
                  {/* Cards de resumo */}
                  <Box className={styles.financeCards}>
                    <Box
                      className={styles.financeCard}
                      style={{ borderColor: "#1967d2" }}
                    >
                      <Typography className={styles.fcLabel}>
                        Total vendido
                      </Typography>
                      <Typography className={styles.fcValue}>
                        {fmt(totalAmount)}
                      </Typography>
                      <Typography className={styles.fcSub}>
                        {count} venda{count !== 1 ? "s" : ""} aprovada
                        {count !== 1 ? "s" : ""}
                      </Typography>
                    </Box>
                    <Box
                      className={styles.financeCard}
                      style={{ borderColor: "#1e8e3e" }}
                    >
                      <Typography className={styles.fcLabel}>
                        Comissão total
                      </Typography>
                      <Typography
                        className={styles.fcValue}
                        style={{ color: "#1e8e3e" }}
                      >
                        {fmt(toSend)}
                      </Typography>
                      <Typography className={styles.fcSub}>
                        {commission}% sobre vendas
                      </Typography>
                    </Box>
                    <Box
                      className={styles.financeCard}
                      style={{
                        borderColor: remaining > 0 ? "#d93025" : "#1e8e3e",
                      }}
                    >
                      <Typography className={styles.fcLabel}>
                        Saldo restante
                      </Typography>
                      <Typography
                        className={styles.fcValue}
                        style={{ color: remaining > 0 ? "#d93025" : "#1e8e3e" }}
                      >
                        {remaining > 0 ? fmt(remaining) : "Quitado ✓"}
                      </Typography>
                      <Typography className={styles.fcSub}>
                        Enviado: {fmt(sent)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Barra de progresso */}
                  {toSend > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.5,
                        }}
                      >
                        <Typography fontSize="0.78rem" color="text.secondary">
                          Progresso do repasse
                        </Typography>
                        <Typography fontSize="0.78rem" color="text.secondary">
                          {Math.round(progress)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                          borderRadius: 4,
                          height: 8,
                          backgroundColor: "#e0e0e0",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor:
                              progress >= 100 ? "#1e8e3e" : "#1967d2",
                          },
                        }}
                      />
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* Novo lançamento */}
                  <Typography fontWeight={700} fontSize="0.9rem" mb={1.5}>
                    Registrar envio
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                    <TextField
                      label="Valor enviado (R$)"
                      value={paymentForm.amount}
                      onChange={(e) =>
                        setPaymentForm((p) => ({
                          ...p,
                          amount: e.target.value,
                        }))
                      }
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{ flex: 1 }}
                      disabled={paymentLoading}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddPayment}
                      disabled={paymentLoading}
                      startIcon={
                        paymentLoading ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : (
                          <MdAdd size={18} />
                        )
                      }
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        whiteSpace: "nowrap",
                        bgcolor: "#1967d2",
                      }}
                    >
                      Lançar
                    </Button>
                  </Box>
                  <TextField
                    label="Observação (opcional)"
                    value={paymentForm.note}
                    onChange={(e) =>
                      setPaymentForm((p) => ({ ...p, note: e.target.value }))
                    }
                    size="small"
                    fullWidth
                    disabled={paymentLoading}
                    sx={{ mb: 2 }}
                  />

                  <Divider sx={{ mb: 2 }} />

                  {/* Histórico */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <MdHistory size={18} color="#90a4ae" />
                    <Typography fontWeight={700} fontSize="0.9rem">
                      Histórico de envios
                    </Typography>
                  </Box>

                  {paymentFetching ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 2 }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  ) : payments.length === 0 ? (
                    <Typography
                      fontSize="0.85rem"
                      color="text.secondary"
                      textAlign="center"
                      py={2}
                    >
                      Nenhum envio registrado ainda.
                    </Typography>
                  ) : (
                    <Box className={styles.paymentList}>
                      {payments.map((p) => (
                        <Box key={p.id} className={styles.paymentItem}>
                          <Box>
                            <Typography
                              fontWeight={700}
                              fontSize="0.9rem"
                              color="#1e8e3e"
                            >
                              + {fmt(p.amount)}
                            </Typography>
                            {p.note && (
                              <Typography
                                fontSize="0.78rem"
                                color="text.secondary"
                              >
                                {p.note}
                              </Typography>
                            )}
                            <Typography
                              fontSize="0.72rem"
                              color="text.secondary"
                            >
                              {formatDate(p.createdAt)}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeletePayment(p.id, p.amount)}
                          >
                            <MdDelete size={16} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </DialogContent>
              </>
            );
          })()}
      </Dialog>

      {/* ── Dialog confirmar exclusão ── */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, name: "" })}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Remover vendedor</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja remover <strong>{deleteDialog.name}</strong>?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, id: null, name: "" })}
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Remover
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SellerSection;
