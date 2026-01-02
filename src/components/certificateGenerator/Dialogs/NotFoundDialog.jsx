import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
} from "@mui/material";

const NotFoundDialog = ({
  open,
  onClose,
  formData,
  onEmailChange,
  onPhoneChange,
  onSubmit,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    PaperProps={{ sx: { borderRadius: "12px" } }}
  >
    <DialogTitle>CPF Não Encontrado</DialogTitle>
    <DialogContent>
      <Typography>
        Insira o e-mail e o número de celular utilizados no cadastro para que
        possamos buscar seus dados.
      </Typography>
      <TextField
        label="E-mail"
        value={formData.email}
        onChange={(e) => onEmailChange(e.target.value)}
        fullWidth
        margin="normal"
        required
        variant="outlined"
        InputProps={{ sx: { borderRadius: "8px" } }}
      />
      <TextField
        label="Celular"
        value={formData.phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        fullWidth
        margin="normal"
        required
        variant="outlined"
        helperText="Exemplo: (99) 99999-9999"
        InputProps={{ sx: { borderRadius: "8px" } }}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} sx={{ color: "#555" }}>
        Cancelar
      </Button>
      <Button
        onClick={onSubmit}
        variant="contained"
        sx={{ bgcolor: "#1976D2", "&:hover": { bgcolor: "#1565C0" } }}
      >
        Verificar
      </Button>
    </DialogActions>
  </Dialog>
);

export default NotFoundDialog;
