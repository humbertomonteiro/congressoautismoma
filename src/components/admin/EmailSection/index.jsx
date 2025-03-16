import React, { useState, useEffect } from "react";
import styles from "./emailSection.module.css";
import { db } from "../../../../firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import axios from "axios";
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Modal,
  Box,
  IconButton,
} from "@mui/material";
import { MdDelete, MdEdit } from "react-icons/md";

const EmailSection = () => {
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sendType, setSendType] = useState("single");
  const [singleEmail, setSingleEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const isProduction = import.meta.env.VITE_ENV === "production";
  const baseUrl = isProduction
    ? import.meta.env.VITE_BASE_URL_PRODUCTION
    : import.meta.env.VITE_BASE_URL_SANDBOX;

  useEffect(() => {
    fetchEmailTemplates();
  }, []);

  const fetchEmailTemplates = async () => {
    try {
      const snapshot = await getDocs(collection(db, "emailTemplates"));
      const templates = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEmailTemplates(templates);
    } catch (error) {
      console.error("Erro ao carregar templates:", error);
    }
  };

  const handleCreateOrUpdateTemplate = async (sendImmediately = false) => {
    try {
      const templateData = {
        subject,
        title,
        body,
        sendType,
        singleEmail: sendType === "single" ? singleEmail : null,
        statusFilter: sendType === "status" ? statusFilter : null,
        createdAt: editingTemplateId
          ? emailTemplates.find((t) => t.id === editingTemplateId).createdAt
          : new Date().toISOString(),
      };

      let templateId;
      if (editingTemplateId) {
        const templateRef = doc(db, "emailTemplates", editingTemplateId);
        await updateDoc(templateRef, templateData);
        templateId = editingTemplateId;
      } else {
        const docRef = await addDoc(
          collection(db, "emailTemplates"),
          templateData
        );
        templateId = docRef.id;
      }

      if (sendImmediately) {
        await axios.post(baseUrl, { templateId });
      }

      resetForm();
      setOpenModal(false);
      await fetchEmailTemplates();
    } catch (error) {
      console.error("Erro ao criar/atualizar/enviar template:", error);
    }
  };

  const handleEditTemplate = (template) => {
    setSubject(template.subject);
    setTitle(template.title || "");
    setBody(template.body);
    setSendType(template.sendType);
    setSingleEmail(template.singleEmail || "");
    setStatusFilter(template.statusFilter || "");
    setEditingTemplateId(template.id);
    setOpenModal(true);
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      await deleteDoc(doc(db, "emailTemplates", templateId));
      await fetchEmailTemplates();
    } catch (error) {
      console.error("Erro ao apagar template:", error);
    }
  };

  const resetForm = () => {
    setSubject("");
    setTitle("");
    setBody("");
    setSendType("single");
    setSingleEmail("");
    setStatusFilter("");
    setEditingTemplateId(null);
  };

  const getStatusColor = (template) => {
    if (template.sendType === "single") {
      return { borderLeft: "6px solid #B0BEC5" }; // Cinza azulado neutro
    }
    switch (template.statusFilter) {
      case "approved":
        return { borderLeft: "6px solid #2E7D32" }; // Verde vibrante
      case "pending":
        return { borderLeft: "6px solid #FFB300" }; // Amarelo quente
      case "error":
        return { borderLeft: "6px solid #D32F2F" }; // Vermelho intenso
      default:
        return { borderLeft: "6px solid #B0BEC5" }; // Cinza padrão
    }
  };

  return (
    <div
      className={styles.container}
      style={{
        backgroundColor: "#F5F7FA",
        padding: "20px",
        borderRadius: "12px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <h1>Gerenciar Email</h1>

        <Button
          variant="contained"
          sx={{
            backgroundColor: "#1976D2",
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 500,
            "&:hover": { backgroundColor: "#1565C0" },
          }}
          onClick={() => setOpenModal(true)}
        >
          Novo Template
        </Button>
      </Box>

      <Grid container spacing={3}>
        {emailTemplates.map((template) => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <Card
              sx={{
                p: 2,
                height: "100%",
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                border: "1px solid #c2c2c2",
                ...getStatusColor(template),
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 0 }}>
                <Typography
                  variant="h6"
                  sx={{ color: "#333333", fontWeight: 500, mb: 1 }}
                >
                  {template.subject}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#666666", fontSize: "0.9rem" }}
                >
                  <strong>Título:</strong> {template.title || "Sem título"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#666666", fontSize: "0.9rem" }}
                >
                  {template.sendType === "single"
                    ? `Email: ${template.singleEmail || "-"}`
                    : `Filtro: ${template.statusFilter || "-"}`}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "flex-end", p: 0 }}>
                <IconButton
                  onClick={() => handleEditTemplate(template)}
                  sx={{ color: "#1976D2", "&:hover": { color: "#1565C0" } }}
                >
                  <MdEdit />
                </IconButton>
                <IconButton
                  onClick={() => handleDeleteTemplate(template.id)}
                  sx={{ color: "#D32F2F", "&:hover": { color: "#B71C1C" } }}
                >
                  <MdDelete />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Modal para criar/editar */}
      <Modal
        open={openModal}
        onClose={() => {
          resetForm();
          setOpenModal(false);
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            height: "90vh",
            overflowY: "scroll",
            transform: "translate(-50%, -50%)",
            width: 450,
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
            {editingTemplateId ? "Editar Template" : "Criar Template"}
          </Typography>
          <TextField
            label="Assunto"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            margin="normal"
            required
            sx={{ backgroundColor: "#FAFAFA", borderRadius: "8px" }}
          />
          <TextField
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            margin="normal"
            sx={{ backgroundColor: "#FAFAFA", borderRadius: "8px" }}
          />
          <TextField
            label="Corpo (use {{nome}} para o nome)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            fullWidth
            multiline
            rows={4}
            margin="normal"
            required
            sx={{ backgroundColor: "#FAFAFA", borderRadius: "8px" }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel sx={{ color: "#666666" }}>Tipo de Envio</InputLabel>
            <Select
              value={sendType}
              onChange={(e) => setSendType(e.target.value)}
              sx={{ backgroundColor: "#FAFAFA", borderRadius: "8px" }}
            >
              <MenuItem value="single">Email Único</MenuItem>
              <MenuItem value="status">Por Status</MenuItem>
            </Select>
          </FormControl>
          {sendType === "single" && (
            <TextField
              label="Email Único"
              value={singleEmail}
              onChange={(e) => setSingleEmail(e.target.value)}
              fullWidth
              margin="normal"
              sx={{ backgroundColor: "#FAFAFA", borderRadius: "8px" }}
            />
          )}
          {sendType === "status" && (
            <FormControl fullWidth margin="normal">
              <InputLabel sx={{ color: "#666666" }}>
                Filtro de Status
              </InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ backgroundColor: "#FAFAFA", borderRadius: "8px" }}
              >
                <MenuItem value="approved">Aprovado</MenuItem>
                <MenuItem value="pending">Pendente</MenuItem>
                <MenuItem value="error">Erro</MenuItem>
              </Select>
            </FormControl>
          )}
          <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => handleCreateOrUpdateTemplate(false)}
              sx={{
                backgroundColor: "#1976D2",
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 500,
                "&:hover": { backgroundColor: "#1565C0" },
              }}
            >
              {editingTemplateId ? "Atualizar" : "Criar"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                resetForm();
                setOpenModal(false);
              }}
              sx={{
                borderColor: "#1976D2",
                color: "#1976D2",
                borderRadius: "8px",
                textTransform: "none",
                "&:hover": { borderColor: "#1565C0", color: "#1565C0" },
              }}
            >
              Cancelar
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default EmailSection;
