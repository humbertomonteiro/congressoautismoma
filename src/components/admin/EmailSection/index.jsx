import React, { useState, useEffect } from "react";
import { db } from "../../../../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import axios from "axios";
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import styles from "./emailSection.module.css";

const EmailSection = () => {
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendType, setSendType] = useState("single");
  const [singleEmail, setSingleEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [manualEmails, setManualEmails] = useState("");
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [emailAccounts, setEmailAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  const EMAIL_LIMIT_PER_ACCOUNT = 500;
  const MAX_ACCOUNTS = 5;

  useEffect(() => {
    const fetchData = async () => {
      // Templates de email
      const templatesSnapshot = await getDocs(collection(db, "emailTemplates"));
      setEmailTemplates(
        templatesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      // Contas de email
      const accountsSnapshot = await getDocs(collection(db, "emailAccounts"));
      setEmailAccounts(
        accountsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      // Processar envios automáticos
      await processAutomaticEmails();
    };
    fetchData();

    // Configurar intervalo para verificar novos checkouts periodicamente
    const interval = setInterval(() => processAutomaticEmails(), 60000); // A cada 1 minuto
    return () => clearInterval(interval);
  }, []);

  const processAutomaticEmails = async () => {
    console.log("Iniciando processamento automático de emails...");
    try {
      const checkoutsSnapshot = await getDocs(collection(db, "checkouts"));
      const checkouts = checkoutsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Checkouts encontrados:", checkouts.length);

      for (const template of emailTemplates) {
        console.log("Processando template:", template.id, template.subject);
        let recipients = [];
        if (template.sendType === "single") {
          recipients = [{ email: template.singleEmail }];
          console.log("Destinatário único:", template.singleEmail);
        } else if (template.sendType === "status") {
          // Filtra apenas checkouts que correspondem ao status e ainda não receberam ESTE template
          recipients = checkouts
            .filter((c) => {
              const matchesStatus = c.status === template.statusFilter;
              const notSentYet = !c.sentEmails?.includes(template.id);
              return matchesStatus && notSentYet;
            })
            .map((c) => c.participants[0]);
          console.log(
            `Destinatários para ${template.statusFilter} (template ${template.id}):`,
            recipients.length
          );
        } else if (template.sendType === "manual") {
          recipients = template.manualEmails
            .split(",")
            .map((email) => ({ email: email.trim() }));
          console.log("Destinatários manuais:", recipients.length);
        }

        if (recipients.length > 0) {
          console.log(
            "Enviando emails do template",
            template.id,
            "para:",
            recipients.map((r) => r.email)
          );
          await sendEmails(template, recipients, checkouts);
        } else {
          console.log(
            "Nenhum destinatário encontrado para o template:",
            template.id
          );
        }
      }
    } catch (error) {
      console.error("Erro ao processar emails automáticos:", error);
    }
  };

  const sendEmails = async (template, recipients, checkouts) => {
    const totalEmails = recipients.length;
    const emailsPerAccount = Math.ceil(totalEmails / emailAccounts.length);
    let sentEmails = [];

    for (const account of emailAccounts) {
      const accountEmails = recipients.slice(
        sentEmails.length,
        sentEmails.length + emailsPerAccount
      );
      if (accountEmails.length === 0) break;

      const emailData = {
        from: account.email,
        to: accountEmails.map((r) => r.email),
        subject: template.subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h1 style="color: #2c3e50;">Congresso Autismo MA 2025</h1>
            <p style="color: #555;">${template.body.replace(/\n/g, "<br>")}</p>
            <div style="text-align: center; padding-top: 20px; color: #7f8c8d; font-size: 12px;">
              <p>Equipe Congresso Autismo MA</p>
              <p><a href="mailto:suporte@congressoautismoma.com.br" style="color: #3498db;">suporte@congressoautismoma.com.br</a></p>
            </div>
          </div>
        `,
      };

      const response = await axios.post(
        "http://localhost:5000/api/payments/send-email",
        emailData
      ); // URL fixa do backend
      if (response.status === 200) {
        sentEmails = sentEmails.concat(accountEmails);

        for (const recipient of accountEmails) {
          const checkout = checkouts.find((c) =>
            c.participants.some((p) => p.email === recipient.email)
          );
          if (checkout) {
            const checkoutRef = doc(db, "checkouts", checkout.id);
            const sentEmails = checkout.sentEmails || [];
            if (!sentEmails.includes(template.id)) {
              await updateDoc(checkoutRef, {
                sentEmails: [...sentEmails, template.id],
              });
            }
          }
        }

        await addDoc(collection(db, "emailHistory"), {
          subject: template.subject,
          body: template.body,
          filter:
            template.sendType === "status"
              ? template.statusFilter
              : template.sendType,
          recipients: accountEmails.map((r) => r.email),
          timestamp: new Date().toISOString(),
          account: account.email,
        });
      }
    }
  };
  const handleCreateTemplate = async () => {
    if (!emailSubject || !emailBody) {
      alert("Preencha o assunto e o corpo do email!");
      return;
    }

    setLoading(true);
    try {
      const templateData = {
        subject: emailSubject,
        body: emailBody,
        sendType,
        singleEmail: sendType === "single" ? singleEmail : "",
        statusFilter: sendType === "status" ? statusFilter : "",
        manualEmails: sendType === "manual" ? manualEmails : "",
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(
        collection(db, "emailTemplates"),
        templateData
      );
      setEmailTemplates([
        ...emailTemplates,
        { id: docRef.id, ...templateData },
      ]);

      setEmailSubject("");
      setEmailBody("");
      setSingleEmail("");
      setManualEmails("");
      setStatusFilter("");
      alert("Template de email criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar template de email:", error);
      alert("Erro ao criar template. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>Gerenciar Emails</h1>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6">Criar Novo Template de Email</Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Tipo de Envio</InputLabel>
          <Select
            value={sendType}
            onChange={(e) => setSendType(e.target.value)}
            label="Tipo de Envio"
          >
            <MenuItem value="single">Único Contato</MenuItem>
            <MenuItem value="status">Filtrado por Status</MenuItem>
            <MenuItem value="manual">Emails Manuais</MenuItem>
          </Select>
        </FormControl>

        {sendType === "single" && (
          <TextField
            label="Email do Contato"
            fullWidth
            value={singleEmail}
            onChange={(e) => setSingleEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
        )}
        {sendType === "status" && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Filtro de Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Filtro de Status"
            >
              <MenuItem value="success">Aprovado</MenuItem>
              <MenuItem value="pending">Pendente</MenuItem>
              <MenuItem value="error">Erro</MenuItem>
            </Select>
          </FormControl>
        )}
        {sendType === "manual" && (
          <TextField
            label="Emails (separados por vírgula)"
            fullWidth
            value={manualEmails}
            onChange={(e) => setManualEmails(e.target.value)}
            sx={{ mb: 2 }}
          />
        )}

        <TextField
          label="Assunto"
          fullWidth
          value={emailSubject}
          onChange={(e) => setEmailSubject(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Corpo do Email"
          fullWidth
          multiline
          rows={6}
          value={emailBody}
          onChange={(e) => setEmailBody(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateTemplate}
          disabled={loading}
        >
          {loading ? "Criando..." : "Criar Template"}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={processAutomaticEmails}
          sx={{ mt: 2 }}
        >
          Testar Envio Manual
        </Button>
      </Box>

      <Typography variant="h6">Templates de Email</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Assunto</TableCell>
              <TableCell>Tipo de Envio</TableCell>
              <TableCell>Filtro/Emails</TableCell>
              <TableCell>Data de Criação</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {emailTemplates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>{template.subject}</TableCell>
                <TableCell>{template.sendType}</TableCell>
                <TableCell>
                  {template.sendType === "single"
                    ? template.singleEmail
                    : template.sendType === "status"
                    ? template.statusFilter
                    : template.manualEmails}
                </TableCell>
                <TableCell>
                  {new Date(template.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default EmailSection;
