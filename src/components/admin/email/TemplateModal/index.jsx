import React from "react";
import { Modal, Box, Typography } from "@mui/material";
import TemplateForm from "../TemplateForm";

const TemplateModal = ({
  open,
  onClose,
  onSave,
  initialData,
  availableForTemplates,
}) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          height: "90vh",
          overflowY: "scroll",
          transform: "translate(-50%, -50%)",
          width: 600,
          bgcolor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          p: 4,
        }}
      >
        <Typography
          variant="h6"
          sx={{ color: "#333333", fontWeight: 500, mb: 2 }}
        >
          {initialData.id ? "Editar Template" : "Criar Template"}
        </Typography>
        <TemplateForm
          initialData={initialData}
          onSave={onSave}
          onCancel={onClose}
          availableForTemplates={availableForTemplates}
        />
      </Box>
    </Modal>
  );
};

export default TemplateModal;
