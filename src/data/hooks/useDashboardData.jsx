// src/hooks/useDashboardData.js
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
  const [page, setPage] = useState(0);
  const [totalDocs, setTotalDocs] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [eventOptions, setEventOptions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [qrCodeData, setQrCodeData] = useState({});
  const rowsPerPage = 6;

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Carregar métricas do Firestore
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
          setTotalDocs(metricsData.totalDocs || 0);
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
          setTotalDocs(0);
          setEventOptions([]);
        }

        // Tentar carregar checkouts do localStorage
        const cachedCheckouts = localStorage.getItem("dashboard_checkouts");
        if (cachedCheckouts) {
          const parsedCheckouts = JSON.parse(cachedCheckouts);
          setCheckouts(parsedCheckouts);
          applyFiltersAndPagination(parsedCheckouts);
        } else {
          // Se não houver dados no localStorage, buscar do Firestore
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
      let q = query(collection(db, "checkouts"), orderBy("timestamp", "desc"));

      if (statusFilter)
        q = query(q, where("status", "==", statusFilter.toLowerCase()));
      if (methodFilter)
        q = query(q, where("paymentMethod", "==", methodFilter));
      if (dateFilter) {
        const localDate = new Date(dateFilter);
        const startOfDay = new Date(localDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(localDate.setHours(23, 59, 59, 999));
        const utcStart = new Date(
          startOfDay.getTime() - startOfDay.getTimezoneOffset() * 60000
        );
        const utcEnd = new Date(
          endOfDay.getTime() - endOfDay.getTimezoneOffset() * 60000
        );
        q = query(
          q,
          where("timestamp", ">=", utcStart.toISOString()),
          where("timestamp", "<=", utcEnd.toISOString())
        );
      }
      if (eventFilter) q = query(q, where("eventName", "==", eventFilter));

      const snapshot = await getDocs(q);
      const allCheckoutData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Salvar no localStorage
      localStorage.setItem(
        "dashboard_checkouts",
        JSON.stringify(allCheckoutData)
      );
      setCheckouts(allCheckoutData);
      applyFiltersAndPagination(allCheckoutData);
    } catch (error) {
      console.error("Erro ao buscar checkouts do Firestore:", error);
    }
  };

  const applyFiltersAndPagination = (data) => {
    let filteredData = data;

    // Aplicar filtro por document
    if (searchQuery) {
      const cleanSearchQuery = searchQuery.replace(/[^\d]/g, "");
      filteredData = data.filter((checkout) => {
        const cleanDocument = checkout.document.replace(/[^\d]/g, "");
        return cleanDocument.includes(cleanSearchQuery);
      });
    }

    // Paginação no frontend
    const startIndex = page * rowsPerPage;
    const paginatedData = filteredData.slice(
      startIndex,
      startIndex + rowsPerPage
    );

    setFilteredCheckouts(paginatedData);
    setTotalDocs(filteredData.length);

    const qrData = {};
    paginatedData.forEach((checkout) => {
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
      const checkouts = snapshot.docs.map((doc) => doc.data());

      let successTicketsFull = 0,
        successTicketsHalf = 0,
        successValue = 0,
        pendingCount = 0,
        pendingValue = 0,
        errorCount = 0,
        errorValue = 0,
        successCount = 0;

      checkouts.forEach((data) => {
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
        events: [...new Set(checkouts.map((c) => c.eventName))],
        lastUpdated: Timestamp.fromDate(new Date()),
      };

      await setDoc(doc(db, "dashboard_metrics", "metrics"), updatedMetrics);

      setMetrics(updatedMetrics);
      setTotalDocs(updatedMetrics.totalDocs);
      setEventOptions(updatedMetrics.events);

      // Atualizar checkouts no Firestore e no localStorage
      await fetchCheckoutsFromFirestore();
    } catch (error) {
      console.error("Erro ao atualizar métricas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (newPage) => {
    setPage(newPage);
    applyFiltersAndPagination(checkouts); // Aplicar filtros e paginação nos dados em memória
  };

  useEffect(() => {
    setPage(0);
    applyFiltersAndPagination(checkouts); // Reaplicar filtros sempre que mudarem
  }, [statusFilter, methodFilter, dateFilter, eventFilter, searchQuery]);

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
    page,
    rowsPerPage,
    totalDocs,
    statusFilter,
    setStatusFilter,
    methodFilter,
    setMethodFilter,
    dateFilter,
    setDateFilter,
    eventFilter,
    setEventFilter,
    eventOptions,
    metrics,
    searchQuery,
    setSearchQuery,
    qrCodeData,
    updateMetrics,
    handleChangePage,
    chartData,
  };
};

export default useDashboardData;
