import { useState, useEffect } from "react";
import { db } from "../../../firebaseConfig";
import {
  collection,
  query,
  orderBy,
  getDocs,
  where,
  doc,
  setDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import PaymentService from "../services/PaymentService";

const useDashboardData = () => {
  const [checkouts, setCheckouts] = useState([]);
  const [filteredCheckouts, setFilteredCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDateFilter, setStartDateFilter] = useState(""); // Novo
  const [endDateFilter, setEndDateFilter] = useState(""); // Novo
  const [eventFilter, setEventFilter] = useState("");
  const [eventOptions, setEventOptions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [qrCodeData, setQrCodeData] = useState({});

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const metricsDoc = await getDoc(
          doc(db, "dashboard_metrics", "metrics")
        );
        if (metricsDoc.exists()) {
          const metricsData = metricsDoc.data();
          setMetrics({
            successTicketsFull: metricsData.successTicketsFull || 0,
            successTicketsHalf: metricsData.successTicketsHalf || 0,
            successValue: metricsData.successValue || "0.00",
            pendingCount: metricsData.pendingCount || 0,
            pendingValue: metricsData.pendingValue || "0.00",
            errorCount: metricsData.errorCount || 0,
            errorValue: metricsData.errorValue || "0.00",
            successCount: metricsData.successCount || 0,
          });
          setEventOptions(metricsData.events || []);
        } else {
          setMetrics({
            successTicketsFull: 0,
            successTicketsHalf: 0,
            successValue: "0.00",
            pendingCount: 0,
            pendingValue: "0.00",
            errorCount: 0,
            errorValue: "0.00",
            successCount: 0,
          });
          setEventOptions([]);
        }

        const cachedCheckouts = localStorage.getItem("dashboard_checkouts");
        if (cachedCheckouts) {
          const parsedCheckouts = JSON.parse(cachedCheckouts);
          setCheckouts(parsedCheckouts);
          applyFilters(parsedCheckouts);
        } else {
          await fetchCheckoutsFromFirestore();
        }
      } catch (error) {
        console.error("Erro ao buscar dados iniciais:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const fetchCheckoutsFromFirestore = async () => {
    try {
      const q = query(
        collection(db, "checkouts"),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(q);
      const allCheckoutData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      localStorage.setItem(
        "dashboard_checkouts",
        JSON.stringify(allCheckoutData)
      );
      setCheckouts(allCheckoutData);
      applyFilters(allCheckoutData);
    } catch (error) {
      console.error("Erro ao buscar checkouts do Firestore:", error);
    }
  };

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

    // Filtro por intervalo de datas
    if (startDateFilter || endDateFilter) {
      filteredData = filteredData.filter((checkout) => {
        const checkoutDate = new Date(checkout.timestamp);
        const startDate = startDateFilter ? new Date(startDateFilter) : null;
        const endDate = endDateFilter ? new Date(endDateFilter) : null;

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

    // Filtro por documento
    if (searchQuery) {
      const cleanSearchQuery = searchQuery.replace(/[^\d]/g, "");
      filteredData = filteredData.filter((checkout) => {
        const cleanDocument = checkout.document.replace(/[^\d]/g, "");
        return cleanDocument.includes(cleanSearchQuery);
      });
    }

    // Filtro por evento (se aplicável)
    if (eventFilter) {
      filteredData = filteredData.filter(
        (checkout) => checkout.eventName === eventFilter
      );
    }

    setFilteredCheckouts(filteredData);

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

  const updateMetrics = async () => {
    setLoading(true);
    try {
      await PaymentService.verifyAllPayments();
      const snapshot = await getDocs(collection(db, "checkouts"));
      const checkoutsData = snapshot.docs.map((doc) => doc.data());

      let successTicketsFull = 0,
        successTicketsHalf = 0,
        successValue = 0,
        pendingCount = 0,
        pendingValue = 0,
        errorCount = 0,
        errorValue = 0,
        successCount = 0;

      checkoutsData.forEach((data) => {
        if (data.status === "approved") {
          successTicketsFull += data.orderDetails.fullTickets || 0;
          successTicketsHalf += data.orderDetails.halfTickets || 0;
          successValue += parseFloat(data.totalAmount) || 0;
          successCount += 1;
        } else if (data.status === "pending") {
          pendingCount += 1;
          pendingValue += parseFloat(data.totalAmount) || 0;
        } else if (data.status === "error") {
          errorCount += 1;
          errorValue += parseFloat(data.totalAmount) || 0;
        }
      });

      const updatedMetrics = {
        totalDocs: snapshot.size,
        successTicketsFull,
        successTicketsHalf,
        successValue: successValue.toFixed(2),
        pendingCount,
        pendingValue: pendingValue.toFixed(2),
        errorCount,
        errorValue: errorValue.toFixed(2),
        successCount,
        events: [...new Set(checkoutsData.map((c) => c.eventName))],
        lastUpdated: Timestamp.fromDate(new Date()),
      };

      await setDoc(doc(db, "dashboard_metrics", "metrics"), updatedMetrics);

      setMetrics(updatedMetrics);
      setEventOptions(updatedMetrics.events);
      await fetchCheckoutsFromFirestore();
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
    searchQuery,
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
    filteredCheckouts,
    loading,
    statusFilter,
    setStatusFilter,
    methodFilter,
    setMethodFilter,
    searchQuery,
    setSearchQuery,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
    eventFilter,
    setEventFilter,
    eventOptions,
    metrics,
    qrCodeData,
    updateMetrics,
    chartData,
  };
};

export default useDashboardData;
