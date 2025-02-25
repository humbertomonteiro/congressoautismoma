import styles from "./footer.module.css";
import logo from "../../../assets/logos/logo.png";
import logoTel from "../../../assets/logos/logos-telefone.png";

import { FaInstagram, FaWhatsapp } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className={styles.container}>
      <div className={styles.infos}>
        <a href="/" className={styles.info}>
          <img className={styles.logo} src={logo} alt="Realização do projeto" />
        </a>

        <div className={styles.info}>
          <h3>Contato</h3>
          <div className={styles.links}>
            <a href="https://www.instagram.com/educandar_/" target="_blank">
              Instagram <FaInstagram />
            </a>
            <a
              href="https://wa.me/5598988830200?text=Ol%C3%A1,%20vim%20do%20site%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es."
              target="_blank"
            >
              Whatsapp <FaWhatsapp />
            </a>
          </div>
        </div>
        <div className={styles.info}>
          <img src={logoTel} alt="Realização do projeto" />
        </div>
      </div>
      <div className={styles.copy}>
        <span>&copy;Congresso Autismo MA - Todos os direitos reservados</span>
        <p className={styles.create}>
          Criado por{" "}
          <a href="https://portfolio-three-bay-73.vercel.app/" target="_blank">
            &lt; Hum Dev / &gt;
          </a>{" "}
          com ❤️
        </p>
      </div>
    </footer>
  );
};

export default Footer;
