import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

export default class AttemptsService {
  async saveAttempt(cpf, name, checkoutId) {
    try {
      console.log("Salvando tentativa em AttemptsService:", {
        cpf,
        name,
        checkoutId,
      });
      if (!cpf || typeof cpf !== "string") {
        throw new Error("CPF inválido para salvar tentativa.");
      }
      if (!checkoutId) {
        throw new Error("Checkout ID não fornecido.");
      }

      const checkoutRef = doc(db, "checkouts", checkoutId);
      const checkoutSnap = await getDoc(checkoutRef);
      if (!checkoutSnap.exists()) {
        throw new Error("Documento de checkout não encontrado.");
      }

      const checkoutData = checkoutSnap.data();
      const participantIndex = checkoutData.participants.findIndex((p) => {
        const participantCpf = p.cpf || p.document;
        return participantCpf.replace(/[^\d]/g, "") === cpf;
      });

      if (participantIndex === -1) {
        throw new Error("Participante não encontrado no checkout.");
      }

      const participant = checkoutData.participants[participantIndex];
      const attempts = Array.isArray(participant.attempts)
        ? [...participant.attempts]
        : [];
      const newAttempt = {
        name: name || "unknown",
        timestamp: new Date().toISOString(),
      };
      attempts.push(newAttempt);

      checkoutData.participants[participantIndex] = {
        ...participant,
        attempts,
      };

      await setDoc(checkoutRef, checkoutData, { merge: true });
      console.log("Tentativa salva no Firebase:", {
        cpf,
        newAttempt,
        attemptsCount: attempts.length,
      });
    } catch (error) {
      console.error("Erro ao salvar tentativa:", error);
      throw error;
    }
  }

  async getAttempts(cpf, checkoutId) {
    try {
      console.log("Recuperando tentativas para CPF:", { cpf, checkoutId });
      if (!cpf || typeof cpf !== "string") {
        throw new Error("CPF inválido para recuperar tentativas.");
      }
      if (!checkoutId) {
        throw new Error("Checkout ID não fornecido.");
      }

      const checkoutRef = doc(db, "checkouts", checkoutId);
      const checkoutSnap = await getDoc(checkoutRef);
      if (!checkoutSnap.exists()) {
        console.log("Documento de checkout não encontrado:", checkoutId);
        return [];
      }

      const checkoutData = checkoutSnap.data();
      const participant = checkoutData.participants.find((p) => {
        const participantCpf = p.cpf || p.document;
        return participantCpf.replace(/[^\d]/g, "") === cpf;
      });

      if (!participant) {
        console.log("Participante não encontrado para CPF:", cpf);
        return [];
      }

      const attempts = Array.isArray(participant.attempts)
        ? participant.attempts
        : [];
      console.log("Tentativas recuperadas:", { cpf, checkoutId, attempts });
      return attempts;
    } catch (error) {
      console.error("Erro ao recuperar tentativas:", error);
      return [];
    }
  }
}
