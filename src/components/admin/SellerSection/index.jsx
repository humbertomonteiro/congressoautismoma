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
} from "@mui/material";
import InputMask from "react-input-mask";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
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
} from "react-icons/md";
import { FaWhatsapp, FaPix } from "react-icons/fa6";
import styles from "./sellerSection.module.css";

const EMPTY_FORM = {
  name: "",
  document: "",
  email: "",
  phone: "",
  pix: "",
  photoBase64: "",
};

// Comprime e converte imagem para base64 (max 700px, qualidade 0.75)
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

const SellerSection = () => {
  const [sellers, setSellers] = useState([]);
  const [salesMap, setSalesMap] = useState({});
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
  const fileInputRef = useRef();

  const fetchSellers = async () => {
    try {
      setFetching(true);
      const snap = await getDocs(collection(db, "sellers"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSellers(list);

      // Conta vendas por nome do vendedor
      const checkoutSnap = await getDocs(collection(db, "checkouts"));
      const counts = {};
      checkoutSnap.docs.forEach((d) => {
        const sellerName = d.data()?.seller?.name;
        if (sellerName) counts[sellerName] = (counts[sellerName] || 0) + 1;
      });
      setSalesMap(counts);
    } catch {
      toast.error("Erro ao carregar vendedores.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

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
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "sellers", editingId), form);
        toast.success("Vendedor atualizado com sucesso!");
      } else {
        await addDoc(collection(db, "sellers"), form);
        toast.success("Vendedor cadastrado com sucesso!");
      }
      resetForm();
      fetchSellers();
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

  // Métricas
  const totalVendas = sellers.reduce(
    (acc, s) => acc + (salesMap[s.name] || 0),
    0
  );
  const topSeller = sellers.reduce(
    (best, s) => {
      const count = salesMap[s.name] || 0;
      return count > best.count ? { name: s.name, count } : best;
    },
    { name: "—", count: 0 }
  );

  // Busca local (nome, email, CPF, telefone, pix)
  const filteredSellers = search.trim()
    ? sellers.filter((s) =>
        [s.name, s.email, s.document, s.phone, s.pix]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : sellers;

  return (
    <Box className={styles.container}>
      {/* ── Header ── */}
      <Box className={styles.pageHeader}>
        <Box>
          <Typography className={styles.pageTitle}>Vendedores</Typography>
          <Typography className={styles.pageSubtitle}>
            Gerencie os vendedores credenciados do evento
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
              Total de vendas
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
            const salesCount = salesMap[seller.name] || 0;
            return (
              <Box key={seller.id} className={styles.sellerCard}>
                <Box className={styles.cardAccent} />
                <Box className={styles.cardBody}>
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

                  <Box className={styles.salesBadge}>
                    <Typography className={styles.salesCount}>
                      {salesCount}
                    </Typography>
                    <Typography className={styles.salesLabel}>
                      {salesCount === 1
                        ? "venda realizada"
                        : "vendas realizadas"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* ── Drawer Cadastro / Edição ── */}
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
