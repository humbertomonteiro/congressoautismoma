// src/components/checkout/PaymentMethods.js
import React from "react";
import styles from "./paymentMethods.module.css";
import { FaCreditCard, FaPix } from "react-icons/fa6";
import { IoDocumentText } from "react-icons/io5";

const PaymentMethods = ({ setPaymentMethod }) => {
  return (
    <div className={styles.paymentMethods}>
      <h2>Como você quer pagar?</h2>
      <div className={styles.methods}>
        <button
          onClick={() => setPaymentMethod("creditCard")}
          className={styles.creditCardButton}
        >
          <FaCreditCard />
          <strong>Cartão de Crédito</strong>
        </button>
        {/* <button
          onClick={() => setPaymentMethod("pix")}
          className={styles.pixButton}
        >
          <FaPix />
          <strong>PIX</strong>
        </button> */}
        <button
          onClick={() => setPaymentMethod("boleto")}
          className={styles.boletoButton}
        >
          <IoDocumentText />
          <strong>Boleto com pix</strong>
        </button>
      </div>
    </div>
  );
};

export default PaymentMethods;
