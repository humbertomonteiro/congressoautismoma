import styles from "./support.module.css";
import Section from "../../shared/Section";
import Title from "../../shared/Title";
import prefeituraMaranhao from "../../../assets/support/logo-gov.jpg";
import imgBottom from "../../../assets/bg/bg-bootm1.jpg";

const Support = () => {
  return (
    <Section>
      <Title text="Apoio" align="center" />
      <div data-aos="zoom-in" className={styles.container}>
        <img
          className={styles.support}
          src={prefeituraMaranhao}
          alt="Prefeitura Maranhão"
        />
        <div className={styles.imgBottom}>
          <img src={imgBottom} alt="logo colorida" />
        </div>
      </div>
    </Section>
  );
};

export default Support;
