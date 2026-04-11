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
  Avatar,
} from "@mui/material";
import { MdEdit, MdDelete, MdPersonAdd, MdClose } from "react-icons/md";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import UserService from "../../../data/services/UserService";
import { toast } from "react-toastify";

const ROLE_LABELS = {
  adm: "Administrador",
  viewer: "Visualizador",
  scanner: "Scanner",
  vendedor: "Vendedor",
};

const ROLE_COLORS = {
  adm: "error",
  viewer: "info",
  scanner: "success",
  vendedor: "warning",
};

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "viewer",
  sellerId: "",
  sellerName: "",
};

const UserManagementSection = () => {
  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUid, setEditingUid] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, uid: null, name: "" });

  const fetchUsers = async () => {
    try {
      const data = await UserService.listUsers();
      setUsers(data || []);
    } catch (err) {
      toast.error("Erro ao carregar usuários: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellers = async () => {
    const snap = await getDocs(collection(db, "sellers"));
    setSellers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchUsers();
    fetchSellers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUid(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUid(user.uid || user.id);
    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "viewer",
      sellerId: user.sellerId || "",
      sellerName: user.sellerName || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.role) {
      toast.error("Nome e role são obrigatórios.");
      return;
    }
    if (!editingUid && (!form.email || !form.password)) {
      toast.error("E-mail e senha são obrigatórios para novo usuário.");
      return;
    }
    if (form.role === "vendedor" && !form.sellerId) {
      toast.error("Selecione o vendedor vinculado.");
      return;
    }

    setSaving(true);
    try {
      const selectedSeller = sellers.find((s) => s.id === form.sellerId);
      const payload = {
        name: form.name,
        role: form.role,
        sellerId: form.role === "vendedor" ? form.sellerId : undefined,
        sellerName: form.role === "vendedor" ? (selectedSeller?.name || "") : undefined,
      };

      if (editingUid) {
        await UserService.updateUser(editingUid, payload);
        toast.success("Usuário atualizado!");
      } else {
        await UserService.createUser({ ...payload, email: form.email, password: form.password });
        toast.success("Usuário criado!");
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await UserService.deleteUser(deleteDialog.uid);
      toast.success("Usuário removido.");
      setDeleteDialog({ open: false, uid: null, name: "" });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "#333" }}>
            Gerenciar Usuários
          </Typography>
          <Typography variant="body2" sx={{ color: "#666", mt: 0.5 }}>
            Controle de acesso por perfil de usuário
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<MdPersonAdd />}
          onClick={handleOpenCreate}
          sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 500 }}
        >
          Novo Usuário
        </Button>
      </Box>

      {/* Legenda de roles */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <Chip key={role} label={label} color={ROLE_COLORS[role]} size="small" variant="outlined" />
        ))}
      </Box>

      {/* Tabela */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#F5F5F5" }}>
                <TableCell sx={{ fontWeight: "bold" }}>Usuário</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>E-mail</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Perfil</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Vendedor vinculado</TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: "#999" }}>
                    Nenhum usuário cadastrado.
                  </TableCell>
                </TableRow>
              )}
              {users.map((user) => (
                <TableRow key={user.id || user.uid} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: "0.85rem", bgcolor: "#1976D2" }}>
                        {(user.name || "?")[0].toUpperCase()}
                      </Avatar>
                      <Typography sx={{ fontSize: "0.9rem", fontWeight: 500 }}>
                        {user.name || "Sem nome"}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.85rem", color: "#555" }}>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={ROLE_LABELS[user.role] || user.role}
                      color={ROLE_COLORS[user.role] || "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.85rem", color: user.sellerName ? "#333" : "#bbb" }}>
                    {user.sellerName || "—"}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" sx={{ color: "#1976D2" }} onClick={() => handleOpenEdit(user)}>
                      <MdEdit size={18} />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{ color: "#D32F2F", ml: 0.5 }}
                      onClick={() => setDeleteDialog({ open: true, uid: user.uid || user.id, name: user.name })}
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {editingUid ? "Editar Usuário" : "Novo Usuário"}
          <IconButton size="small" onClick={() => setDialogOpen(false)}>
            <MdClose />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <TextField
            label="Nome"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            fullWidth
            required
          />
          {!editingUid && (
            <>
              <TextField
                label="E-mail"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                fullWidth
                required
              />
              <TextField
                label="Senha"
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                fullWidth
                required
                helperText="Mínimo 6 caracteres"
              />
            </>
          )}
          <FormControl fullWidth required>
            <InputLabel>Perfil de Acesso</InputLabel>
            <Select
              value={form.role}
              label="Perfil de Acesso"
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value, sellerId: "", sellerName: "" }))}
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip label={label} color={ROLE_COLORS[value]} size="small" />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {form.role === "vendedor" && (
            <FormControl fullWidth required>
              <InputLabel>Vendedor vinculado</InputLabel>
              <Select
                value={form.sellerId}
                label="Vendedor vinculado"
                onChange={(e) => {
                  const sel = sellers.find((s) => s.id === e.target.value);
                  setForm((p) => ({ ...p, sellerId: e.target.value, sellerName: sel?.name || "" }));
                }}
              >
                {sellers.length === 0 && (
                  <MenuItem disabled value="">
                    Nenhum vendedor cadastrado
                  </MenuItem>
                )}
                {sellers.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} — CPF: {s.document}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Descrição da role selecionada */}
          <Box sx={{ p: 1.5, bgcolor: "#F5F5F5", borderRadius: "8px" }}>
            <Typography variant="body2" sx={{ color: "#555", fontSize: "0.82rem" }}>
              {form.role === "adm" && "Acesso total: pode ver, criar, editar e excluir tudo."}
              {form.role === "viewer" && "Apenas visualização: pode ver dados mas não pode editar ou excluir."}
              {form.role === "scanner" && "Acesso restrito ao credenciamento (QR Code)."}
              {form.role === "vendedor" && "Acesso restrito ao pagamento manual. Sempre vinculado a um vendedor cadastrado."}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ textTransform: "none" }}>
            {saving ? <CircularProgress size={20} /> : editingUid ? "Salvar" : "Criar Usuário"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog confirmar exclusão */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, uid: null, name: "" })}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja remover o usuário <strong>{deleteDialog.name}</strong>? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, uid: null, name: "" })}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} sx={{ textTransform: "none" }}>
            Remover
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagementSection;
