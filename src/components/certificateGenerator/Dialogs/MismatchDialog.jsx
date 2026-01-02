import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

const MismatchDialog = ({ open, onClose, attemptsRemaining }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="mismatch-dialog-title"
      sx={{ "& .MuiDialog-paper": { borderRadius: "12px", p: 2 } }}
    >
      <DialogTitle id="mismatch-dialog-title">Nome Incorreto</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: "#555" }}>
          O primeiro nome fornecido não corresponde ao registrado.
          {attemptsRemaining > 0
            ? ` Você tem mais ${attemptsRemaining} tentativa${
                attemptsRemaining > 1 ? "s" : ""
              } para emitir o certificado.`
            : " Você atingiu o limite de tentativas. Entre em contato com o suporte."}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: "#1976D2",
            color: "#fff",
            borderRadius: "8px",
            textTransform: "none",
            "&:hover": { bgcolor: "#1565C0" },
          }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MismatchDialog;
