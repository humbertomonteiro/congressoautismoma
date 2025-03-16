import React from "react";
import styles from "./AnimatedButton.module.css";

const AnimatedButton = ({ isLoading, children, disabled, ...props }) => {
  return (
    <button
      className={`${styles.animatedButton} ${isLoading ? styles.loading : ""}`}
      disabled={disabled || isLoading}
      {...props}
    >
      <span className={styles.buttonText}>
        {isLoading ? (
          <span className={styles.loadingContent}>
            <span className={styles.spinner}></span>
            Processando
          </span>
        ) : (
          children
        )}
      </span>
    </button>
  );
};

export default AnimatedButton;
