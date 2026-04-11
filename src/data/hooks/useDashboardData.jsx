import { useState, useEffect } from "react";
import { db } from "../../../firebaseConfig";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  setDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import PaymentService from "../services/PaymentService";
import { toast } from "react-toastify";

const formatToBrazilianCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

/**
 * Busca participantes da subcoleção checkouts/{id}/participants.
 * Se o checkout ainda tiver participants embutido (legado), retorna ele.
 */
// ─── CORRIGIDO: sem where inválido dentro do collection() ───────────────────
const fetchParticipantsForCheckout = async (checkoutId) => {
  try {
    const snap = await getDocs(
      collection(db, "checkouts", checkoutId, "participants")
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
};

const enrichCheckoutsWithParticipants = async (checkouts) => {
  return Promise.all(
    checkouts.map(async (checkout) => {
      // Legado: já tem array inline com dados → mantém
      if (
        Array.isArray(checkout.participants) &&
        checkout.participants.length > 0
      ) {
        return checkout;
      }
      const participants = await fetchParticipantsForCheckout(checkout.id);
      return { ...checkout, participants };
    })
  );
};

const useDashboardData = () => {
  const [checkouts, setCheckouts] = useState([]);
  const [filteredCheckouts, setFilteredCheckouts] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [payerSearchQuery, setPayerSearchQuery] = useState("");
  const [participantSearchQuery, setParticipantSearchQuery] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [attendedFilter, setAttendedFilter] = useState(false);
  const [eventFilter, setEventFilter] = useState("Congresso Autismo MA 2026");
  const [eventOptions, setEventOptions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [filteredMetrics, setFilteredMetrics] = useState(null);
  const [qrCodeData, setQrCodeData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    updateMetrics(true);
  }, []);

  const applyFilters = (data) => {
    let filteredData = [...data];

    if (statusFilter) {
      filteredData = filteredData.filter((c) => c.status === statusFilter);
    }

    if (methodFilter) {
      filteredData = filteredData.filter(
        (c) => c.paymentMethod === methodFilter
      );
    }

    if (startDateFilter || endDateFilter) {
      filteredData = filteredData.filter((checkout) => {
        const checkoutDate = new Date(checkout.timestamp);
        let startDate = startDateFilter ? new Date(startDateFilter) : null;
        let endDate = endDateFilter ? new Date(endDateFilter) : null;
        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);
        if (startDate && endDate)
          return checkoutDate >= startDate && checkoutDate <= endDate;
        if (startDate) return checkoutDate >= startDate;
        if (endDate) return checkoutDate <= endDate;
        return true;
      });
    }

    const normalizeText = (text) =>
      text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (payerSearchQuery) {
      const cleanQuery = payerSearchQuery.toLowerCase().trim();
      filteredData = filteredData.filter((checkout) => {
        const firstP = (checkout.participants || [])[0] || {};
        // suporte a 'document' (novo) e 'cpf' (legado)
        const docStr = (firstP.document || firstP.cpf || "").replace(/\D/g, "");
        const nameStr = normalizeText(firstP.name || "");
        return /^\d+$/.test(cleanQuery)
          ? docStr.includes(cleanQuery)
          : nameStr.includes(cleanQuery);
      });
    }

    if (participantSearchQuery) {
      const cleanQuery = normalizeText(participantSearchQuery);
      filteredData = filteredData.filter((checkout) =>
        (checkout.participants || []).some((p) => {
          const name = normalizeText(p.name || "");
          const docStr = (p.document || p.cpf || "").replace(/\D/g, "");
          const email = normalizeText(p.email || "");
          return /^\d+$/.test(cleanQuery)
            ? docStr.includes(cleanQuery)
            : name.includes(cleanQuery) || email.includes(cleanQuery);
        })
      );
    }

    if (attendedFilter) {
      filteredData = filteredData.filter((checkout) =>
        (checkout.participants || []).some(
          (p) =>
            p.checkedIn === true ||
            (p.validated && Object.values(p.validated).some(Boolean))
        )
      );
    }

    if (eventFilter) {
      filteredData = filteredData.filter((c) => c.eventName === eventFilter);
    }

    setFilteredCheckouts(filteredData);

    const approvedCheckouts = filteredData.filter(
      (c) => c.status === "approved"
    );
    const pendingCheckouts = filteredData.filter((c) => c.status === "pending");
    const errorCheckouts = filteredData.filter((c) => c.status === "error");

    const totalAmount = (c) =>
      parseFloat(c.totalAmount) || parseFloat(c.orderDetails?.total) || 0;

    setFilteredMetrics({
      approvedValue: formatToBrazilianCurrency(
        approvedCheckouts.reduce((a, c) => a + totalAmount(c), 0)
      ),
      approvedCount: approvedCheckouts.length,
      pendingValue: formatToBrazilianCurrency(
        pendingCheckouts.reduce((a, c) => a + totalAmount(c), 0)
      ),
      pendingCount: pendingCheckouts.length,
      errorCount: errorCheckouts.length,
    });

    const qrData = {};
    filteredData.forEach((checkout) => {
      (checkout.participants || []).forEach((p, index) => {
        if (p.qrRawData) qrData[`${checkout.id}-${index}`] = p.qrRawData;
      });
    });
    setQrCodeData(qrData);
  };

  const updateMetrics = async (
    fullUpdate = false,
    currentEventFilter = eventFilter
  ) => {
    const id = toast.loading(
      "Verificando boletos, novos checkouts e atualizando métricas...",
      { position: "bottom-right" }
    );
    setErrorMessage("");

    try {
      try {
        await PaymentService.verifyAllPayments();
      } catch (paymentError) {
        console.warn("Erro ao verificar status dos boletos:", paymentError);
        setErrorMessage(
          "Erro ao atualizar status dos boletos. Exibindo dados disponíveis."
        );
      }

      let rawCheckouts = [];

      if (fullUpdate || !lastUpdated) {
        const snapshot = await getDocs(
          query(
            collection(db, "checkouts"),
            where("eventName", "==", currentEventFilter),
            orderBy("timestamp", "desc")
          )
        );
        rawCheckouts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      } else {
        const snapshot = await getDocs(
          query(
            collection(db, "checkouts"),
            where("eventName", "==", currentEventFilter),
            where("timestamp", ">", Timestamp.fromMillis(lastUpdated)),
            orderBy("timestamp", "desc")
          )
        );
        const newRaw = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        rawCheckouts = [
          ...newRaw,
          ...checkouts.filter((c) => !newRaw.find((n) => n.id === c.id)),
        ];
      }

      // ── Busca participantes das subcoleções (novo modelo) ──────────────────
      const allCheckouts = await enrichCheckoutsWithParticipants(rawCheckouts);

      const updatedMetrics = allCheckouts.reduce(
        (acc, data) => {
          const amount =
            parseFloat(data.totalAmount) ||
            parseFloat(data.orderDetails?.total) ||
            0;
          // "allTickets" é o campo atual (manual e backend novo); "fullTickets" é legado
          const fullTickets =
            data.orderDetails?.fullTickets ?? data.orderDetails?.allTickets ?? 0;
          const halfTickets = data.orderDetails?.halfTickets || 0;
          const socialTickets = data.orderDetails?.socialTickets || 0;

          if (data.status === "approved") {
            acc.successTicketsFull += fullTickets;
            acc.successTicketsHalf += halfTickets;
            acc.successTicketsSocial += socialTickets;
            acc.successValueGross += amount;
            acc.successCount += 1;

            let fee = 0;
            // 'credit' = novo backend; 'creditCard' = legado
            const method = data.paymentMethod || "unknown";
            const brand = (
              data.paymentDetails?.creditCard?.brand || "unknown"
            ).toLowerCase();

            if (["credit", "creditCard", "debitCard"].includes(method)) {
              if (["visa", "mastercard", "master"].includes(brand)) {
                fee = amount * 0.0449;
                acc.totalFeeMasterVisa += fee;
                acc.totalGrossMasterVisa += amount;
                acc.totalTicketsMasterVisa =
                  (acc.totalTicketsMasterVisa || 0) + fullTickets + halfTickets + socialTickets;
              } else if (brand === "elo") {
                fee = amount * 0.0509;
                acc.totalFeeElo += fee;
                acc.totalGrossElo += amount;
                acc.totalTicketsElo =
                  (acc.totalTicketsElo || 0) + fullTickets + halfTickets + socialTickets;
              } else {
                fee = amount * 0.0449;
                acc.totalGrossOthers += amount;
                acc.totalTicketsOthers =
                  (acc.totalTicketsOthers || 0) + fullTickets + halfTickets + socialTickets;
              }
            } else if (method === "pix") {
              fee = amount * 0.0099;
              acc.totalFeePix += fee;
              acc.totalGrossPix += amount;
              acc.totalTicketsPix =
                (acc.totalTicketsPix || 0) + fullTickets + halfTickets + socialTickets;
            } else if (method === "boleto") {
              fee = 5.0;
              acc.totalFeeBoleto += fee;
              acc.totalGrossBoleto += amount;
              acc.totalTicketsBoleto =
                (acc.totalTicketsBoleto || 0) + fullTickets + halfTickets + socialTickets;
            } else {
              acc.totalGrossOthers += amount;
              acc.totalTicketsOthers =
                (acc.totalTicketsOthers || 0) + fullTickets + halfTickets + socialTickets;
            }

            acc.successValueNet += amount - fee;
          } else if (data.status === "pending") {
            acc.pendingCount += 1;
            acc.pendingValue += amount;
          } else if (data.status === "error") {
            acc.errorCount += 1;
            acc.errorValue += amount;
          }
          return acc;
        },
        {
          totalDocs: 0,
          successTicketsFull: 0,
          successTicketsHalf: 0,
          successTicketsSocial: 0,
          successValueGross: 0,
          successValueNet: 0,
          pendingCount: 0,
          pendingValue: 0,
          errorCount: 0,
          errorValue: 0,
          successCount: 0,
          events: [],
          totalGrossMasterVisa: 0,
          totalFeeMasterVisa: 0,
          totalGrossPix: 0,
          totalFeePix: 0,
          totalGrossBoleto: 0,
          totalFeeBoleto: 0,
          totalGrossElo: 0,
          totalFeeElo: 0,
          totalGrossOthers: 0,
          totalTicketsMasterVisa: 0,
          totalTicketsPix: 0,
          totalTicketsBoleto: 0,
          totalTicketsElo: 0,
          totalTicketsOthers: 0,
        }
      );

      updatedMetrics.successValueGross = Number(
        updatedMetrics.successValueGross.toFixed(2)
      );
      updatedMetrics.successValueNet = Number(
        updatedMetrics.successValueNet.toFixed(2)
      );
      updatedMetrics.pendingValue = Number(
        updatedMetrics.pendingValue.toFixed(2)
      );
      updatedMetrics.errorValue = Number(updatedMetrics.errorValue.toFixed(2));
      updatedMetrics.lastUpdated = Timestamp.fromDate(new Date()).toMillis();

      await setDoc(doc(db, "dashboard_metrics", "metrics"), updatedMetrics);
      localStorage.setItem("dashboard_metrics", JSON.stringify(updatedMetrics));
      localStorage.setItem(
        "metrics_last_updated",
        updatedMetrics.lastUpdated.toString()
      );

      setMetrics(updatedMetrics);
      setCheckouts(allCheckouts);
      setLastUpdated(updatedMetrics.lastUpdated);
      setEventOptions(updatedMetrics.events || []);
      applyFilters(allCheckouts);

      toast.update(id, {
        render: "Atualização concluída",
        type: "success",
        isLoading: false,
        autoClose: true,
      });
    } catch (error) {
      console.error("Erro ao atualizar métricas:", error);
      toast.update(id, {
        render: "Erro ao atualizar métricas. Exibindo dados disponíveis.",
        type: "error",
        isLoading: false,
        autoClose: true,
      });
    }
  };

  useEffect(() => {
    applyFilters(checkouts);
  }, [
    statusFilter,
    methodFilter,
    payerSearchQuery,
    participantSearchQuery,
    startDateFilter,
    endDateFilter,
    attendedFilter,
    eventFilter,
    checkouts,
  ]);

  const chartData = metrics
    ? [
        {
          name: "Aprovados",
          value: metrics.successCount || 0,
          fill: "#2E7D32",
        },
        {
          name: "Pendentes",
          value: metrics.pendingCount || 0,
          fill: "#FFB300",
        },
        { name: "Erros", value: metrics.errorCount || 0, fill: "#D32F2F" },
      ]
    : [];

  return {
    checkouts,
    setCheckouts,
    filteredCheckouts,
    setFilteredCheckouts,
    statusFilter,
    setStatusFilter,
    methodFilter,
    setMethodFilter,
    payerSearchQuery,
    setPayerSearchQuery,
    participantSearchQuery,
    setParticipantSearchQuery,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
    attendedFilter,
    setAttendedFilter,
    eventFilter,
    setEventFilter,
    eventOptions,
    metrics,
    filteredMetrics,
    qrCodeData,
    updateMetrics,
    chartData,
    formatToBrazilianCurrency,
    loadMoreCheckouts: () => {},
    errorMessage,
  };
};

export default useDashboardData;
