import styles from "./paymentDetails.module.css";
import { useState } from "react";

const PaymentDetails = ({ paymentMethod, total, loading }) => {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [Maturity, setMaturity] = useState("");
  const [cardCode, setCardCode] = useState("");
  const [QuantityInstalment, setQuantityInstalment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      cardNumber,
      cardName,
      Maturity,
      cardCode,
      QuantityInstalment,
    };

    console.log(data);
  };
  const renderForm = () => {
    switch (paymentMethod) {
      case "creditCard":
        return (
          <div className={styles.paymentDetails}>
            <h2>Pagamento com Cartão de Crédito</h2>
            <label>
              <p>Número do cartão</p>
              <input
                type="text"
                placeholder="Digite o número do cartão"
                onChange={(e) => setCardNumber(e.target.value)}
                required
              />
            </label>
            <label>
              <p>Nome no cartão</p>
              <input
                type="text"
                placeholder="Nome como está no cartão"
                onChange={(e) => setCardName(e.target.value)}
                required
              />
            </label>
            <label>
              <p>Vencimento (MM/AA)</p>
              <input
                type="text"
                placeholder="MM/AAAA"
                onChange={(e) => setMaturity(e.target.value)}
                required
              />
            </label>
            <label>
              <p>CVC</p>
              <input
                type="text"
                placeholder="Digite o CVC"
                onChange={(e) => setCardCode(e.target.value)}
                maxLength="3"
                required
              />
            </label>
            <label>
              <p>Quantidade de parcelas</p>
              <select
                required
                onChange={(e) => setQuantityInstalment(e.target.value)}
              >
                <option value="">Escolha a quantidade de parcelas</option>
                {Array.from({ length: 10 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {index + 1} Parcela(s) de R${" "}
                    {(total / (index + 1)).toFixed(2)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        );
      case "pix":
        return (
          <div className={styles.paymentDetails}>
            <h2>Pagamento com PIX</h2>
            <p>
              Após clicar no botão abaixo, você verá o QR Code ou a chave PIX
              para realizar o pagamento. O valor total é:{" "}
              <strong>R$ {total}</strong>.
            </p>
          </div>
        );
      case "boleto":
        return (
          <div className={styles.paymentDetails}>
            <h2>Pagamento com Boleto</h2>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.payment}>
      <form onSubmit={handleSubmit}>
        {renderForm()}
        <button type="submit">
          {loading
            ? "Processando..."
            : paymentMethod === "boleto"
            ? "Gerar Boleto"
            : paymentMethod === "pix"
            ? "Gerar PIX"
            : "Comprar agora"}
        </button>
      </form>
    </div>
  );
};

export default PaymentDetails;

// case "debitCard":
//         return (
//           <div className={styles.paymentDetails}>
//             <h2>Pagamento com Cartão de Débito</h2>
//             <label>
//               <p>Número do cartão</p>
//               <input
//                 type="text"
//                 placeholder="Digite o número do cartão"
//                 required
//               />
//             </label>
//             <label>
//               <p>Nome no cartão</p>
//               <input
//                 type="text"
//                 placeholder="Nome como está no cartão"
//                 required
//               />
//             </label>
//             <label>
//               <p>Vencimento (MM/AA)</p>
//               <input type="text" placeholder="MM/AA" required />
//             </label>
//             <label>
//               <p>CVC</p>
//               <input
//                 type="text"
//                 placeholder="Digite o CVC"
//                 maxLength="3"
//                 required
//               />
//             </label>
//           </div>
//         );
