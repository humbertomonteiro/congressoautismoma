import React from "react";
import styles from "./orderSummary.module.css";

const OrderSummary = ({
  ticketQuantity,
  onTicketQuantityChange,
  coupon,
  setCoupon,
  isCouponApplied,
  onApplyCoupon,
  onRemoveCoupon,
  calculateTotal,
}) => {
  return (
    <div className={styles.orderSummary}>
      {/* {!isCouponApplied ? (
        <div className={styles.couponSection}>
          <label>
            <p>Cupom de desconto</p>
            <div className={styles.couponInputWrapper}>
              <input
                type="text"
                placeholder="Digite seu cupom"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toLowerCase())}
              />
              <button onClick={onApplyCoupon} disabled={!coupon}>
                Aplicar
              </button>
            </div>
          </label>
        </div>
      ) : (
        <div className={styles.couponApplied}>
          <span>Cupom aplicado: {calculateTotal().appliedCoupon}</span>
          <button
            onClick={onRemoveCoupon}
            className={styles.removeCouponButton}
          >
            Remover
          </button>
        </div>
      )} */}
      <div className={styles.priceSummary}>
        <h2>Detalhes da compra:</h2>
        <div className={styles.details}>
          <div className={styles.summaryItem}>
            <strong>{ticketQuantity} ingresso(s): </strong>{" "}
            <span>R$ {(calculateTotal().total * 1).toFixed(2)}</span>
          </div>
          <div className={styles.summaryTotal}>
            <strong>Total: </strong>{" "}
            <span>10x de R$ {(calculateTotal().total / 10).toFixed(2)}</span>
          </div>
        </div>
        {/* <h2>Resumo do pedido</h2> */}
        {/* <div className={styles.summaryItem}>
          <div className={styles.subtotal}>
            <div className={styles.description}>
              <strong>{ticketQuantity} ingresso(s):</strong>
              <span>R$ {(calculateTotal().total * 1).toFixed(2)}</span>
            </div>
          </div>
          {calculateTotal().discount > 0 && (
            <div className={styles.summaryItem}>
              <span>Desconto ({calculateTotal().appliedCoupon}):</span>
              <strong>- R$ {calculateTotal().discount}</strong>
            </div>
          )}
          <div className={styles.summaryTotal}>
            <strong>Total: </strong>
            <span>R$ 10x de R$ {(calculateTotal().total / 10).toFixed(2)}</span>
          </div>
        </div> */}
      </div>

      <div className={styles.quantityOfItem}>
        {/* <p>Ingresso Congresso Autismo MA 2025</p> */}
        <h2>Quantidade de ingresso(s)</h2>
        <select value={ticketQuantity} onChange={onTicketQuantityChange}>
          {Array.from({ length: 60 }, (_, index) => (
            <option key={index + 1} value={index + 1}>
              {index + 1} ingresso(s)
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default OrderSummary;
