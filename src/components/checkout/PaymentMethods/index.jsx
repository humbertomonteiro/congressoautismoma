import React, { useState } from "react";
import styles from "./paymentMethods.module.css";
import { FaCreditCard, FaPix } from "react-icons/fa6";
import { IoDocumentText } from "react-icons/io5";

const PaymentMethods = ({ setPaymentMethod }) => {
  const [activeMethod, setActiveMethod] = useState("creditCard");

  const handlePaymentSelection = (method) => {
    setActiveMethod(method);
    setPaymentMethod(method);
  };

  return (
    <div className={styles.paymentMethods}>
      <h2>Como você quer pagar?</h2>
      <div className={styles.methods}>
        <button
          onClick={() => handlePaymentSelection("creditCard")}
          className={`${activeMethod === "creditCard" ? styles.active : ""}`}
        >
          <FaCreditCard />
          <strong>Cartão de Crédito</strong>
        </button>
        <button
          onClick={() => handlePaymentSelection("pix")}
          className={`${activeMethod === "pix" ? styles.active : ""}`}
        >
          <FaPix />
          <strong>PIX</strong>
        </button>
        <button
          onClick={() => handlePaymentSelection("boleto")}
          className={`${activeMethod === "boleto" ? styles.active : ""}`}
        >
          <IoDocumentText />
          <strong>Boleto com pix</strong>
        </button>
      </div>
    </div>
  );
};

export default PaymentMethods;
