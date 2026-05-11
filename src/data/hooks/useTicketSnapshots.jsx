import { useState, useEffect } from "react";
import { db } from "../../../firebaseConfig";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

export const saveTicketSnapshot = async (metrics, eventName) => {
  const today = new Date().toISOString().slice(0, 10);
  const full = metrics.successTicketsFull || 0;
  const half = metrics.successTicketsHalf || 0;
  const social = metrics.successTicketsSocial || 0;

  await setDoc(doc(db, "ticket_snapshots", today), {
    date: today,
    savedAt: serverTimestamp(),
    eventName: eventName || "",
    approved: {
      full,
      half,
      social,
      total: full + half + social,
    },
  });
};

const useTicketSnapshots = () => {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "ticket_snapshots"), orderBy("date", "desc"))
        );
        setSnapshots(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Erro ao buscar snapshots de ingressos:", e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { snapshots, loading };
};

export default useTicketSnapshots;
