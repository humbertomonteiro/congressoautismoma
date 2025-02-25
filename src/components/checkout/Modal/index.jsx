import React from "react";
import styles from "./Modal.module.css";

const Modal = ({ isOpen, onClose, title, message, type, content }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} ${styles[type]}`}>
        <h2>{title}</h2>
        {message && <p>{message}</p>}
        {content && <div>{content}</div>}
        <button onClick={onClose} className={styles.closeButton}>
          Fechar
        </button>
      </div>
    </div>
  );
};

export default Modal;
