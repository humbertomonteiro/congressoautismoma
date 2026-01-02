import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import PdfService from "./PdfService.js"; // Ajuste o caminho conforme necessário

export default class CertificateService {
  constructor() {
    this.pdfService = new PdfService();
    // console.log("PdfService instanciado:", this.pdfService); // Log para depuração
  }

  async searchParticipant(name, cpf, email = "", phone = "") {
    try {
      const { cleanCpf, cleanEmail, cleanPhone } = this.validateInputs(
        cpf,
        email,
        phone
      );
      const snapshot = await this.buildQuery();

      let result = await this.findParticipantByCpf(cleanCpf, snapshot);
      if (!result.participant && cleanEmail) {
        result = await this.findParticipantByEmail(cleanEmail, snapshot);
      }
      if (!result.participant && cleanPhone) {
        result = await this.findParticipantByPhone(cleanPhone, snapshot);
      }

      if (result.participant) {
        // Verificar certificateIssued antes de qualquer outra validação
        // if (
        //   result.participant.certificateIssued === true &&
        //   window.location.pathname !== "/dashboard"
        // ) {
        //   console.log("Certificado já emitido para:", {
        //     cpf: cleanCpf,
        //     email: cleanEmail,
        //     phone: cleanPhone,
        //   });
        //   return {
        //     status: "already_issued",
        //     message: "Certificado já emitido.",
        //     participant: result.participant,
        //     checkoutId: result.checkoutId,
        //     checkoutData: result.checkoutData,
        //     registeredCpf: this.cleanIdentifier(
        //       result.participant.cpf || result.participant.document
        //     ),
        //   };
        // }

        // Validar nome, se fornecido
        if (name) {
          const nameMatch = this.compareNames(name, result.participant.name);
          if (!nameMatch) {
            console.log("Nomes não correspondem:", {
              provided: name,
              registered: result.participant.name,
            });
            return {
              status: "mismatch",
              message: "Os nomes não correspondem.",
              participant: result.participant,
              checkoutId: result.checkoutId,
              checkoutData: result.checkoutData,
              registeredCpf: this.cleanIdentifier(
                result.participant.cpf || result.participant.document
              ),
            };
          }
        }
      }

      return result.participant
        ? {
            status: "success",
            message: "Participante encontrado.",
            participant: result.participant,
            checkoutId: result.checkoutId,
            checkoutData: result.checkoutData,
            registeredCpf: this.cleanIdentifier(
              result.participant.cpf || result.participant.document
            ),
          }
        : {
            status: "not_found",
            message: "Nenhum participante encontrado.",
            participant: null,
            checkoutId: null,
            checkoutData: null,
            registeredCpf: null,
          };
    } catch (error) {
      console.error("Erro ao buscar participante:", error);
      throw new Error(error.message || "Erro ao buscar participante.");
    }
  }

  async generateCertificate(
    providedCpf,
    registeredCpf,
    name,
    checkoutId,
    checkoutData,
    windowLocation
  ) {
    try {
      const cleanProvidedCpf = this.cleanIdentifier(providedCpf);
      const cleanRegisteredCpf = this.cleanIdentifier(registeredCpf);
      if (!checkoutId || !checkoutData) {
        throw new Error("Dados do checkout não fornecidos.");
      }
      if (!cleanRegisteredCpf) {
        throw new Error("CPF registrado inválido.");
      }

      // console.log("Gerando certificado:", {
      //   cleanProvidedCpf,
      //   cleanRegisteredCpf,
      //   name,
      // });

      let participantFound = false;
      const isDashboard = window.location.pathname === "/dashboard";
      const updatedParticipants = checkoutData.participants.map((p) => {
        const participantCpf = this.cleanIdentifier(p.cpf || p.document);
        if (participantCpf === cleanRegisteredCpf) {
          participantFound = true;
          // if (p.certificateIssued === true && !isDashboard) {
          //   throw new Error("Certificado já emitido para este participante.");
          // }
          const certificateIssuedNames = Array.isArray(p.certificateIssuedNames)
            ? [...p.certificateIssuedNames]
            : [];
          certificateIssuedNames.push({
            name,
            cpf: cleanProvidedCpf || cleanRegisteredCpf,
            timestamp: new Date().toISOString(),
          });
          return {
            ...p,
            certificateIssued: isDashboard
              ? p.certificateIssued || false
              : true,
            certificateIssuedAt: isDashboard
              ? p.certificateIssuedAt || null
              : new Date().toISOString(),
            certificateIssuedNames,
            attempts: [],
            emittedOnDashboard: isDashboard,
          };
        }
        return p;
      });

      if (!participantFound) {
        console.error("Participante não encontrado para:", cleanRegisteredCpf);
        throw new Error(
          "Participante não encontrado para registrar o certificado."
        );
      }

      // Atualizar os dados no Firestore
      await setDoc(
        doc(db, "checkouts", checkoutId),
        { ...checkoutData, participants: updatedParticipants },
        { merge: true }
      );

      const certificateRef = doc(db, "certificates", cleanRegisteredCpf);
      await setDoc(
        certificateRef,
        {
          name,
          providedCpf: cleanProvidedCpf || cleanRegisteredCpf,
          generatedAt: new Date().toISOString(),
          emittedOnDashboard: isDashboard,
        },
        { merge: true }
      );

      // console.log("Certificado registrado para:", cleanRegisteredCpf);

      // console.log("Template name:", templateName);

      // Tentar gerar e baixar o certificado automaticamente

      const windowPathname = windowLocation;
      let templateName = "default";

      switch (windowPathname) {
        case "/certificado-comissao-cientifica":
          templateName = "cientifica";
          break;
        case "/certificado-monitoria":
          templateName = "monitoria";
          break;
        case "/certificado-comissao-organizadora":
          templateName = "organizadora";
          break;
        default:
          templateName = "default";
      }

      try {
        const pdfData = await this.pdfService.generateCertificate(
          cleanRegisteredCpf,
          name,
          templateName
        );
        this.pdfService.downloadCertificate(pdfData);
        return {
          status: "success",
          message: "Certificado gerado e baixado automaticamente.",
          participant: updatedParticipants.find(
            (p) =>
              this.cleanIdentifier(p.cpf || p.document) === cleanRegisteredCpf
          ),
          checkoutId,
          checkoutData,
          registeredCpf: cleanRegisteredCpf,
          pdfData, // Inclui pdfData para uso manual, se necessário
        };
      } catch (downloadError) {
        console.error("Erro no download automático:", downloadError);
        return {
          status: "success_with_manual_download",
          message: "Certificado gerado. Use a opção de download manual.",
          participant: updatedParticipants.find(
            (p) =>
              this.cleanIdentifier(p.cpf || p.document) === cleanRegisteredCpf
          ),
          checkoutId,
          checkoutData,
          registeredCpf: cleanRegisteredCpf,
          pdfData: null, // Pode incluir pdfData se quiser tentar gerar novamente no manual
        };
      }
    } catch (error) {
      console.error("Erro ao registrar certificado:", error);
      throw new Error(error.message || "Erro ao registrar certificado.");
    }
  }

