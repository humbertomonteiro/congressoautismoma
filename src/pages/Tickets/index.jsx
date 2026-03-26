import React, { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import { toast } from "react-toastify";
import { db } from "../../../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import logo from "../../assets/logos/logo-no-text.png";
import html2canvas from "html2canvas";

const Tickets = () => {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [participant, setParticipant] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfName, setPdfName] = useState("");
  const templateRef = useRef(null);

  // Limpar a URL do Blob quando o componente for desmontado ou um novo PDF for gerado
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        console.log("URL do Blob revogada ao desmontar.");
      }
    };
  }, [pdfUrl]);

  // Função para formatar CPF
  const formatCpf = (value) => {
    const cleanValue = value.replace(/[^\d]/g, "");
    if (cleanValue.length === 11) {
      return cleanValue
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return value; // Return original value for document numbers
  };

  // Manipulador de mudança no input
  const handleIdentifierChange = (e) => {
    const formattedValue = formatCpf(e.target.value);
    setIdentifier(formattedValue);
  };

  // Função para buscar checkout pelo CPF ou documento no Firebase
  const fetchCheckoutByIdentifier = async (identifier) => {
    try {
      const cleanIdentifier = identifier.replace(/[^\d]/g, "").trim();
      if (!cleanIdentifier) {
        throw new Error(
          "Por favor, insira um CPF ou número de documento válido."
        );
      }

      console.log(
        `Buscando checkout aprovado para identificador: ${cleanIdentifier}`
      );
      const checkoutsRef = collection(db, "checkouts");
      // Adiciona query para filtrar apenas checkouts com status "approved"
      const q = query(
        checkoutsRef,
        where("status", "==", "approved"),
        where("eventName", "==", "Congresso Autismo MA 2026")
      );
      const snapshot = await getDocs(q);
      console.log(`Total de checkouts aprovados encontrados: ${snapshot.size}`);

      let matchingCheckout = null;
      let matchingParticipant = null;

      for (const doc of snapshot.docs) {
        const checkout = { id: doc.id, ...doc.data() };
        const participant = checkout.participants?.find((p) => {
          const participantCpf =
            p.cpf && typeof p.cpf === "string"
              ? p.cpf.replace(/[^\d]/g, "").trim()
              : null;
          const participantDocument =
            p.document && typeof p.document === "string"
              ? p.document.replace(/[^\d]/g, "").trim()
              : null;
          return (
            participantCpf === cleanIdentifier ||
            participantDocument === cleanIdentifier
          );
        });
        if (participant) {
          console.log(
            `Participante encontrado: ${participant.name} no checkout ${doc.id}`
          );
          matchingCheckout = checkout;
          matchingParticipant = participant;
          break; // Exit loop after finding a match
        }
      }

      if (!matchingCheckout) {
        console.log(
          "Nenhum checkout aprovado encontrado para o identificador informado."
        );
        throw new Error(
          "Nenhum checkout aprovado encontrado para este CPF ou número de documento."
        );
      }

      return { checkout: matchingCheckout, participant: matchingParticipant };
    } catch (error) {
      console.error("Erro ao buscar checkout:", error);
      throw new Error(
        error.message || "Erro ao buscar dados no Firebase. Tente novamente."
      );
    }
  };

  // Função para gerar o PDF (mantida igual)
  const generatePDF = async (checkoutData, participantData) => {
    setLoading(true);
    try {
      console.log("Gerando PDF para participante:", participantData);
      const qrRawDataDay1 = participantData.qrRawData?.["2026-05-16"];
      const qrRawDataDay2 = participantData.qrRawData?.["2026-05-17"];

      if (!qrRawDataDay1 || !qrRawDataDay2) {
        console.log("qrRawData ausente:", { qrRawDataDay1, qrRawDataDay2 });
        toast.error("Dados de QR Code não encontrados para este participante.");
        setLoading(false);
        return;
      }

      console.log("qrRawData encontrado:", { qrRawDataDay1, qrRawDataDay2 });

      setCheckout(checkoutData);
      setParticipant(participantData);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const templateElement = templateRef.current;
      if (!templateElement) {
        console.error("Elemento do template não encontrado.");
        toast.error("Erro ao renderizar o template. Tente novamente.");
        setLoading(false);
        return;
      }

      console.log("Renderizando template HTML com html2canvas...");
      const canvas = await html2canvas(templateElement, {
        scale: 2,
        useCORS: true,
      });
      console.log(
        "Canvas gerado com sucesso:",
        canvas.width,
        "x",
        canvas.height
      );

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      doc.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      console.log("Imagem do template adicionada ao PDF.");

      const generatedPdfName = `tickets_${
        checkoutData.id
      }_${participantData.name.replace(/\s/g, "_")}.pdf`;
      setPdfName(generatedPdfName);

      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfUrl);

      doc.save(generatedPdfName);
      console.log(`PDF salvo como: ${generatedPdfName}`);
      toast.success(
        "PDF gerado com sucesso! Clique no botão abaixo se o download não iniciar."
      );
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar o PDF. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar checkout pelo identificador e gerar PDF
  const handleGeneratePDF = async () => {
    if (!identifier || identifier.replace(/[^\d]/g, "").length < 1) {
      toast.error("Por favor, insira um CPF ou número de documento válido.");
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
      const { checkout, participant } = await fetchCheckoutByIdentifier(
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

  // Função para iniciar o download manual
  const handleManualDownload = () => {
    if (pdfUrl && pdfName) {
      try {
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = pdfName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download iniciado!", {
          position: "bottom-right",
          autoClose: 3000,
        });
      } catch (error) {
        console.error("Erro ao iniciar download manual:", error);
        toast.error("Erro ao baixar o PDF. Tente novamente.", {
          position: "bottom-right",
          autoClose: 3000,
        });
      }
    } else {
      toast.error("Nenhum PDF disponível para download.", {
        position: "bottom-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <div>
      <div style={styles.container}>
        <h2>Gerar Ingressos por CPF</h2>
        {errorMessage && <p style={styles.error}>{errorMessage}</p>}
        <div style={styles.inputGroup}>
          <label style={styles.label}>CPF do participante:</label>
          <input
            type="text"
            value={identifier}
            onChange={handleIdentifierChange}
            placeholder="Digite o CPF (ex: 123.456.789-00)"
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
          {loading ? "Gerando PDF..." : "Gerar PDF dos Ingressos"}
        </button>
        {pdfUrl && (
          <div style={{ marginTop: "20px" }}>
            <button
              onClick={handleManualDownload}
              style={styles.downloadButton}
            >
              Baixar PDF Manualmente
            </button>
          </div>
        )}
      </div>

      {/* Template HTML escondido (mantido igual) */}
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

          <div
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
                DATA: 16.05.2026
              </div>
              {/* <div style={{ fontSize: "10px", marginBottom: "5px" }}>
                LOCAL: CENTRO DE CONVENÇÕES MA
              </div> */}
              <div style={{ fontSize: "10px" }}>HORÁRIO: 08:00 - 18:00</div>
            </div>
            <div style={{ width: "113px", height: "113px" }}>
              {participant && participant.qrRawData && (
                <QRCodeSVG
                  id="qrCode1"
                  value={participant.qrRawData["2026-05-16"] || ""}
                  size={113}
                  level="H"
                />
              )}
            </div>
          </div>

          <div
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
                DATA: 17.05.2026
              </div>
              {/* <div style={{ fontSize: "10px", marginBottom: "5px" }}>
                LOCAL: CENTRO DE CONVENÇÕES MA
              </div> */}
              <div style={{ fontSize: "10px" }}>HORÁRIO: 08:00 - 18:00</div>
            </div>
            <div style={{ width: "113px", height: "113px" }}>
              {participant && participant.qrRawData && (
                <QRCodeSVG
                  id="qrCode2"
                  value={participant.qrRawData["2026-05-17"] || ""}
                  size={113}
                  level="H"
                />
              )}
            </div>
          </div>

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

// Estilos inline para o componente
const styles = {
  container: {
    maxWidth: "400px",
    margin: "20px auto",
    padding: "20px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  inputGroup: {
    marginBottom: "20px",
  },
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
    transition: "background-color 0.3s",
  },
  buttonDisabled: {
    backgroundColor: "#95a5a6",
    cursor: "not-allowed",
  },
  downloadButton: {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    backgroundColor: "#2980b9",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  error: {
    color: "#d32f2f",
    fontSize: "14px",
    marginBottom: "15px",
  },
};

export default Tickets;
