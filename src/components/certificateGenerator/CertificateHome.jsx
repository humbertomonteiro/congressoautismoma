import CertificateGenerator from "./CertificateGenerator";
import styles from "./certificateGenerator.module.css";
import Section from "../shared/Section";
import Title from "../shared/Title";
import img from "../../assets/bg/bg-logo-event.jpg";

const CertificateHome = () => {
  return (
    <Section>
      <Title align={"center"} text={"Emita seu certificado"} />
      <div className={styles.container} data-aos="zoom-in">
        <div className={styles.img}>
          <img
            src={img}
            // src="https://congressoautismoma.com.br/assets/certificate-Bx3D15cY.jpg"
            // src="https://img.freepik.com/vetores-premium/foto-de-estudante-de-graduacao_24911-68633.jpg?ga=GA1.1.2095538369.1681160396&semt=ais_hybrid&w=740"
            alt="Imagem de certificado"
          />
        </div>
        <div className={styles.content}>
          <CertificateGenerator />
        </div>
      </div>
    </Section>
  );
};

export default CertificateHome;
