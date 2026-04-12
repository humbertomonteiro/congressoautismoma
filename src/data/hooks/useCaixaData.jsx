import { useState, useEffect, useCallback } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { toast } from "react-toastify";
import useEventConfig from "./useEventConfig";

export const RECEITA_CATEGORIES = [
  { value: "ingressos", label: "Ingressos" },
  { value: "patrocinador", label: "Patrocinador" },
  { value: "aporte", label: "Aporte" },
  { value: "doacao", label: "Doação" },
  { value: "outros", label: "Outros" },
];

export const DESPESA_CATEGORIES = [
  { value: "marketing", label: "Marketing" },
  { value: "infraestrutura", label: "Infraestrutura" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "logistica", label: "Logística" },
  { value: "pessoal", label: "Pessoal / Palestrantes" },
  { value: "material", label: "Material" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "outros", label: "Outros" },
];

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const useCaixaData = () => {
  const { config: eventConfig } = useEventConfig();
  const eventName = eventConfig.eventName;

  const [entries, setEntries] = useState([]);
  const [pendingCheckouts, setPendingCheckouts] = useState([]);
  const [approvedOnlineCheckouts, setApprovedOnlineCheckouts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(
          collection(db, "caixa_entries"),
          where("eventName", "==", eventName),
          orderBy("timestamp", "desc")
        )
      );
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Erro ao carregar caixa:", err);
    } finally {
      setLoading(false);
    }
  }, [eventName]);

  const fetchPendingCheckouts = useCallback(async () => {
    try {
      const snap = await getDocs(
        query(
          collection(db, "checkouts"),
          where("eventName", "==", eventName),
          where("status", "==", "pending")
        )
      );
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Apenas os criados manualmente por vendedores (têm seller)
      setPendingCheckouts(docs.filter((c) => c.seller && c.paymentDetails?.manual));
    } catch (err) {
      console.error("Erro ao carregar checkouts pendentes:", err);
    }
  }, [eventName]);

  // Busca ingressos aprovados via gateway (PIX, cartão, boleto)
  // Exclui checkouts manuais de vendedor pois esses já entram em caixa_entries via approveCheckout
  const fetchApprovedOnlineCheckouts = useCallback(async () => {
    try {
      const snap = await getDocs(
        query(
          collection(db, "checkouts"),
          where("eventName", "==", eventName),
          where("status", "==", "approved")
        )
      );
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setApprovedOnlineCheckouts(docs.filter((c) => !(c.seller && c.paymentDetails?.manual)));
    } catch (err) {
      console.error("Erro ao carregar checkouts aprovados:", err);
    }
  }, [eventName]);

  useEffect(() => {
    fetchEntries();
    fetchPendingCheckouts();
    fetchApprovedOnlineCheckouts();
  }, [fetchEntries, fetchPendingCheckouts, fetchApprovedOnlineCheckouts]);

  const addEntry = async (entry) => {
    try {
      const docRef = await addDoc(collection(db, "caixa_entries"), {
        ...entry,
        eventName: eventName,
        timestamp: Timestamp.now().toMillis(),
      });
      const newEntry = { id: docRef.id, ...entry, eventName: eventName, timestamp: Timestamp.now().toMillis() };
      setEntries((prev) => [newEntry, ...prev]);
      toast.success("Lançamento adicionado!");
    } catch (err) {
      console.error("Erro ao adicionar lançamento:", err);
      toast.error("Erro ao adicionar lançamento.");
    }
  };

  const deleteEntry = async (id) => {
    try {
      await deleteDoc(doc(db, "caixa_entries", id));
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("Lançamento removido.");
    } catch (err) {
      console.error("Erro ao remover lançamento:", err);
      toast.error("Erro ao remover lançamento.");
    }
  };

  const approveCheckout = async (checkout) => {
    try {
      await updateDoc(doc(db, "checkouts", checkout.id), { status: "approved" });
      setPendingCheckouts((prev) => prev.filter((c) => c.id !== checkout.id));

      // Registra como receita no caixa
      await addEntry({
        type: "receita",
        category: "ingressos",
        subcategory: "vendedor",
        amount: parseFloat(checkout.totalAmount) || parseFloat(checkout.orderDetails?.total) || 0,
        description: `Checkout aprovado — ${checkout.seller?.name || "Vendedor"} (${
          (checkout.orderDetails?.allTickets || checkout.orderDetails?.fullTickets || 0) +
          (checkout.orderDetails?.halfTickets || 0) +
          (checkout.orderDetails?.socialTickets || 0)
        } ingresso(s))`,
        checkoutId: checkout.id,
        sellerId: checkout.seller?.id || "",
        sellerName: checkout.seller?.name || "",
        paymentMethod: checkout.paymentMethod,
        date: new Date().toISOString().split("T")[0],
        approvedAt: new Date().toISOString(),
      });

      toast.success("Checkout aprovado e lançado no caixa!");
    } catch (err) {
      console.error("Erro ao aprovar checkout:", err);
      toast.error("Erro ao aprovar checkout.");
    }
  };

  const rejectCheckout = async (checkoutId) => {
    try {
      await updateDoc(doc(db, "checkouts", checkoutId), { status: "error" });
      setPendingCheckouts((prev) => prev.filter((c) => c.id !== checkoutId));
      toast.success("Checkout rejeitado.");
    } catch (err) {
      console.error("Erro ao rejeitar checkout:", err);
      toast.error("Erro ao rejeitar checkout.");
    }
  };

  // ── Métricas ──────────────────────────────────────────────────────────────
  const metrics = (() => {
    const receitas = entries.filter((e) => e.type === "receita");
    const despesas = entries.filter((e) => e.type === "despesa");

    // Valor bruto dos ingressos aprovados via gateway (não manuais de vendedor)
    const receitaIngressosOnline = approvedOnlineCheckouts.reduce(
      (s, c) => s + (parseFloat(c.totalAmount) || parseFloat(c.orderDetails?.total) || 0),
      0
    );

    const totalReceitasEntries = receitas.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const totalReceitas = totalReceitasEntries + receitaIngressosOnline;
    const totalDespesas = despesas.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const saldo = totalReceitas - totalDespesas;

    // Receitas por categoria (entradas manuais)
    const receitaByCategory = RECEITA_CATEGORIES.reduce((acc, cat) => {
      acc[cat.value] = receitas
        .filter((e) => e.category === cat.value)
        .reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
      return acc;
    }, {});

    // Soma ingressos online à categoria "ingressos"
    receitaByCategory["ingressos"] += receitaIngressosOnline;

    // Dentro de ingressos: separar vendedores vs gateway
    const receitaVendedores = receitas
      .filter((e) => e.category === "ingressos" && e.subcategory === "vendedor")
      .reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

    const receitaIngressosDireto = receitaByCategory["ingressos"] - receitaVendedores;

    // Despesas por categoria
    const despesaByCategory = DESPESA_CATEGORIES.reduce((acc, cat) => {
      acc[cat.value] = despesas
        .filter((e) => e.category === cat.value)
        .reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
      return acc;
    }, {});

    return {
      totalReceitas,
      totalDespesas,
      saldo,
      receitaByCategory,
      receitaVendedores,
      receitaIngressosDireto,
      receitaIngressosOnline,
      despesaByCategory,
      pendingCount: pendingCheckouts.length,
      pendingValue: pendingCheckouts.reduce(
        (s, c) => s + (parseFloat(c.totalAmount) || parseFloat(c.orderDetails?.total) || 0),
        0
      ),
    };
  })();

  return {
    entries,
    pendingCheckouts,
    loading,
    metrics,
    addEntry,
    deleteEntry,
    approveCheckout,
    rejectCheckout,
    refresh: () => { fetchEntries(); fetchPendingCheckouts(); fetchApprovedOnlineCheckouts(); },
    formatCurrency,
    RECEITA_CATEGORIES,
    DESPESA_CATEGORIES,
  };
};

export default useCaixaData;
