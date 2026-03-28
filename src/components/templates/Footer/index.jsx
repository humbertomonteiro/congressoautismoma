import styles from "./footer.module.css";
import logo from "../../../assets/logos/logo.png";
import logoTel from "../../../assets/logos/logos-telefone.png";
import predio1 from "../../../assets/shared/predio.jpeg";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import { MdVerified, MdLocationOn, MdEmail } from "react-icons/md";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      {/* Faixa decorativa topo */}
      <div className={styles.topBar} />

      <div className={styles.wrapper}>
        {/* Coluna 1 — Logo + descrição */}
        <div className={styles.brand}>
          <img src={logo} alt="Congresso Autismo MA" className={styles.logo} />
          <p className={styles.brandDesc}>
            O maior congresso sobre autismo do Maranhão, reunindo profissionais,
            famílias e especialistas em um espaço de conhecimento e acolhimento.
          </p>
          <div className={styles.socialRow}>
            <a
              href="https://www.instagram.com/saludcuidarmais/"
              target="_blank"
              rel="noreferrer"
              className={styles.socialBtn}
              aria-label="Instagram"
            >
              <FaInstagram />
              <span>Instagram</span>
            </a>
            <a
              href="https://wa.me/5598991058908?text=Ol%C3%A1,%20vim%20do%20site%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es."
              target="_blank"
              rel="noreferrer"
              className={`${styles.socialBtn} ${styles.whatsapp}`}
              aria-label="WhatsApp"
            >
              <FaWhatsapp />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Divisor vertical */}
        {/* <div className={styles.divider} /> */}

        {/* Coluna 3 — Realização + sede */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>
            <span className={styles.titleDot} />
            Realização
          </h4>
          <img
            src={logoTel}
            alt="Salud Cuidar Mais"
            className={styles.realizationLogo}
          />
          <div className={styles.buildingCard}>
            <img
              src={predio1}
              alt="Sede da Salud"
              className={styles.buildingImg}
            />
            <div className={styles.buildingOverlay}>
              <MdLocationOn />
              <span>Nossa sede</span>
            </div>
          </div>
        </div>

        {/* Coluna 2 — Segurança */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>
            <span className={styles.titleDot} />
            Segurança
          </h4>
          <Link
            to="/vendedores-credenciados"
            className={styles.credentialedLink}
          >
            <span className={styles.credentialedIcon}>
              <MdVerified />
            </span>
            <span>
              <strong>Vendedores Credenciados</strong>
              <small>Verifique quem está autorizado a vender ingressos</small>
            </span>
          </Link>
          <p className={styles.securityNote}>
            Nunca realize pagamentos para vendedores fora da lista oficial.
          </p>
        </div>
      </div>

      {/* Rodapé inferior */}
      <div className={styles.bottom}>
        <span className={styles.copy}>
          &copy; {new Date().getFullYear()} Congresso Autismo MA — Todos os
          direitos reservados
        </span>
        <span className={styles.credits}>
          Desenvolvido com ❤️ por{" "}
          <a
            href="https://portfolio-three-bay-73.vercel.app/"
            target="_blank"
            rel="noreferrer"
          >
            Hum Dev
          </a>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
