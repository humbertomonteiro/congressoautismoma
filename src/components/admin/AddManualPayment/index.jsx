// src/components/admin/AddManualPayment/index.jsx
import React, { useState, useEffect } from "react";
import styles from "./addManualPayment.module.css";
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import PaymentService from "../../../data/services/PaymentService";

const AddManualPayment = () => {
  const [manualCheckoutData, setManualCheckoutData] = useState({
    ticketQuantity: 1,
    participants: [
      { name: "", email: "", number: "", cpf: "", ticketType: "Inteira" },
    ],
    isCourtesy: false,
    coupon: "",
  });
  const [totals, setTotals] = useState({
    valueTicketsAll: "0.00",
    valueTicketsHalf: "0.00",
    discount: "0.00",
    total: "0.00",
    totalInCents: 0, // Adicionado pra consistência
  });
  const [loading, setLoading] = useState(false);

  const handleManualCheckoutChange = (field, value, index = null) => {
    if (index === null) {
      setManualCheckoutData((prev) => ({ ...prev, [field]: value }));
    } else {
      const updatedParticipants = [...manualCheckoutData.participants];
      updatedParticipants[index] = {
        ...updatedParticipants[index],
        [field]: value,
      };
      setManualCheckoutData((prev) => ({
        ...prev,
        participants: updatedParticipants,
      }));
    }
  };

  const handleAddParticipantToManualCheckout = () => {
    setManualCheckoutData((prev) => ({
      ...prev,
      participants: [
        ...prev.participants,
        { name: "", email: "", number: "", cpf: "", ticketType: "Inteira" },
      ],
      ticketQuantity: prev.ticketQuantity + 1,
    }));
  };

  const calculateTotalFromBackend = async () => {
    const { ticketQuantity, participants, isCourtesy, coupon } =
      manualCheckoutData;
    if (isCourtesy) {
      setTotals({
        valueTicketsAll: "0.00",
        valueTicketsHalf: "0.00",
        discount: "0.00",
        total: "0.00",
        totalInCents: 0,
      });
      return;
    }

    try {
      setLoading(true);
      const halfTickets = participants.filter(
        (p) => p.ticketType === "Meia"
      ).length;
      const response = await PaymentService.calculateTotals({
        ticketQuantity,
        halfTickets,
        coupon: coupon || "",
      });
      console.log("Resposta de calculateTotals:", response);
      setTotals(response); // Agora response é diretamente { valueTicketsAll, valueTicketsHalf, discount, total, totalInCents }
    } catch (error) {
      console.error("Erro ao calcular total:", error);
      setTotals({
        valueTicketsAll: "0.00",
        valueTicketsHalf: "0.00",
        discount: "0.00",
        total: "0.00",
        totalInCents: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateTotalFromBackend();
  }, [
    manualCheckoutData.ticketQuantity,
    manualCheckoutData.participants,
    manualCheckoutData.isCourtesy,
    manualCheckoutData.coupon,
  ]);

  const handleManualCheckout = async () => {
    const { ticketQuantity, participants, isCourtesy, coupon } =
      manualCheckoutData;
    if (participants.some((p) => !p.email || !p.name || !p.ticketType)) {
      console.error("Dados incompletos para checkout manual");
      alert(
        "Por favor, preencha todos os campos obrigatórios dos participantes."
      );
      return;
    }

    setLoading(true);
    try {
      const halfTickets = participants.filter(
        (p) => p.ticketType === "Meia"
      ).length;
      const fullTickets = ticketQuantity - halfTickets;

      const calculatedTotals = isCourtesy
        ? {
            valueTicketsAll: "0.00",
            valueTicketsHalf: "0.00",
            discount: "0.00",
            total: "0.00",
            totalInCents: 0,
          }
        : await PaymentService.calculateTotals({
            ticketQuantity,
            halfTickets,
            coupon: coupon || "",
          });

      const manualCheckout = {
        transactionId: `MANUAL_${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: "approved",
        paymentMethod: isCourtesy ? "courtesy" : "manual",
        totalAmount: calculatedTotals.total,
        eventName: "Congresso Autismo MA 2025",
        participants,
        paymentId: null,
        orderDetails: {
          ticketQuantity,
          fullTickets,
          halfTickets,
          fullTicketsValue: calculatedTotals.valueTicketsAll,
          halfTicketsValue: calculatedTotals.valueTicketsHalf,
          discount: calculatedTotals.discount,
          coupon: coupon || null,
        },
        paymentDetails: { manual: true, courtesy: isCourtesy },
        sentEmails: [],
      };

      console.log("Criando checkout manual:", manualCheckout);
      await addDoc(collection(db, "checkouts"), manualCheckout);
      setManualCheckoutData({
        ticketQuantity: 1,
        participants: [
          { name: "", email: "", number: "", cpf: "", ticketType: "Inteira" },
        ],
        isCourtesy: false,
        coupon: "",
      });
      setTotals({
        valueTicketsAll: "0.00",
        valueTicketsHalf: "0.00",
        discount: "0.00",
        total: "0.00",
        totalInCents: 0,
      });
      alert("Checkout manual adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar checkout manual:", error);
      alert("Erro ao adicionar checkout manual: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.title}>
        <h2>Adicionar Pagamento Manual</h2>
      </div>
      <div className={styles.headerInputs}>
        <FormControl className={styles.shortInput}>
          <InputLabel>Tipo de Checkout</InputLabel>
          <Select
            value={manualCheckoutData.isCourtesy ? "courtesy" : "paid"}
            onChange={(e) =>
              handleManualCheckoutChange(
                "isCourtesy",
                e.target.value === "courtesy"
              )
            }
            disabled={loading}
          >
            <MenuItem value="paid">Pago</MenuItem>
            <MenuItem value="courtesy">Cortesia</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Quantidade de Ingressos"
          value={manualCheckoutData.ticketQuantity}
          onChange={(e) =>
            handleManualCheckoutChange("ticketQuantity", Number(e.target.value))
          }
          type="number"
          className={styles.shortInput}
          disabled={manualCheckoutData.participants.length > 1 || loading}
        />
        {!manualCheckoutData.isCourtesy && (
          <TextField
            label="Cupom (opcional)"
            value={manualCheckoutData.coupon}
            onChange={(e) =>
              handleManualCheckoutChange("coupon", e.target.value)
            }
            className={styles.shortInput}
            disabled={loading}
          />
        )}
      </div>
      {manualCheckoutData.participants.map((participant, index) => (
        <div key={index} className={styles.participantSection}>
          <TextField
            label="Nome"
            value={participant.name}
            onChange={(e) =>
              handleManualCheckoutChange("name", e.target.value, index)
            }
            fullWidth
            margin="normal"
            disabled={loading}
          />
          <TextField
            label="Email"
            value={participant.email}
            onChange={(e) =>
              handleManualCheckoutChange("email", e.target.value, index)
            }
            fullWidth
            margin="normal"
            disabled={loading}
          />
          <div className={styles.shortInputsRow}>
            <TextField
              label="Telefone"
              value={participant.number}
              onChange={(e) =>
                handleManualCheckoutChange("number", e.target.value, index)
              }
              className={styles.shortInput}
              disabled={loading}
            />
            <TextField
              label="CPF"
              value={participant.cpf}
              onChange={(e) =>
                handleManualCheckoutChange("cpf", e.target.value, index)
              }
              className={styles.shortInput}
              disabled={loading}
            />
            {!manualCheckoutData.isCourtesy && (
              <FormControl className={styles.shortInput}>
                <InputLabel>Tipo de Ingresso</InputLabel>
                <Select
                  value={participant.ticketType}
                  onChange={(e) =>
                    handleManualCheckoutChange(
                      "ticketType",
                      e.target.value,
                      index
                    )
                  }
                  disabled={loading}
                >
                  <MenuItem value="Inteira">Inteira</MenuItem>
                  <MenuItem value="Meia">Meia</MenuItem>
                </Select>
              </FormControl>
            )}
          </div>
        </div>
      ))}
      <div className={styles.buttonGroup}>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleAddParticipantToManualCheckout}
          disabled={loading}
        >
          Adicionar Outro Participante
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleManualCheckout}
          disabled={loading}
        >
          {loading ? "Processando..." : "Finalizar"}
        </Button>
      </div>
      <p className={styles.total}>
        <strong>Total: R$ {loading ? "Calculando..." : totals.total}</strong>
      </p>
    </div>
  );
};

export default AddManualPayment;
