import styles from "./countdownTimer.module.css";
import { useState, useEffect } from "react";

const CountdownTimer = ({ targetDate }) => {
  const targetTime = new Date(targetDate).getTime();
  const [timeLeft, setTimeLeft] = useState(targetTime - new Date().getTime());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
      } else {
        setTimeLeft(difference);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  const formatTime = (time) => {
    const days = Math.floor(time / (1000 * 60 * 60 * 24));
    const hours = Math.floor((time % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((time % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  };

  const { days, hours, minutes, seconds } = formatTime(timeLeft);

  const formatNumber = (num) => num.toString().padStart(2, "0");

  return (
    <div className={styles.container}>
      {timeLeft > 0 ? (
        <div className={styles.timer}>
          <h3>Contagem regressiva para virada de lote:</h3>
          <div className={styles.boxes}>
            <div className={styles.box}>
              <strong>{formatNumber(days)}</strong>
              <p>Dias</p>
            </div>
            <strong>:</strong>
            <div className={styles.box}>
              <strong>{formatNumber(hours)}</strong>
              <p>Horas</p>
            </div>
            <strong>:</strong>
            <div className={styles.box}>
              <strong>{formatNumber(minutes)}</strong>
              <p>Minutos</p>
            </div>
            <strong>:</strong>
            <div className={styles.box}>
              <strong>{formatNumber(seconds)}</strong>
              <p>Segundos</p>
            </div>
          </div>
        </div>
      ) : (
        <p className={styles.noTimer}>Lote encerrado!</p>
      )}
    </div>
  );
};

export default CountdownTimer;
