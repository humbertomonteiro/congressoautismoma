import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";

const BASE_URL =
  import.meta.env.VITE_ENV === "production"
    ? import.meta.env.VITE_BASE_URL_PRODUCTION
    : import.meta.env.VITE_BASE_URL_SANDBOX;

// ── Valores padrão (fallback se o documento ainda não existir) ────────────────
export const DEFAULT_EVENT_CONFIG = {
  eventName: "Congresso Autismo MA 2026",
  eventDates: ["2026-05-16", "2026-05-17"],
  ticketPrices: { full: 674, half: 337, social: 347 },
};

/**
 * useEventConfig
 *
 * Lê a configuração do evento em tempo real via Firestore onSnapshot.
 * Qualquer alteração feita no backend propaga para todos os clientes
 * automaticamente sem necessidade de recarregar a página.
 *
 * Uso:
 *   const { config, loading } = useEventConfig();
 *   config.eventName  → "Congresso Autismo MA 2026"
 *   config.eventDates → ["2026-05-16", "2026-05-17"]
 *   config.ticketPrices.full → 499.9
 */
const useEventConfig = () => {
  const [config, setConfig] = useState(DEFAULT_EVENT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "config", "eventConfig"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setConfig({
            ...DEFAULT_EVENT_CONFIG,
            ...data,
            ticketPrices: {
              ...DEFAULT_EVENT_CONFIG.ticketPrices,
              ...(data.ticketPrices || {}),
            },
          });
        } else {
          // Documento não existe ainda — usa defaults
          setConfig(DEFAULT_EVENT_CONFIG);
        }
        setLoading(false);
      },
      (err) => {
        console.error("[useEventConfig] Erro no onSnapshot:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /**
   * Envia alterações para o backend (requer role adm).
   * O backend valida, grava no Firestore e registra auditoria.
   * O onSnapshot acima vai receber a atualização automaticamente.
   *
   * @param {{ eventName, eventDates, ticketPrices }} newConfig
   */
  const updateConfig = async (newConfig) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Usuário não autenticado.");

    const token = await currentUser.getIdToken();
    const res = await fetch(`${BASE_URL}/config/event`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newConfig),
    });

    const json = await res.json();
    if (!res.ok)
      throw new Error(json.message || "Erro ao atualizar configuração.");
    return json;
  };

  /**
   * Busca o log de auditoria das últimas alterações.
   */
  const fetchAuditLog = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Usuário não autenticado.");

    const token = await currentUser.getIdToken();
    const res = await fetch(`${BASE_URL}/config/event/audit`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Erro ao buscar histórico.");
    return json.data || [];
  };

  return { config, loading, error, updateConfig, fetchAuditLog };
};

export default useEventConfig;
