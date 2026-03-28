import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
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
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../../../../firebaseConfig";
import { toast } from "react-toastify";
import { MdDelete, MdEdit, MdAddAPhoto, MdPerson, MdVerified } from "react-icons/md";
import { FaWhatsapp, FaPix } from "react-icons/fa6";
import styles from "./sellerSection.module.css";

const EMPTY_FORM = {
  name: "",
  document: "",
  email: "",
  phone: "",
  pix: "",
  photoURL: "",
};

const SellerSection = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: "" });
  const fileInputRef = useRef();

  const fetchSellers = async () => {
    try {
      setFetching(true);
      const snap = await getDocs(collection(db, "sellers"));
      setSellers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      toast.error("Erro ao carregar vendedores.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Foto deve ter menos de 5MB.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async (sellerId) => {
    if (!photoFile) return form.photoURL || "";
    const storageRef = ref(storage, `sellers/${sellerId}_${Date.now()}`);
    await uploadBytes(storageRef, photoFile);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.document || !form.email || !form.phone || !form.pix) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        const photoURL = await uploadPhoto(editingId);
        await updateDoc(doc(db, "sellers", editingId), { ...form, photoURL });
        toast.success("Vendedor atualizado com sucesso!");
      } else {
        const docRef = await addDoc(collection(db, "sellers"), { ...form, photoURL: "" });
        const photoURL = await uploadPhoto(docRef.id);
        if (photoURL) await updateDoc(doc(db, "sellers", docRef.id), { photoURL });
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
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleEdit = (seller) => {
    setEditingId(seller.id);
    setForm({
      name: seller.name || "",
      document: seller.document || "",
      email: seller.email || "",
      phone: seller.phone || "",
      pix: seller.pix || "",
      photoURL: seller.photoURL || "",
    });
    setPhotoPreview(seller.photoURL || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async () => {
    const { id } = deleteDialog;
    setDeleteDialog({ open: false, id: null, name: "" });
    try {
      const seller = sellers.find((s) => s.id === id);
      if (seller?.photoURL) {
        try {
          const photoRef = ref(storage, seller.photoURL);
          await deleteObject(photoRef);
        } catch (_) {}
      }
      await deleteDoc(doc(db, "sellers", id));
      setSellers((prev) => prev.filter((s) => s.id !== id));
      toast.success("Vendedor removido.");
    } catch (err) {
      toast.error("Erro ao remover vendedor.");
    }
  };

  return (
    <Box className={styles.container}>
      {/* Form Card */}
      <Card className={styles.formCard}>
        <CardContent>
          <Typography variant="h6" className={styles.formTitle}>
            {editingId ? "✏️ Editar Vendedor" : "➕ Cadastrar Vendedor Credenciado"}
          </Typography>

          {/* Photo upload */}
          <Box className={styles.photoUploadArea} onClick={() => fileInputRef.current.click()}>
            {photoPreview ? (
              <Avatar src={photoPreview} className={styles.photoPreview} />
            ) : (
              <Box className={styles.photoPlaceholder}>
                <MdAddAPhoto size={32} />
                <span>Adicionar foto</span>
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
          {photoPreview && (
            <Typography variant="caption" className={styles.photoHint}>
              Clique na foto para trocar
            </Typography>
          )}

          <Box className={styles.fieldsGrid}>
            <TextField
              label="Nome completo *"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              fullWidth
              disabled={loading}
            />
            <InputMask
              mask="999.999.999-99"
              value={form.document}
              onChange={(e) => setForm((p) => ({ ...p, document: e.target.value }))}
              disabled={loading}
            >
              {(inputProps) => (
                <TextField {...inputProps} label="CPF *" fullWidth />
              )}
            </InputMask>
            <TextField
              label="E-mail *"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              fullWidth
              disabled={loading}
            />
            <InputMask
              mask="(99) 99999-9999"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              disabled={loading}
            >
              {(inputProps) => (
                <TextField {...inputProps} label="Telefone / WhatsApp *" fullWidth />
              )}
            </InputMask>
            <TextField
              label="Chave Pix *"
              value={form.pix}
              onChange={(e) => setForm((p) => ({ ...p, pix: e.target.value }))}
              fullWidth
              disabled={loading}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              className={styles.fullSpan}
            />
          </Box>

          <Box className={styles.formActions}>
            {editingId && (
              <Button variant="outlined" color="inherit" onClick={resetForm} disabled={loading}>
                Cancelar
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              className={styles.saveBtn}
            >
              {loading ? "Salvando..." : editingId ? "Salvar alterações" : "Cadastrar vendedor"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* List */}
      <Box className={styles.listHeader}>
        <Typography variant="h6">
          Vendedores cadastrados{" "}
          <Chip label={sellers.length} size="small" color="primary" />
        </Typography>
      </Box>

      {fetching ? (
        <Typography className={styles.emptyMsg}>Carregando...</Typography>
      ) : sellers.length === 0 ? (
        <Typography className={styles.emptyMsg}>
          Nenhum vendedor cadastrado ainda.
        </Typography>
      ) : (
        <Box className={styles.sellerGrid}>
          {sellers.map((seller) => (
            <Card key={seller.id} className={styles.sellerCard}>
              <CardContent className={styles.sellerContent}>
                <Avatar
                  src={seller.photoURL || undefined}
                  className={styles.sellerAvatar}
                >
                  {!seller.photoURL && <MdPerson size={28} />}
                </Avatar>
                <Box className={styles.sellerInfo}>
                  <Box className={styles.sellerNameRow}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {seller.name}
                    </Typography>
                    <MdVerified color="#1976D2" title="Credenciado" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    CPF: {seller.document}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {seller.email}
                  </Typography>
                  <Box className={styles.sellerIcons}>
                    <Tooltip title={seller.phone}>
                      <Chip
                        icon={<FaWhatsapp color="#25D366" />}
                        label={seller.phone}
                        size="small"
                        variant="outlined"
                      />
                    </Tooltip>
                    <Tooltip title={seller.pix}>
                      <Chip
                        icon={<FaPix color="#32bcad" />}
                        label={seller.pix}
                        size="small"
                        variant="outlined"
                      />
                    </Tooltip>
                  </Box>
                </Box>
                <Box className={styles.sellerActions}>
                  <IconButton size="small" onClick={() => handleEdit(seller)} title="Editar">
                    <MdEdit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() =>
                      setDeleteDialog({ open: true, id: seller.id, name: seller.name })
                    }
                    title="Remover"
                  >
                    <MdDelete />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Delete confirmation */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null, name: "" })}>
        <DialogTitle>Remover vendedor</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja remover <strong>{deleteDialog.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null, name: "" })}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Remover
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SellerSection;
