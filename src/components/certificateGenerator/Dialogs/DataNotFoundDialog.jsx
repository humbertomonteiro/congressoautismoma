import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

const DataNotFoundDialog = ({ open, onClose }) => (
  <Dialog
    open={open}
    onClose={onClose}
    PaperProps={{ sx: { borderRadius: "12px" } }}
  >
    <DialogTitle sx={{ bgcolor: "#FFEBEE", color: "#D32F2F" }}>
      Dados Não Encontrados
    </DialogTitle>
    <DialogContent sx={{ mt: 2 }}>
      <Typography>
        Nenhum participante encontrado com os dados fornecidos. Entre em contato
        com o suporte.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} sx={{ color: "#555" }}>
        Fechar
      </Button>
      <Button
        href="https://api.whatsapp.com/send?phone=5598991058908&text=Ol%C3%A1!%20Gostaria%20de%20falar%20com%20voc%C3%AAs.%20"
        variant="contained"
        sx={{ bgcolor: "#1976D2", "&:hover": { bgcolor: "#1565C0" } }}
      >
        Falar com o Suporte
      </Button>
    </DialogActions>
  </Dialog>
);

export default DataNotFoundDialog;
