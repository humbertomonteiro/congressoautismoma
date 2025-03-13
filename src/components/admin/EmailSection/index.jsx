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

  // Função para determinar a cor baseada no status
  const getStatusColor = (template) => {
    if (template.sendType === "single") {
      return { borderLeft: "4px solid #bdbdbd" }; // Cinza para email único
    }
    switch (template.statusFilter) {
      case "approved":
        return { borderLeft: "4px solid #4caf50" }; // Verde claro
      case "pending":
        return { borderLeft: "4px solid #ffca28" }; // Amarelo claro
      case "error":
        return { borderLeft: "4px solid #f44336" }; // Vermelho claro
      default:
        return { borderLeft: "4px solid #bdbdbd" }; // Cinza padrão
    }
  };

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  };

  return (
    <div className={styles.container}>
      <h1>Gerenciar Templates de Email</h1>

      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpenModal(true)}
        sx={{ mb: 2 }}
      >
        Criar Novo Template
      </Button>

      <Grid container spacing={3}>
        {emailTemplates.map((template) => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                ...getStatusColor(template), // Aplica a cor baseada no status
                transition: "0.2s",
                "&:hover": { boxShadow: 6 },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" color="primary">
                  {template.subject}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Título: {template.title || "Sem título"}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {template.sendType === "single"
                    ? `Email: ${template.singleEmail || "-"}`
                    : `Filtro: ${template.statusFilter || "-"}`}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton onClick={() => handleEditTemplate(template)}>
                  <MdEdit />
                </IconButton>
                <IconButton onClick={() => handleDeleteTemplate(template.id)}>
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
        <Box sx={modalStyle}>
          <Typography variant="h6" gutterBottom>
            {editingTemplateId ? "Editar Template" : "Criar Template"}
          </Typography>
          <TextField
            label="Assunto"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            margin="normal"
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
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Tipo de Envio</InputLabel>
            <Select
              value={sendType}
              onChange={(e) => setSendType(e.target.value)}
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
            />
          )}
          {sendType === "status" && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Filtro de Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
            >
              {editingTemplateId ? "Atualizar" : "Criar"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                resetForm();
                setOpenModal(false);
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
