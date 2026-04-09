import { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import { toast } from "react-toastify";
import { db } from "../../../firebaseConfig";
import {
  collectionGroup,
  query,
  where,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import logo from "../../assets/logos/logo-no-text.png";
import html2canvas from "html2canvas";

const EVENT_DATES = ["2026-05-16", "2026-05-17"];

// Monta o valor do QR para uma data específica a partir do qrToken salvo
const buildQrValue = (qrToken, date) => {
  if (!qrToken) return "";
  try {
    return JSON.stringify({ ...JSON.parse(qrToken), date });
  } catch {
    return "";
  }
};

const Tickets = () => {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [participant, setParticipant] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfName, setPdfName] = useState("");
  const templateRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const formatCpf = (value) => {
    const clean = value.replace(/[^\d]/g, "");
    if (clean.length === 11) {
      return clean
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return value;
  };

  const handleIdentifierChange = (e) => {
    setIdentifier(formatCpf(e.target.value));
  };

  // Busca participante na subcoleção usando collectionGroup
  // const fetchParticipantByDocument = async (identifier) => {
  //   const cleanDoc = identifier.replace(/[^\d]/g, "").trim();
  //   if (!cleanDoc) throw new Error("Por favor, insira um CPF válido.");

  //   const q = query(
  //     collectionGroup(db, "participants"),
  //     where("document", "==", cleanDoc)
  //   );
  //   const snapshot = await getDocs(q);

  //   if (snapshot.empty) {
  //     throw new Error("Nenhum ingresso encontrado para este CPF.");
  //   }

  //   for (const participantDoc of snapshot.docs) {
  //     const checkoutRef = participantDoc.ref.parent.parent;
  //     const checkoutSnap = await getDoc(checkoutRef);

  //     if (!checkoutSnap.exists()) continue;

  //     const checkoutData = checkoutSnap.data();
  //     if (
  //       checkoutData.status === "approved" &&
  //       checkoutData.eventName === "Congresso Autismo MA 2026"
  //     ) {
  //       return {
  //         checkout: { id: checkoutSnap.id, ...checkoutData },
  //         participant: { id: participantDoc.id, ...participantDoc.data() },
  //       };
  //     }
  //   }

  //   throw new Error(
  //     "Nenhum ingresso aprovado encontrado para este CPF. Verifique se o pagamento foi confirmado."
  //   );
  // };

  const fetchParticipantByDocument = async (identifier) => {
    const cleanDoc = identifier.replace(/[^\d]/g, "").trim();
    if (!cleanDoc) throw new Error("Por favor, insira um CPF válido.");

    // Tenta pelo campo novo "document"
    let snapshot = await getDocs(
      query(
        collectionGroup(db, "participants"),
        where("document", "==", cleanDoc)
      )
    );

    // Fallback para campo legado "cpf"
    if (snapshot.empty) {
      snapshot = await getDocs(
        query(collectionGroup(db, "participants"), where("cpf", "==", cleanDoc))
      );
    }

    if (snapshot.empty) {
      throw new Error("Nenhum ingresso encontrado para este CPF.");
    }

    for (const participantDoc of snapshot.docs) {
      const checkoutRef = participantDoc.ref.parent.parent;
      const checkoutSnap = await getDoc(checkoutRef);

      if (!checkoutSnap.exists()) continue;

      const checkoutData = checkoutSnap.data();
      if (
        checkoutData.status === "approved" &&
        checkoutData.eventName === "Congresso Autismo MA 2026"
      ) {
        return {
          checkout: { id: checkoutSnap.id, ...checkoutData },
          participant: { id: participantDoc.id, ...participantDoc.data() },
        };
      }
    }

    throw new Error(
      "Nenhum ingresso aprovado encontrado para este CPF. Verifique se o pagamento foi confirmado."
    );
  };

  const generatePDF = async (_checkoutData, participantData) => {
    setLoading(true);
    try {
      if (!participantData.qrToken) {
        toast.error(
          "Seu ingresso ainda está sendo processado. Tente novamente em alguns minutos."
        );
        setLoading(false);
        return;
      }

      setParticipant(participantData);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const templateElement = templateRef.current;
      if (!templateElement) {
        toast.error("Erro ao renderizar o template. Tente novamente.");
        setLoading(false);
        return;
      }

      const canvas = await html2canvas(templateElement, {
        scale: 2,
        useCORS: true,
      });

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      doc.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      const generatedPdfName = `ingresso_${
        participantData.id
      }_${participantData.name.replace(/\s/g, "_")}.pdf`;
      setPdfName(generatedPdfName);

      const pdfBlob = doc.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);

      doc.save(generatedPdfName);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar o PDF. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!identifier || identifier.replace(/[^\d]/g, "").length < 11) {
      toast.error("Por favor, insira um CPF válido (11 dígitos).");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
      setPdfName("");
    }
    try {
      const { checkout, participant } = await fetchParticipantByDocument(
        identifier
      );
      await generatePDF(checkout, participant);
    } catch (error) {
      setErrorMessage(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualDownload = () => {
    if (pdfUrl && pdfName) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = pdfName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download iniciado!");
    } else {
      toast.error("Nenhum PDF disponível para download.");
    }
  };

  return (
    <div>
      <div style={styles.container}>
        <h2>Acessar meu ingresso</h2>
        <p style={{ color: "#555", marginBottom: "20px", fontSize: "14px" }}>
          Insira o CPF cadastrado no momento da compra para gerar seu ingresso.
        </p>
        {errorMessage && <p style={styles.error}>{errorMessage}</p>}
        <div style={styles.inputGroup}>
          <label style={styles.label}>CPF do participante:</label>
          <input
            type="text"
            value={identifier}
            onChange={handleIdentifierChange}
            placeholder="000.000.000-00"
            maxLength={14}
            style={styles.input}
          />
        </div>
        <button
          onClick={handleGeneratePDF}
          disabled={loading}
          style={
            loading
              ? { ...styles.button, ...styles.buttonDisabled }
              : styles.button
          }
        >
          {loading ? "Gerando..." : "Gerar ingresso"}
        </button>
        {pdfUrl && (
          <div style={{ marginTop: "20px" }}>
            <button
              onClick={handleManualDownload}
              style={styles.downloadButton}
            >
              Baixar PDF manualmente
            </button>
          </div>
        )}
      </div>

      {/* Template oculto para geração do PDF */}
      <div
        ref={templateRef}
        style={{
          position: "absolute",
          left: "-9999px",
          width: "595px",
          height: "842px",
        }}
      >
        <div
          style={{
            width: "595px",
            height: "842px",
            backgroundColor: "#fff",
            fontFamily: "'Helvetica', sans-serif",
            position: "relative",
          }}
        >
          {/* Cabeçalho */}
          <div
            style={{
              backgroundColor: "#2c3e50",
              width: "100%",
              height: "113px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={logo}
              alt="Logo"
              style={{ width: "113px", height: "57px" }}
            />
            <div
              style={{
                color: "#fff",
                fontSize: "16px",
                fontWeight: "bold",
                textAlign: "center",
                marginTop: "10px",
                width: "100%",
                position: "absolute",
                bottom: "10px",
              }}
            >
              CONGRESSO AUTISMO MA 2026
            </div>
          </div>

          {/* Ingresso Dia 1 */}
          {EVENT_DATES.map((date, idx) => (
            <div
              key={date}
              style={{
                width: "555px",
                height: "170px",
                margin: "20px auto",
                border: "2px solid #b0d1ce",
                borderRadius: "5px",
                display: "flex",
                alignItems: "center",
                padding: "10px",
                backgroundColor: "#fff",
              }}
            >
              <img
                src={logo}
                alt="Logo"
                style={{ width: "85px", height: "85px", marginRight: "20px" }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    marginBottom: "10px",
                  }}
                >
                  CONGRESSO AUTISMO MA 2026
                </div>
                <div style={{ fontSize: "10px", marginBottom: "5px" }}>
                  NOME: {participant?.name?.toUpperCase() || ""}
                </div>
                <div style={{ fontSize: "10px", marginBottom: "5px" }}>
                  DATA: {idx === 0 ? "16.05.2026" : "17.05.2026"}
                </div>
                <div style={{ fontSize: "10px" }}>HORÁRIO: 08:00 - 18:00</div>
              </div>
              <div style={{ width: "113px", height: "113px" }}>
                {participant?.qrToken && (
                  <QRCodeSVG
                    value={buildQrValue(participant.qrToken, date)}
                    size={113}
                    level="H"
                  />
                )}
              </div>
            </div>
          ))}

          <div
            style={{
              position: "absolute",
              bottom: "10px",
              width: "100%",
              textAlign: "center",
              fontSize: "8px",
              color: "#555",
            }}
          >
            CONGRESSO AUTISMO MA LTDA - suporte@congressoautismoma.com.br
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "400px",
    margin: "20px auto",
    padding: "20px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  inputGroup: { marginBottom: "20px" },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    width: "100%",
    padding: "10px",
    fontSize: "16px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    backgroundColor: "#2c3e50",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  buttonDisabled: { backgroundColor: "#95a5a6", cursor: "not-allowed" },
  downloadButton: {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    backgroundColor: "#2980b9",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  error: { color: "#d32f2f", fontSize: "14px", marginBottom: "15px" },
};

export default Tickets;