  validateInputs(cpf, email, phone) {
    const cleanCpf = this.cleanIdentifier(cpf);
    const cleanEmail = this.cleanEmail(email);
    const cleanPhone = this.cleanPhone(phone);
    console.log("Entradas validadas:", { cleanCpf, cleanEmail, cleanPhone });

    if (!cleanCpf && !cleanEmail && !cleanPhone) {
      throw new Error("Forneça CPF, e-mail ou telefone válido.");
    }

    return { cleanCpf, cleanEmail, cleanPhone };
  }

  async buildQuery() {
    const checkoutsRef = collection(db, "checkouts");
    const q = query(checkoutsRef, where("status", "==", "approved"));
    const snapshot = await getDocs(q);
    console.log("Documentos encontrados:", snapshot.docs.length);
    return snapshot;
  }

  async findParticipantByCpf(cleanCpf, snapshot) {
    if (!cleanCpf)
      return { participant: null, checkoutId: null, checkoutData: null };

    for (const checkoutDoc of snapshot.docs) {
      const checkout = checkoutDoc.data();
      const participant = checkout.participants?.find((p) => {
        const participantCpf = this.cleanIdentifier(p.cpf);
        const participantDocument = this.cleanIdentifier(p.document);
        // console.log("Comparando CPF:", {
        //   participantCpf,
        //   participantDocument,
        //   cleanCpf,
        // });
        return participantCpf === cleanCpf || participantDocument === cleanCpf;
      });

      if (participant) {
        return {
          participant,
          checkoutId: checkoutDoc.id,
          checkoutData: checkout,
        };
      }
    }

    return { participant: null, checkoutId: null, checkoutData: null };
  }

  async findParticipantByEmail(cleanEmail, snapshot) {
    if (!cleanEmail)
      return { participant: null, checkoutId: null, checkoutData: null };

    for (const checkoutDoc of snapshot.docs) {
      const checkout = checkoutDoc.data();
      const participant = checkout.participants?.find((p) => {
        const participantEmail = this.cleanEmail(p.email);
        console.log("Comparando email:", { participantEmail, cleanEmail });
        return participantEmail === cleanEmail;
      });

      if (participant) {
        return {
          participant,
          checkoutId: checkoutDoc.id,
          checkoutData: checkout,
        };
      }
    }

    return { participant: null, checkoutId: null, checkoutData: null };
  }

  async findParticipantByPhone(cleanPhone, snapshot) {
    if (!cleanPhone)
      return { participant: null, checkoutId: null, checkoutData: null };

    for (const checkoutDoc of snapshot.docs) {
      const checkout = checkoutDoc.data();
      const participant = checkout.participants?.find((p) => {
        const participantPhone = this.cleanPhone(p.number);
        console.log("Comparando telefone:", { participantPhone, cleanPhone });
        return participantPhone === cleanPhone;
      });

      if (participant) {
        return {
          participant,
          checkoutId: checkoutDoc.id,
          checkoutData: checkout,
        };
      }
    }

    return { participant: null, checkoutId: null, checkoutData: null };
  }

  compareNames(providedName, registeredName) {
    const providedFirstName = providedName.trim().split(" ")[0].toLowerCase();
    const registeredFirstName = registeredName
      .trim()
      .split(" ")[0]
      .toLowerCase();
    console.log("Comparando nomes:", {
      providedFirstName,
      registeredFirstName,
    });
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
