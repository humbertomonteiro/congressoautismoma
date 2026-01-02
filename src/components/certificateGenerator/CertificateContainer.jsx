import CheckoutListCards from "../admin/dashboard/CheckoutListCards";
import Filters from "../admin/dashboard/Filters";
import CertificateGenerator from "./CertificateGenerator";
import styles from "./certificateGenerator.module.css";

const CertificateContainer = () => {
  const checkout = window.location.pathname === "/certificado";
  return (
    <div className={checkout ? styles.sectionUser : styles.section}>
      <div className={styles.title}>
        <h1>Gerador de certificado</h1>
      </div>
      <CertificateGenerator />
    </div>
  );
};

export default CertificateContainer;
