import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./ThankYouPage.module.css";
import { FaCheckCircle } from "react-icons/fa";
import ButtonSecondary from "../../components/shared/ButtonSecondary";

import { IoMdDownload } from "react-icons/io";
import { GoHomeFill } from "react-icons/go";
import { FaTicket } from "react-icons/fa6";

const isProduction = import.meta.env.VITE_ENV === "production";
const baseUrl = isProduction
  ? import.meta.env.VITE_BASE_URL_PRODUCTION
  : import.meta.env.VITE_BASE_URL_SANDBOX;

const ThankYouPage = ({ totalValue }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extrair dados do estado da navegação
  const rawTotal = totalValue || location.state?.total || 0;
  const paymentMethod = location.state?.paymentMethod || "creditCard";
  const checkoutId = location.state?.checkoutId || null;
  const boletoLink = location.state?.boletoLink || null;
  const linhaDigitavel = location.state?.linhaDigitavel || null;
  const qrCodePix = location.state?.qrCodePix || null;

  const [downloadLoading, setDownloadLoading] = useState(false);
  const purchaseTotal =
    typeof rawTotal === "string" ? parseFloat(rawTotal) : Number(rawTotal);
  const formattedTotal = isNaN(purchaseTotal)
    ? "0.00"
    : purchaseTotal.toFixed(2);

  console.log("Estado completo do location:", location.state);
  console.log("Dados extraídos:", {
    paymentMethod,
    boletoLink,
    linhaDigitavel,
    qrCodePix,
  });

  useEffect(() => {
    handleAddPaymentInfo();
  }, []);

  const handleAddPaymentInfo = (itemId) => {
    window.dataLayer.push({
      event: "purchase",
      items: [
        {
          item_id: itemId,
          item_name: "Ingresso Congresso Autismo 2026",
          price: formattedTotal,
          quantity: 1,
        },
      ],
      timestamp: new Date().toISOString(),
    });
  };

  const isCreditCard = paymentMethod === "creditCard";
  const title = isCreditCard
    ? "Compra Confirmada!"
    : "Pedido Gerado com Sucesso!";
  const message = isCreditCard ? (
    <>
      Obrigado por adquirir seu ingresso para o{" "}
      <strong>Congresso Autismo MA 2026</strong>! Estamos muito felizes em
      tê-lo(a) conosco nesse evento incrível. Um e-mail com os detalhes da sua
      compra foi enviado para você. Prepare-se para dois dias inesquecíveis de
      aprendizado e conexão!
    </>
  ) : (
    <>
      Parabéns por dar o primeiro passo para participar do{" "}
      <strong>Congresso Autismo MA 2026</strong>! Seu boleto foi gerado com
      sucesso. Para garantir sua vaga, efetue o pagamento até o vencimento
      usando o código de barras abaixo. Você também pode baixar o boleto
      novamente clicando no botão!{" "}
      <strong>
        Após pagamento, receberá um email com os detalhes da sua compra em até 6
        horas.
      </strong>
    </>
  );

  const handleDownloadBoleto = async () => {
    // Tenta o PDF pré-gerado primeiro; se não existir, pede ao backend para (re)gerar
    if (boletoLink) {
      window.open(boletoLink, "_blank");
      return;
    }

    if (!checkoutId) {
      alert(
        "Link do boleto não disponível. Use o código de barras abaixo para pagar."
      );
      return;
    }

    setDownloadLoading(true);
    try {
      const response = await fetch(
        `${baseUrl}/payments/boleto/${checkoutId}/pdf`
      );
      if (!response.ok) throw new Error("Erro ao gerar PDF");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `boleto_${checkoutId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao baixar boleto:", err);
      alert(
        "Não foi possível baixar o PDF. Use o código de barras abaixo para pagar."
      );
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleCopyLinhaDigitavel = () => {
    if (linhaDigitavel) {
      navigator.clipboard.writeText(linhaDigitavel);
      alert("Código de barras copiado para a área de transferência!");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <FaCheckCircle className={styles.successIcon} />
        </div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.message}>{message}</p>
        <div className={styles.details}>
          <p>
            <strong>Valor Total:</strong> R$ {formattedTotal}
          </p>
          <p>
            <strong>Data do Evento:</strong> 16 e 17 de maio de 2026
          </p>
          {!isCreditCard && (
            <>
              <p>
                <strong>Instrução:</strong> Pague o boleto até o vencimento para
                confirmar sua participação.
              </p>
              {linhaDigitavel && (
                <div>
                  <strong>Código de Barras:</strong>
                  <p
                    className={styles.clickableText}
                    onClick={handleCopyLinhaDigitavel}
                    title="Clique para copiar"
                  >
                    {linhaDigitavel}
                  </p>
                </div>
              )}
              {/* {qrCodePix && (
                <div>
                  <strong>QR Code:</strong>
                  <img
                    src={qrCodePix}
                    alt="QR Code PIX"
                    className={styles.qrCode}
                  />
                </div>
              )} */}
            </>
          )}
        </div>
        <div className={styles.actions}>
          {!isCreditCard && (
            <ButtonSecondary
              onClick={handleDownloadBoleto}
              disabled={downloadLoading}
            >
              {downloadLoading ? "Gerando PDF..." : "Baixar Boleto"}{" "}
              <IoMdDownload style={{ fontSize: "1.5rem" }} />
            </ButtonSecondary>
          )}
          <ButtonSecondary onClick={() => navigate("/")}>
            Voltar para a Home <GoHomeFill style={{ fontSize: "1.5rem" }} />
          </ButtonSecondary>
          {isCreditCard && (
            <ButtonSecondary action="link" link="/ingressos">
              Acessar ingresso <FaTicket styles={{ fontSize: "1.5rem" }} />
            </ButtonSecondary>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
