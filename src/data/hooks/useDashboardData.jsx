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

const formatToBrazilianCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

const useDashboardData = () => {
  const [checkouts, setCheckouts] = useState([]);
  const [filteredCheckouts, setFilteredCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [payerSearchQuery, setPayerSearchQuery] = useState(""); // Novo campo para comprador
  const [participantSearchQuery, setParticipantSearchQuery] = useState(""); // Novo campo para participantes
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [eventOptions, setEventOptions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [filteredMetrics, setFilteredMetrics] = useState(null);
  const [qrCodeData, setQrCodeData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadInitialData = async (forceUpdate = false) => {
    setLoading(true);
    try {
      const cachedMetrics = localStorage.getItem("dashboard_metrics");
      const cachedCheckouts = localStorage.getItem("dashboard_checkouts");
      const cachedLastUpdated = localStorage.getItem("metrics_last_updated");

      if (
        !cachedMetrics ||
        !cachedCheckouts ||
        forceUpdate ||
        !cachedLastUpdated ||
        (cachedMetrics && !JSON.parse(cachedMetrics).totalTicketsPix)
      ) {
        await updateMetrics(true);
      } else {
        const metricsData = JSON.parse(cachedMetrics);
        setMetrics(metricsData);
        setCheckouts(JSON.parse(cachedCheckouts));
        setLastUpdated(parseInt(cachedLastUpdated, 10));
        setEventOptions(metricsData.events || []);
        applyFilters(JSON.parse(cachedCheckouts));
      }
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
      await updateMetrics(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    // const interval = setInterval(() => updateMetrics(false), 60000);
    // return () => clearInterval(interval);
  }, []);

  const applyFilters = (data) => {
    let filteredData = [...data];

    // Filtro por status
    if (statusFilter) {
      filteredData = filteredData.filter(
        (checkout) => checkout.status === statusFilter
      );
    }

    // Filtro por método de pagamento
    if (methodFilter) {
      filteredData = filteredData.filter(
        (checkout) => checkout.paymentMethod === methodFilter
      );
    }

    // Filtro por data
    if (startDateFilter || endDateFilter) {
      filteredData = filteredData.filter((checkout) => {
        const checkoutDate = new Date(checkout.timestamp);
        let startDate = startDateFilter ? new Date(startDateFilter) : null;
        let endDate = endDateFilter ? new Date(endDateFilter) : null;
        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);
        if (startDate && endDate) {
          return checkoutDate >= startDate && checkoutDate <= endDate;
        } else if (startDate) {
          return checkoutDate >= startDate;
        } else if (endDate) {
          return checkoutDate <= endDate;
        }
        return true;
      });
    }

    const normalizeText = (text) => {
      return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    };

    // Filtro por busca do comprador (nome ou documento)
    if (payerSearchQuery) {
      const cleanPayerQuery = payerSearchQuery.toLowerCase().trim();
      filteredData = filteredData.filter((checkout) => {
        const document =
          checkout.document && typeof checkout.document === "string"
            ? checkout.document.replace(/[^\d]/g, "")
            : "";
        const payerName = normalizeText(checkout.participants[0]?.name || "");
        const isNumericQuery = /^\d+$/.test(cleanPayerQuery); // Verifica se a busca é só números
        const match = isNumericQuery
          ? document.includes(cleanPayerQuery) // Busca apenas no documento se for numérico
          : payerName.includes(cleanPayerQuery); // Busca apenas no nome se for texto

        return match;
      });
    }

    // Filtro por busca dos participantes (nome, documento ou email)
    if (participantSearchQuery) {
      const cleanParticipantQuery = normalizeText(participantSearchQuery);
      filteredData = filteredData.filter((checkout) => {
        return checkout.participants.some((participant) => {
          const participantName = normalizeText(participant.name || "");
          const participantCpf = (participant.cpf || "").replace(/[^\d]/g, "");
          const participantEmail = normalizeText(participant.email || "");

          const isNumericQuery = /^\d+$/.test(cleanParticipantQuery);

          if (isNumericQuery) {
            // Busca apenas no CPF se for numérico
            return participantCpf.includes(cleanParticipantQuery);
          } else {
            // Busca no nome ou email se for texto
            return (
              participantName.includes(cleanParticipantQuery) ||
              participantEmail.includes(cleanParticipantQuery)
            );
          }
        });
      });
    }

    // Filtro por evento
    if (eventFilter) {
      filteredData = filteredData.filter(
        (checkout) => checkout.eventName === eventFilter
      );
    }

    setFilteredCheckouts(filteredData);

    // Cálculo de métricas filtradas
    const approvedCheckouts = filteredData.filter(
      (c) => c.status === "approved"
    );
    const pendingCheckouts = filteredData.filter((c) => c.status === "pending");
    const errorCheckouts = filteredData.filter((c) => c.status === "error");

    const approvedValue = approvedCheckouts.reduce(
      (acc, curr) => acc + parseFloat(curr.totalAmount || 0),
      0
    );
    const pendingValue = pendingCheckouts.reduce(
      (acc, curr) => acc + parseFloat(curr.totalAmount || 0),
      0
    );

    setFilteredMetrics({
      approvedValue: formatToBrazilianCurrency(approvedValue),
      approvedCount: approvedCheckouts.length,
      pendingValue: formatToBrazilianCurrency(pendingValue),
      pendingCount: pendingCheckouts.length,
      errorCount: errorCheckouts.length,
    });

    const qrData = {};
    filteredData.forEach((checkout) => {
      checkout.participants.forEach((p, index) => {
        if (p.qrRawData) {
          qrData[`${checkout.id}-${index}`] = p.qrRawData;
        }
      });
    });
    setQrCodeData(qrData);
  };

  const updateMetrics = async (fullUpdate = false) => {
    setLoading(true);
    try {
      await PaymentService.verifyAllPayments();

      let allCheckouts = [];
      if (fullUpdate || !lastUpdated) {
        const snapshot = await getDocs(
          query(collection(db, "checkouts"), orderBy("timestamp", "desc"))
        );
        allCheckouts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } else {
        const q = query(
          collection(db, "checkouts"),
          where("timestamp", ">", Timestamp.fromMillis(lastUpdated)),
          orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(q);
        const newCheckouts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        allCheckouts = [...newCheckouts, ...checkouts];
      }

      const updatedMetrics = allCheckouts.reduce(
        (acc, data) => {
          const totalAmount = parseFloat(data.totalAmount) || 0;
          const fullTickets = data.orderDetails?.fullTickets || 0;
          const halfTickets = data.orderDetails?.halfTickets || 0;

          if (data.status === "approved") {
            acc.successTicketsFull += fullTickets;
            acc.successTicketsHalf += halfTickets;
            acc.successValueGross += totalAmount;
            acc.successCount += 1;

            let fee = 0;
            const paymentMethod = data.paymentMethod || "unknown";
            const cardBrand = (
              data.paymentDetails?.creditCard?.brand || "unknown"
            ).toLowerCase();

            if (
              paymentMethod === "creditCard" ||
              paymentMethod === "debitCard"
            ) {
              if (["visa", "mastercard", "master"].includes(cardBrand)) {
                fee = totalAmount * 0.0449;
                acc.totalFeeMasterVisa += fee;
                acc.totalGrossMasterVisa += totalAmount;
                acc.totalTicketsMasterVisa =
                  (acc.totalTicketsMasterVisa || 0) + fullTickets + halfTickets;
              } else if (cardBrand === "elo") {
                fee = totalAmount * 0.0509;
                acc.totalFeeElo += fee;
                acc.totalGrossElo += totalAmount;
                acc.totalTicketsElo =
                  (acc.totalTicketsElo || 0) + fullTickets + halfTickets;
              } else {
                fee = totalAmount * 0.0449;
                acc.totalGrossOthers += totalAmount;
                acc.totalTicketsOthers =
                  (acc.totalTicketsOthers || 0) + fullTickets + halfTickets;
              }
            } else if (paymentMethod === "pix") {
              fee = totalAmount * 0.0099;
              acc.totalFeePix += fee;
              acc.totalGrossPix += totalAmount;
              acc.totalTicketsPix =
                (acc.totalTicketsPix || 0) + fullTickets + halfTickets;
            } else if (paymentMethod === "boleto") {
              fee = 5.0;
              acc.totalFeeBoleto += fee;
              acc.totalGrossBoleto += totalAmount;
              acc.totalTicketsBoleto =
                (acc.totalTicketsBoleto || 0) + fullTickets + halfTickets;
            } else {
              acc.totalGrossOthers += totalAmount;
              acc.totalTicketsOthers =
                (acc.totalTicketsOthers || 0) + fullTickets + halfTickets;
            }

            acc.successValueNet += totalAmount - fee;
          } else if (data.status === "pending") {
            acc.pendingCount += 1;
            acc.pendingValue += totalAmount;
          } else if (data.status === "error") {
            acc.errorCount += 1;
            acc.errorValue += totalAmount;
          }
          return acc;
        },
        {
          totalDocs: 0,
          successTicketsFull: 0,
          successTicketsHalf: 0,
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
      localStorage.setItem("dashboard_checkouts", JSON.stringify(allCheckouts));
      localStorage.setItem(
        "metrics_last_updated",
        updatedMetrics.lastUpdated.toString()
      );

      setMetrics(updatedMetrics);
      setCheckouts(allCheckouts);
      setLastUpdated(updatedMetrics.lastUpdated);
      setEventOptions(updatedMetrics.events || []);
      applyFilters(allCheckouts);
    } catch (error) {
      console.error("Erro ao atualizar métricas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters(checkouts);
  }, [
    statusFilter,
    methodFilter,
    payerSearchQuery, // Substituído searchQuery
    participantSearchQuery, // Novo
    startDateFilter,
    endDateFilter,
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
    loading,
    statusFilter,
    setStatusFilter,
    methodFilter,
    setMethodFilter,
    payerSearchQuery, // Novo
    setPayerSearchQuery, // Novo
    participantSearchQuery, // Novo
    setParticipantSearchQuery, // Novo
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
    eventFilter,
    setEventFilter,
    eventOptions,
    metrics,
    filteredMetrics,
    qrCodeData,
    updateMetrics,
    chartData,
    formatToBrazilianCurrency,
    loadInitialData,
  };
};

export default useDashboardData;
