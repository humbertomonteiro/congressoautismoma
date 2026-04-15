import {
  collection,
  collectionGroup,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  setDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import PdfService from "./PdfService.js";
import EventCacheService from "./EventCacheService.js";

// Eventos que já foram exportados para cache estático.
// Adicione aqui o nome exato de cada evento já exportado.
const CACHED_EVENTS = ["Congresso Autismo MA 2025"];

export default class CertificateService {
  constructor() {
    this.pdfService = new PdfService();
  }

  async searchParticipant(name, cpf, email = "", phone = "") {
    try {
      const { cleanCpf, cleanEmail, cleanPhone } = this.validateInputs(
        cpf,
        email,
        phone
      );

      // ── Tenta o cache estático primeiro (zero leituras no Firestore) ────────
      let result = await this.searchInCache(cleanCpf, cleanEmail, cleanPhone);

      // ── Fallback: busca na subcoleção participants (modelo atual) ───────────
      if (!result.participant) {
        result = await this.searchInSubcollection(cleanCpf, cleanEmail, cleanPhone);
      }

      if (result.participant) {
        if (name) {
          const nameMatch = this.compareNames(name, result.participant.name);
          if (!nameMatch) {
            return {
              status: "mismatch",
              message: "Os nomes não correspondem.",
              participant: result.participant,
              checkoutId: result.checkoutId,
              participantId: result.participantId,
              checkoutData: result.checkoutData,
              registeredCpf: this.cleanIdentifier(
                result.participant.document || result.participant.cpf
              ),
            };
          }
        }

        return {
          status: "success",
          message: "Participante encontrado.",
          participant: result.participant,
          checkoutId: result.checkoutId,
          participantId: result.participantId,
          checkoutData: result.checkoutData,
          registeredCpf: this.cleanIdentifier(
            result.participant.document || result.participant.cpf
          ),
        };
      }

      return {
        status: "not_found",
        message: "Nenhum participante encontrado.",
        participant: null,
        checkoutId: null,
        participantId: null,
        checkoutData: null,
        registeredCpf: null,
      };
    } catch (error) {
      console.error("Erro ao buscar participante:", error);
      throw new Error(error.message || "Erro ao buscar participante.");
    }
  }

  /**
   * Busca participante nas subcoleções usando collectionGroup.
   * Funciona para todos os checkouts do modelo atual (2026+).
   */
  async searchInSubcollection(cleanCpf, cleanEmail, cleanPhone) {
    const participantsGroup = collectionGroup(db, "participants");

    // Tenta por CPF
    if (cleanCpf) {
      const snap = await getDocs(
        query(participantsGroup, where("document", "==", cleanCpf))
      );
      const found = await this._findApprovedParticipant(snap);
      if (found) return found;
    }

    // Tenta por e-mail
    if (cleanEmail) {
      const snap = await getDocs(
        query(participantsGroup, where("email", "==", cleanEmail))
      );
      const found = await this._findApprovedParticipant(snap);
      if (found) return found;
    }

    // Tenta por telefone
    if (cleanPhone) {
      const snap = await getDocs(
        query(participantsGroup, where("phone", "==", cleanPhone))
      );
      const found = await this._findApprovedParticipant(snap);
      if (found) return found;
    }

    return { participant: null, checkoutId: null, participantId: null, checkoutData: null };
  }

  /** Percorre os resultados do collectionGroup e retorna o primeiro cujo
   *  checkout pai esteja com status "approved". */
  async _findApprovedParticipant(snap) {
    for (const pDoc of snap.docs) {
      const checkoutRef = pDoc.ref.parent.parent;
      const checkoutSnap = await getDoc(checkoutRef);
      if (!checkoutSnap.exists()) continue;
      const checkoutData = checkoutSnap.data();
      if (checkoutData.status !== "approved") continue;

      return {
        participant: { id: pDoc.id, ...pDoc.data() },
        participantId: pDoc.id,
        checkoutId: checkoutRef.id,
        checkoutData,
      };
    }
    return null;
  }

  async generateCertificate(
    providedCpf,
    registeredCpf,
    name,
    checkoutId,
    checkoutData,
    windowLocation,
    participantId = null
  ) {
    try {
      const cleanProvidedCpf = this.cleanIdentifier(providedCpf);
      const cleanRegisteredCpf = this.cleanIdentifier(registeredCpf);

      if (!checkoutId) {
        throw new Error("ID do checkout não fornecido.");
      }
      if (!cleanRegisteredCpf) {
        throw new Error("CPF registrado inválido.");
      }

      const isDashboard = window.location.pathname === "/dashboard";
      const now = new Date().toISOString();

      // ── Modelo atual: participante na subcoleção ───────────────────────────
      if (participantId) {
        const participantRef = doc(
          db,
          "checkouts",
          checkoutId,
          "participants",
          participantId
        );
        await updateDoc(participantRef, {
          certificateIssued: isDashboard ? false : true,
          certificateIssuedAt: isDashboard ? null : now,
          certificateIssuedNames: arrayUnion({
            name,
            cpf: cleanProvidedCpf || cleanRegisteredCpf,
            timestamp: now,
          }),
        });
      }
      // ── Modelo legado: participante inline no checkout ─────────────────────
      else if (checkoutData?.participants && Array.isArray(checkoutData.participants)) {
        let participantFound = false;
        const updatedParticipants = checkoutData.participants.map((p) => {
          const participantCpf = this.cleanIdentifier(p.cpf || p.document);
          if (participantCpf === cleanRegisteredCpf) {
            participantFound = true;
            const certificateIssuedNames = Array.isArray(p.certificateIssuedNames)
              ? [...p.certificateIssuedNames]
              : [];
            certificateIssuedNames.push({
              name,
              cpf: cleanProvidedCpf || cleanRegisteredCpf,
              timestamp: now,
            });
            return {
              ...p,
              certificateIssued: isDashboard ? p.certificateIssued || false : true,
              certificateIssuedAt: isDashboard ? p.certificateIssuedAt || null : now,
              certificateIssuedNames,
              attempts: [],
              emittedOnDashboard: isDashboard,
            };
          }
          return p;
        });

        if (!participantFound) {
          throw new Error("Participante não encontrado para registrar o certificado.");
        }

        await setDoc(
          doc(db, "checkouts", checkoutId),
          { ...checkoutData, participants: updatedParticipants },
          { merge: true }
        );
      }

      // ── Registro na coleção certificates ──────────────────────────────────
      const certificateRef = doc(db, "certificates", cleanRegisteredCpf);
      await setDoc(
        certificateRef,
        {
          name,
          providedCpf: cleanProvidedCpf || cleanRegisteredCpf,
          generatedAt: now,
          emittedOnDashboard: isDashboard,
        },
        { merge: true }
      );

      // ── Determina o template pelo path ────────────────────────────────────
      let templateName = "default";
      switch (windowLocation) {
        case "/certificado-comissao-cientifica":
          templateName = "cientifica";
          break;
        case "/certificado-monitoria":
          templateName = "monitoria";
          break;
        case "/certificado-comissao-organizadora":
          templateName = "organizadora";
          break;
      }

      // ── Gera e baixa o PDF ────────────────────────────────────────────────
      try {
        const pdfData = await this.pdfService.generateCertificate(
          cleanRegisteredCpf,
          name,
          templateName
        );
        this.pdfService.downloadCertificate(pdfData);
        return { status: "success", message: "Certificado gerado e baixado.", pdfData };
      } catch (downloadError) {
        console.error("Erro no download automático:", downloadError);
        return {
          status: "success_with_manual_download",
          message: "Certificado gerado. Use a opção de download manual.",
          pdfData: null,
        };
      }
    } catch (error) {
      console.error("Erro ao registrar certificado:", error);
      throw new Error(error.message || "Erro ao registrar certificado.");
    }
  }

  /**
   * Percorre todos os eventos em CACHED_EVENTS e busca o participante
   * no JSON estático. Retorna o primeiro match encontrado.
   */
  async searchInCache(cleanCpf, cleanEmail, cleanPhone) {
    for (const eventName of CACHED_EVENTS) {
      let result = null;

      if (cleanCpf) {
        result = await EventCacheService.findParticipantByCpf(eventName, cleanCpf);
      }
      if (!result && cleanEmail) {
        result = await EventCacheService.findParticipantByEmail(eventName, cleanEmail);
      }
      if (!result && cleanPhone) {
        result = await EventCacheService.findParticipantByPhone(eventName, cleanPhone);
      }

      if (result) return { ...result, participantId: null };
    }
    return { participant: null, checkoutId: null, participantId: null, checkoutData: null };
  }

  validateInputs(cpf, email, phone) {
    const cleanCpf = this.cleanIdentifier(cpf);
    const cleanEmail = this.cleanEmail(email);
    const cleanPhone = this.cleanPhone(phone);

    if (!cleanCpf && !cleanEmail && !cleanPhone) {
      throw new Error("Forneça CPF, e-mail ou telefone válido.");
    }

    return { cleanCpf, cleanEmail, cleanPhone };
  }

  compareNames(providedName, registeredName) {
    const providedFirstName = providedName.trim().split(" ")[0].toLowerCase();
    const registeredFirstName = registeredName.trim().split(" ")[0].toLowerCase();
    return providedFirstName === registeredFirstName;
  }

  cleanIdentifier(identifier) {
    return identifier && typeof identifier === "string"
      ? identifier.replace(/[^\d]/g, "").trim()
      : "";
  }

  cleanEmail(email) {
    return email && typeof email === "string" ? email.toLowerCase().trim() : "";
  }

  cleanPhone(phone) {
    return phone && typeof phone === "string"
      ? phone.replace(/[^\d]/g, "").trim()
      : "";
  }
}
