import styles from "./header.module.css";
import logo from "../../../assets/logos/logo-no-text.png";
// import Button from "../../shared/Button";
import ButtonSecondary from "../../shared/ButtonSecondary";
// import logosTel from "../../../assets/logos/logos-telefone.png";
import { IoRocketOutline } from "react-icons/io5";
// import { RiDoubleQuotesL, RiDoubleQuotesR } from "react-icons/ri";
// import bgTop from "../../../assets/bg/bg-top1.jpg";
// import bgBottom from "../../../assets/bg/bg-bootm1.jpg";

const Header = () => {
  return (
    <header id="header" data-aos="fade-up" className={styles.container}>
      {/* <div className={styles.phrase} data-aos="fade-right" data-aos-delay="600">
        <RiDoubleQuotesL className={styles.quotesTop} />
        <p>Cada aprendizado é uma peça que ajudasmos a encaixar</p>
        <RiDoubleQuotesR className={styles.quotesBottom} />
      </div> */}
      {/* <img src={bgTop} alt="background top" className={styles.bgTop} /> */}
      <div className={styles.content}>
        <div className={styles.logo}>
          <img src={logo} alt="Logo Salud" />
          <strong>Neurodiversidade em foco:</strong>
          <span>Caminhos Para Inclusão</span>
        </div>
        <h1>Terceira edição do Congresso!</h1>
        <h2 className={styles.date}>31/05 a 01/06/2025</h2>
        <p>
          Junte-se a especialistas, profissionais da saúde e educadores em um
          encontro dedicado à conscientização e troca de conhecimento.
        </p>

        <ButtonSecondary action={"link"} link="#tickets">
          COMPRAR INGRESSO <IoRocketOutline style={{ fontSize: "1.7rem" }} />
        </ButtonSecondary>
      </div>
      {/* <img src={bgBottom} alt="background bottom" className={styles.bgBottom} /> */}

      {/* <div className={styles.logos}>
        <img src={logosTel} alt="organizadores do projeto" />
      </div> */}
    </header>
  );
};

export default Header;
