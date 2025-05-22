import React, { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";
import { db } from "../../../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import logo from "../../assets/logos/logo-no-text.png";

const Tickets = () => {
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [participant, setParticipant] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfName, setPdfName] = useState("");
  const templateRef = useRef(null);

  // Função para formatar CPF
  const formatCpf = (value) => {
    const cleanCpf = value.replace(/[^\d]/g, "");
    if (cleanCpf.length <= 11) {
      return cleanCpf
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return cleanCpf;
  };

  // Manipulador de mudança no input do CPF
  const handleCpfChange = (e) => {
    const formattedCpf = formatCpf(e.target.value);
    setCpf(formattedCpf);
  };

  // Função para buscar checkout pelo CPF no Firebase
  const fetchCheckoutByCpf = async (cpf) => {
    try {
      const cleanCpf = cpf.replace(/[^\d]/g, "");
      if (cleanCpf.length !== 11) {
        throw new Error("CPF inválido. Deve conter 11 dígitos.");
      }

      console.log(`Buscando checkout para CPF: ${cleanCpf}`);
      const checkoutsRef = collection(db, "checkouts");
      const snapshot = await getDocs(checkoutsRef); // TODO: Otimizar com query

      let matchingCheckout = null;
      let matchingParticipant = null;

      for (const doc of snapshot.docs) {
        const checkout = { id: doc.id, ...doc.data() };
        const participant = checkout.participants?.find((p) => {
          const participantCpf =
            p.cpf && typeof p.cpf === "string"
              ? p.cpf.replace(/[^\d]/g, "")
              : null;
          return participantCpf === cleanCpf;
        });
        if (participant) {
          console.log(
            `Participante encontrado: ${participant.name} no checkout ${doc.id}`
          );
          matchingCheckout = checkout;
          matchingParticipant = participant;
          break; // Sai do loop após encontrar o participante
        }
      }

      if (!matchingCheckout) {
        console.log("Nenhum checkout encontrado para o CPF informado.");
        throw new Error("Nenhum checkout encontrado para este CPF.");
      }

      return { checkout: matchingCheckout, participant: matchingParticipant };
    } catch (error) {
      console.error("Erro ao buscar checkout:", error);
      throw new Error(
        error.message || "Erro ao buscar dados no Firebase. Tente novamente."
      );
    }
  };

  // Função para gerar o PDF
  const generatePDF = async (checkoutData, participantData) => {
    setLoading(true);
    try {
      console.log("Gerando PDF para participante:", participantData);
      const qrRawDataDay1 = participantData.qrRawData?.["2025-05-31"];
      const qrRawDataDay2 = participantData.qrRawData?.["2025-06-01"];

      if (!qrRawDataDay1 || !qrRawDataDay2) {
        console.log("qrRawData ausente:", { qrRawDataDay1, qrRawDataDay2 });
        toast.error("Dados de QR Code não encontrados para este participante.");
        setLoading(false);
        return;
      }

      console.log("qrRawData encontrado:", { qrRawDataDay1, qrRawDataDay2 });

      // Atualizar o estado com checkout e participante
      setCheckout(checkoutData);
      setParticipant(participantData);

      // Aguardar a renderização do template
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verificar o template
      const templateElement = templateRef.current;
      if (!templateElement) {
        console.error("Elemento do template não encontrado.");
        toast.error("Erro ao renderizar o template. Tente novamente.");
        setLoading(false);
        return;
      }

      console.log("Renderizando template HTML com html2canvas...");
      const canvas = await html2canvas(templateElement, {
        scale: 2, // Aumentar a resolução
        useCORS: true, // Habilitar CORS para imagens externas
      });
      console.log(
        "Canvas gerado com sucesso:",
        canvas.width,
        "x",
        canvas.height
      );

      // Criar o PDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Converter canvas para imagem
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210; // Largura A4 em mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width; // Proporção mantida

      // Adicionar imagem ao PDF
      doc.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      console.log("Imagem do template adicionada ao PDF.");

      // Gerar o nome do PDF
      const generatedPdfName = `tickets_${
        checkoutData.id
      }_${participantData.name.replace(/\s/g, "_")}.pdf`;
      setPdfName(generatedPdfName);

      // Criar Blob e URL para download manual
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfUrl);

      // Download automático
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

  // Função para buscar checkout pelo CPF e gerar PDF
  const handleGeneratePDF = async () => {
    if (!cpf || cpf.replace(/[^\d]/g, "").length !== 11) {
      toast.error("Por favor, insira um CPF válido.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setPdfUrl(null); // Limpar URL anterior
    setPdfName("");
    try {
      const { checkout, participant } = await fetchCheckoutByCpf(cpf);
      await generatePDF(checkout, participant);
    } catch (error) {
      setErrorMessage(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar o PDF gerado
  const clearPdf = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
      setPdfName("");
      setParticipant(null);
      setCheckout(null);
    }
  };

  return (
    <div>
      <div style={styles.container}>
        <h2>Gerar Ingressos por CPF</h2>
        {errorMessage && <p style={styles.error}>{errorMessage}</p>}
        <div style={styles.inputGroup}>
          <label style={styles.label}>CPF do Participante:</label>
          <input
            type="text"
            value={cpf}
            onChange={handleCpfChange}
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
            <a
              href={pdfUrl}
              download={pdfName}
              style={styles.downloadButton}
              onClick={clearPdf}
            >
              Baixar PDF Manualmente
            </a>
          </div>
        )}
      </div>

      {/* Template HTML escondido */}
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
              CONGRESSO AUTISMO MA 2025
            </div>
          </div>

          {/* Ticket 1 */}
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
                CONGRESSO AUTISMO MA 2025
              </div>
              <div style={{ fontSize: "10px", marginBottom: "5px" }}>
                NOME: {participant?.name?.toUpperCase() || ""}
              </div>
              <div style={{ fontSize: "10px", marginBottom: "5px" }}>
                DATA: 31.05.2025
              </div>
              <div style={{ fontSize: "10px", marginBottom: "5px" }}>
                LOCAL: CENTRO DE CONVENÇÕES MA
              </div>
              <div style={{ fontSize: "10px" }}>HORÁRIO: 08:00 - 18:00</div>
            </div>
            <div style={{ width: "113px", height: "113px" }}>
              {participant && participant.qrRawData && (
                <QRCodeSVG
                  id="qrCode1"
                  value={participant.qrRawData["2025-05-31"] || ""}
                  size={113}
                  level="H"
                />
              )}
            </div>
          </div>

          {/* Ticket 2 */}
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
                CONGRESSO AUTISMO MA 2025
              </div>
              <div style={{ fontSize: "10px", marginBottom: "5px" }}>
                NOME: {participant?.name?.toUpperCase() || ""}
              </div>
              <div style={{ fontSize: "10px", marginBottom: "5px" }}>
                DATA: 01.06.2025
              </div>
              <div style={{ fontSize: "10px", marginBottom: "5px" }}>
                LOCAL: CENTRO DE CONVENÇÕES MA
              </div>
              <div style={{ fontSize: "10px" }}>HORÁRIO: 08:00 - 18:00</div>
            </div>
            <div style={{ width: "113px", height: "113px" }}>
              {participant && participant.qrRawData && (
                <QRCodeSVG
                  id="qrCode2"
                  value={participant.qrRawData["2025-06-01"] || ""}
                  size={113}
                  level="H"
                />
              )}
            </div>
          </div>

          {/* Rodapé */}
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
    display: "inline-block",
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    backgroundColor: "#2980b9",
    color: "#ffffff",
    textAlign: "center",
    textDecoration: "none",
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
