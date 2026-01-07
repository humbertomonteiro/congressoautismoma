import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./ThankYouPage.module.css";
import { FaCheckCircle } from "react-icons/fa";
import ButtonSecondary from "../../components/shared/ButtonSecondary";

import { IoMdDownload } from "react-icons/io";
import { GoHomeFill } from "react-icons/go";

const ThankYouPage = ({ totalValue }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extrair dados do estado da navegação
  const rawTotal = totalValue || location.state?.total || 0;
  const paymentMethod = location.state?.paymentMethod || "creditCard";
  const boletoLink = location.state?.boletoLink || null;
  const linhaDigitavel = location.state?.linhaDigitavel || null;
  const qrCodePix = location.state?.qrCodePix || null;
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

  const handleDownloadBoleto = () => {
    if (boletoLink) {
      window.open(boletoLink, "_blank");
    } else {
      console.error("Link do boleto não disponível.");
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
          {!isCreditCard && boletoLink && (
            <ButtonSecondary onClick={handleDownloadBoleto}>
              Baixar Boleto <IoMdDownload style={{ fontSize: "1.5rem" }} />
            </ButtonSecondary>
          )}
          <ButtonSecondary onClick={() => navigate("/")}>
            Voltar para a Home <GoHomeFill style={{ fontSize: "1.5rem" }} />
          </ButtonSecondary>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
