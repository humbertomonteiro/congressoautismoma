import React from "react";
import styles from "./paymentMethods.module.css";
import { FaCreditCard } from "react-icons/fa6";
import { FaPix } from "react-icons/fa6";
import { IoDocumentText } from "react-icons/io5";

const PaymentMethods = ({ setPaymentMethod }) => {
  return (
    <div className={styles.paymentMethods}>
      <h2>Como você quer pagar?</h2>
      <div className={styles.methods}>
        <button onClick={() => setPaymentMethod("creditCard")}>
          <FaCreditCard style={{ fontSize: "2.3rem" }} />
          <strong>Cartão de Crédito</strong>
        </button>
        <button onClick={() => setPaymentMethod("pix")}>
          <FaPix />
          <strong>PIX</strong>
        </button>
        <button onClick={() => setPaymentMethod("boleto")}>
          <IoDocumentText />
          <strong>Boleto</strong>
        </button>
      </div>
    </div>
  );
};

export default PaymentMethods;
