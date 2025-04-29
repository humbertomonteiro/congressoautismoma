import styles from "./ButtonWhatsapp.module.css";
import { FaWhatsapp } from "react-icons/fa";

const ButtonWhatsapp = () => {
  return (
    <a
      //   data-aos="zoom-in"
      className={styles.button}
      href="https://api.whatsapp.com/send?phone=5511941234567&text=Olá!%20Gostaria%20de%20falar%20com%20vocês.%20"
      target="_blank"
      rel="noopener noreferrer"
    >
      <FaWhatsapp />
    </a>
  );
};

export default ButtonWhatsapp;
