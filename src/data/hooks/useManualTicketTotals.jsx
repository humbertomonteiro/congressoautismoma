// src/hooks/useManualTicketTotals.js
import { useState, useEffect } from "react";
import PaymentService from "../services/PaymentService";

const useManualTicketTotals = (ticketQuantity, ticketTypes, coupon) => {
  const [totals, setTotals] = useState({
    valueTicketsAll: "0.00",
    valueTicketsHalf: "0.00",
    valueCourtesy: "0.00",
    valueEmployee: "0.00",
    discount: "0.00",
    total: "0.00",
    totalInCents: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTotals = async () => {
      const ticketQty = Number(ticketQuantity) || 0;
      if (ticketQty < 0) return;

      const halfTickets = ticketTypes.filter((t) => t === "Meia").length;

      try {
        setLoading(true);
        const response = await PaymentService.calculateTotals({
          ticketQuantity: ticketQty,
          halfTickets,
          coupon: coupon || "",
        });
        if (response.success) {
          setTotals(response.data);
        }
      } catch (error) {
        console.error("Erro ao calcular totais:", error);
        setTotals({
          valueTicketsAll: "0.00",
          valueTicketsHalf: "0.00",
          valueCourtesy: "0.00",
          valueEmployee: "0.00",
          discount: "0.00",
          total: "0.00",
          totalInCents: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTotals();
  }, [ticketQuantity, JSON.stringify(ticketTypes), coupon]);

  return { totals, loading };
};

export default useManualTicketTotals;
