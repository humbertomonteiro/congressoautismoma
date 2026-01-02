import React from "react";
import { Alert, Button } from "@mui/material";

const FeedbackAlert = ({ type, message, handleManualDownload }) => (
  <Alert
    severity={type}
    sx={{
      mt: 2,
      width: "100%",
      borderRadius: "8px",
      bgcolor: type === "error" ? "#FFEBEE" : "#48c24e",
      boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
      color: "#fff",
    }}
    action={
      type === "error" ? (
        <Button
          href="https://api.whatsapp.com/send?phone=5598991058908&text=Ol%C3%A1!%20Gostaria%20de%20falar%20com%20voc%C3%AAs.%20r"
          sx={{ color: "#fff", fontWeight: 500 }}
        >
          Falar com o Suporte
        </Button>
      ) : (
        handleManualDownload && (
          <Button
            onClick={handleManualDownload}
            sx={{ color: "#fff", fontWeight: 500 }}
          >
            Baixar Certificado
          </Button>
        )
      )
    }
  >
    {message}
  </Alert>
);

export default FeedbackAlert;
