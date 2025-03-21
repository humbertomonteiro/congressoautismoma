import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./ThankYouPage.module.css";
import { FaCheckCircle } from "react-icons/fa";
import ButtonSecondary from "../../components/shared/ButtonSecondary";

const ThankYouPage = ({ totalValue }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extrair dados do estado da navegação
  const rawTotal = totalValue || location.state?.total || 0;
  const paymentMethod = location.state?.paymentMethod || "creditCard"; // Default para crédito se não especificado
  const purchaseTotal =
    typeof rawTotal === "string" ? parseFloat(rawTotal) : Number(rawTotal);
  const formattedTotal = isNaN(purchaseTotal)
    ? "0.00"
    : purchaseTotal.toFixed(2);

  useEffect(() => {
    handleAddPaymentInfo();
  }, []);

  const handleAddPaymentInfo = (itemId) => {
    window.dataLayer.push({
      event: "purchase",
      items: [
        {
          item_id: itemId,
          item_name: "Ingresso Congresso Autismo 2025",
          price: formattedTotal,
          quantity: 1,
        },
      ],
      timestamp: new Date().toISOString(),
    });
  };

  // Redirecionar para a home após 30 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 30000); // 30 segundos
    return () => clearTimeout(timer);
  }, [navigate]);

  // Conteúdo dinâmico baseado no método de pagamento
  const isCreditCard = paymentMethod === "creditCard";
  const title = isCreditCard
    ? "Compra Confirmada!"
    : "Pedido Gerado com Sucesso!";
  const message = isCreditCard ? (
    <>
      Obrigado por adquirir seu ingresso para o{" "}
      <strong>Congresso Autismo MA 2025</strong>! Estamos muito felizes em
      tê-lo(a) conosco nesse evento incrível. Um e-mail com os detalhes da sua
      compra foi enviado para você. Prepare-se para dois dias inesquecíveis de
      aprendizado e conexão!
    </>
  ) : (
    <>
      Parabéns por dar o primeiro passo para participar do{" "}
      <strong>Congresso Autismo MA 2025</strong>! Seu boleto foi gerado com
      sucesso. Para garantir sua vaga, efetue o pagamento até o vencimento.
      Verifique seus downloads!
    </>
  );

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
            <strong>Data do Evento:</strong> 31 de maio e 1º de junho de 2025
          </p>
          {!isCreditCard && (
            <p>
              <strong>Instrução:</strong> Pague o boleto até o vencimento para
              confirmar sua participação.
            </p>
          )}
        </div>
        <div className={styles.actions}>
          <ButtonSecondary onClick={() => navigate("/")}>
            Voltar para a Home
          </ButtonSecondary>
        </div>
        <p className={styles.footerNote}>
          Você será redirecionado automaticamente em 30 segundos.
        </p>
      </div>
    </div>
  );
};

export default ThankYouPage;
