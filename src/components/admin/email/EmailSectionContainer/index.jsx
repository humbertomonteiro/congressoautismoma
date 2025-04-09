import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Button, Typography, Grid } from "@mui/material";
import TemplateList from "../TemplateList";
import TemplateForm from "../TemplateForm";
import styles from "../EmailSection/emailSection.module.css";

const EmailSectionContainer = () => {
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [emailStats, setEmailStats] = useState({ availableForTemplates: 0 });
  const [statusCounts, setStatusCounts] = useState({
    approved: 0,
    pending: 0,
    error: 0,
  });

  const isProduction = import.meta.env.VITE_ENV === "production";
  const baseUrl = isProduction
    ? `${import.meta.env.VITE_BASE_URL_PRODUCTION}/email`
    : `${import.meta.env.VITE_BASE_URL_SANDBOX}/email`;

  useEffect(() => {
    fetchEmailTemplates();
    fetchEmailStats();
    const interval = setInterval(() => {
      fetchEmailStats();
      fetchEmailTemplates(); // Atualiza templates pra refletir progresso
    }, 10000); // Reduzi pra 10s pra ser mais responsivo, antes era 60s

    return () => clearInterval(interval);
  }, []);

  const fetchEmailTemplates = async () => {
    try {
      const response = await axios.get(`${baseUrl}/templates`);
      const templates = response.data.data || [];
      setEmailTemplates(templates);
      setStatusCounts({
        approved: templates.filter((t) => t.statusFilter === "approved").length,
        pending: templates.filter((t) => t.statusFilter === "pending").length,
        error: templates.filter((t) => t.statusFilter === "error").length,
      });
    } catch (error) {
      console.error("Erro ao carregar templates:", error);
      setEmailTemplates([]);
    }
  };

  const fetchEmailStats = async () => {
    try {
      const response = await axios.get(`${baseUrl}/stats`);
      const stats = response.data.data;
      console.log("Stats recebidos:", stats); // Log pra depurar
      setEmailStats({
        availableForTemplates:
          stats.availableForTemplates >= 0 ? stats.availableForTemplates : 2300,
      });
    } catch (error) {
      console.error("Erro ao carregar stats:", error);
      setEmailStats({ availableForTemplates: 2300 }); // Fallback
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplateId(template.id);
    setShowForm(true);
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      await axios.delete(`${baseUrl}/templates/${templateId}`);
      await fetchEmailTemplates();
    } catch (error) {
      console.error("Erro ao apagar template:", error);
    }
  };

  const handleSaveTemplate = async (templateData, sendImmediately) => {
    try {
      let templateId;
      if (editingTemplateId) {
        await axios.put(
          `${baseUrl}/templates/${editingTemplateId}`,
          templateData
        );
        templateId = editingTemplateId;
      } else {
        const response = await axios.post(`${baseUrl}/templates`, templateData);
        templateId = response.data.templateId;
      }

      if (sendImmediately) {
        await axios.post(`${baseUrl}/send-template-immediately`, {
          templateId,
        });
      }

      setShowForm(false);
      setEditingTemplateId(null);
      await fetchEmailTemplates();
      await fetchEmailStats(); // Atualiza stats após salvar/enviar
    } catch (error) {
      console.error("Erro ao salvar/enviar template:", error);
      await fetchEmailStats(); // Garante que stats sejam atualizados mesmo com erro
    }
  };

  return (
    <div className={styles.container}>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box>
          <h1>Gerenciar Emails</h1>{" "}
          <Typography variant="subtitle1" sx={{ color: "#2E7D32" }}>
            {emailStats.availableForTemplates} e-mails disponíveis para enviar
            hoje.
          </Typography>
        </Box>
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#1976D2",
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 500,
            height: "fit-content",
            "&:hover": { backgroundColor: "#1565C0" },
          }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Fechar Formulário" : "Novo Template"}
        </Button>
      </Box>

      {showForm && (
        <Box
          sx={{
            mb: 4,
            p: 3,
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <TemplateForm
            initialData={
              emailTemplates.find((t) => t.id === editingTemplateId) || {}
            }
            onSave={handleSaveTemplate}
            onCancel={() => {
              setShowForm(false);
              setEditingTemplateId(null);
            }}
            availableForTemplates={emailStats.availableForTemplates}
          />
        </Box>
      )}

      <Box
        sx={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          mb: 4,
          p: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: "#333333",
            fontWeight: 500,
            mb: 2,
            borderRadius: "12px",
          }}
        >
          Status dos Templates
        </Typography>
        <Typography variant="subtitle1" sx={{ color: "#666" }}>
          Templates criados: {emailTemplates.length} | Aprovados:{" "}
          {statusCounts.approved} | Pendentes: {statusCounts.pending} | Erros:{" "}
          {statusCounts.error}
        </Typography>
      </Box>

      <Box
        sx={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          mb: 4,
          p: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: "#333333",
            fontWeight: 500,
            mb: 2,
            borderRadius: "12px",
          }}
        >
          Lista de Templates{" "}
        </Typography>
        <TemplateList
          emailTemplates={emailTemplates}
          onEdit={handleEditTemplate}
          onDelete={handleDeleteTemplate}
        />
      </Box>
    </div>
  );
};

export default EmailSectionContainer;
