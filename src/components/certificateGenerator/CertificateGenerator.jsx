import React, { useState, useEffect } from "react";
import { Box, Container } from "@mui/material";
import CertificateService from "../../data/services/CertificateService";
import PdfService from "../../data/services/PdfService";
import AttemptsService from "../../data/services/AttemptsService";
import CertificateForm from "./CertificateForm";
import FeedbackAlert from "./FeedbackAlert";
import MismatchDialog from "./Dialogs/MismatchDialog";
import AlreadyIssuedDialog from "./Dialogs/AlreadyIssuedDialog";
import MaxAttemptsDialog from "./Dialogs/MaxAttemptsDialog";
import NotFoundDialog from "./Dialogs/NotFoundDialog";
import DataNotFoundDialog from "./Dialogs/DataNotFoundDialog";

const CertificateGenerator = () => {
  const [formData, setFormData] = useState({
    cpf: "",
    name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pdfData, setPdfData] = useState({ url: null, name: "" });
  const [dialogs, setDialogs] = useState({
    mismatch: false,
    alreadyIssued: false,
    maxAttempts: false,
    notFound: false,
    dataNotFound: false,
  });
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [windowLocation, setWindowLocation] = useState(null);

  const certificateService = new CertificateService();
  const pdfService = new PdfService();
  const attemptsService = new AttemptsService();
  const isCertificatePath = window.location.pathname !== "/dashboard";

  useEffect(() => {
    return () => {
      if (pdfData.url) {
        URL.revokeObjectURL(pdfData.url);
        console.log("URL do PDF revogada.");
      }
    };
  }, [pdfData.url]);

  useEffect(() => {
    setWindowLocation(window.location.pathname);
  }, []);

  const updateFormData = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openDialog = (dialogName) => {
    setDialogs((prev) => ({ ...prev, [dialogName]: true }));
  };

  const closeDialog = (dialogName) => () => {
    setDialogs((prev) => ({ ...prev, [dialogName]: false }));
  };

  const validateAttempts = async (cpf, checkoutId) => {
    if (!isCertificatePath || !cpf || !checkoutId) {
      console.log("Validação de tentativas ignorada: Dados insuficientes.", {
        cpf,
        checkoutId,
      });
      return true;
    }

    const attempts = await attemptsService.getAttempts(cpf, checkoutId);
    console.log("Tentativas verificadas:", {
      cpf,
      checkoutId,
      attemptsCount: attempts.length,
      attempts,
    });
    const remaining = 3 - attempts.length;
    setAttemptsRemaining(remaining);
    if (attempts.length >= 3) {
      openDialog("maxAttempts");
      return false;
    }
    return true;
  };

  const handleGenerateCertificate = async (
    cleanCpf,
    registeredCpf,
    name,
    checkoutId,
    checkoutData
  ) => {
    const { url, name: fileName } = await pdfService.generateCertificate(
      cleanCpf,
      name
    );
    setPdfData({ url, name: fileName });
    await certificateService.generateCertificate(
      cleanCpf,
      registeredCpf,
      name,
      checkoutId,
      checkoutData,
      windowLocation
    );
    setSuccess(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccess(false);
    try {
      const cleanCpf = formData.cpf.replace(/[^\d]/g, "");
      console.log("CPF limpo em handleSubmit:", cleanCpf);
      const result = await certificateService.searchParticipant(
        formData.name,
        cleanCpf
      );

      if (result.status === "already_issued" && isCertificatePath) {
        openDialog("alreadyIssued");
        return;
      }

      if (
        isCertificatePath &&
        (result.status === "success" || result.status === "mismatch") &&
        !(await validateAttempts(cleanCpf, result.checkoutId))
      ) {
        return;
      }

      if (result.status === "success") {
        await handleGenerateCertificate(
          cleanCpf,
          result.registeredCpf,
          formData.name,
          result.checkoutId,
          result.checkoutData
        );
      } else if (result.status === "mismatch") {
        if (isCertificatePath && result.checkoutId) {
          console.log("Salvando tentativa para mismatch:", {
            cleanCpf,
            name: formData.name,
            checkoutId: result.checkoutId,
          });
          await attemptsService.saveAttempt(
            cleanCpf,
            formData.name,
            result.checkoutId
          );
          await validateAttempts(cleanCpf, result.checkoutId);
          openDialog("mismatch");
        } else {
          openDialog("mismatch");
        }
      } else if (result.status === "not_found") {
        openDialog("notFound");
      }
    } catch (err) {
      console.error("Erro no handleSubmit:", err);
      setErrorMessage(
        err.message.includes("CPF inválido") ||
          err.message.includes("Participante não encontrado")
          ? "CPF inválido ou não encontrado. Verifique os dados e tente novamente."
          : err.message || "Erro ao processar o certificado."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNotFoundSubmit = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const cleanCpf = formData.cpf.replace(/[^\d]/g, "");
      console.log("CPF limpo em handleNotFoundSubmit:", cleanCpf);
      const result = await certificateService.searchParticipant(
        formData.name,
        cleanCpf,
        formData.email,
        formData.phone
      );

      if (result.status === "already_issued" && isCertificatePath) {
        openDialog("alreadyIssued");
        closeDialog("notFound")();
        return;
      }

      if (
        isCertificatePath &&
        (result.status === "success" || result.status === "mismatch") &&
        !(await validateAttempts(cleanCpf, result.checkoutId))
      ) {
        closeDialog("notFound")();
        return;
      }

      if (result.status === "success") {
        await handleGenerateCertificate(
          cleanCpf,
          result.registeredCpf,
          formData.name,
          result.checkoutId,
          result.checkoutData
        );
        closeDialog("notFound")();
      } else if (result.status === "mismatch") {
        if (isCertificatePath && result.checkoutId) {
          console.log("Salvando tentativa para mismatch em NotFound:", {
            cleanCpf,
            name: formData.name,
            checkoutId: result.checkoutId,
          });
          await attemptsService.saveAttempt(
            cleanCpf,
            formData.name,
            result.checkoutId
          );
          await validateAttempts(cleanCpf, result.checkoutId);
          closeDialog("notFound")();
          openDialog("mismatch");
        } else {
          closeDialog("notFound")();
          openDialog("mismatch");
        }
      } else {
        closeDialog("notFound")();
        openDialog("dataNotFound");
      }
    } catch (err) {
      console.error("Erro no handleNotFoundSubmit:", err);
      setErrorMessage(
        err.message.includes("CPF inválido") ||
          err.message.includes("Participante não encontrado")
          ? "CPF inválido ou não encontrado. Verifique os dados e tente novamente."
          : err.message || "Erro ao processar os dados."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualDownload = () => {
    if (pdfData.url && pdfData.name) {
      pdfService.downloadCertificate(pdfData);
    } else {
      setErrorMessage("Nenhum certificado disponível para download.");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        mt: windowLocation !== "/dashboard" ? 0 : 4,
      }}
    >
      <CertificateForm
        formData={formData}
        onChange={updateFormData}
        onSubmit={handleSubmit}
        loading={loading}
        errorMessage={errorMessage}
        success={success}
        handleManualDownload={handleManualDownload}
      />
      <MismatchDialog
        open={dialogs.mismatch}
        onClose={closeDialog("mismatch")}
        attemptsRemaining={attemptsRemaining}
      />
      <AlreadyIssuedDialog
        open={dialogs.alreadyIssued}
        onClose={closeDialog("alreadyIssued")}
      />
      <MaxAttemptsDialog
        open={dialogs.maxAttempts}
        onClose={closeDialog("maxAttempts")}
      />
      <NotFoundDialog
        open={dialogs.notFound}
        onClose={closeDialog("notFound")}
        formData={{ email: formData.email, phone: formData.phone }}
        onEmailChange={updateFormData("email")}
        onPhoneChange={updateFormData("phone")}
        onSubmit={handleNotFoundSubmit}
      />
      <DataNotFoundDialog
        open={dialogs.dataNotFound}
        onClose={closeDialog("dataNotFound")}
      />
    </Box>
  );
};

export default CertificateGenerator;
