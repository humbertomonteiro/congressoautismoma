import imgCertificate from "../../assets/certificate/certificate.png";
import imgCertificateCientifica from "../../assets/certificate/certificate-cientifica.png";
import imgCertificateMonitoria from "../../assets/certificate/certificate-monitoria.png";
import imgCertificateOrganizadora from "../../assets/certificate/certificate-organizadora.png";

const Certificate = () => {
  return (
    <div>
      <img src={imgCertificate} alt="Imagem do certificado." />;
      <img
        src={imgCertificateCientifica}
        alt="Imagem do certificado comissão cientifica."
      />
      ;
      <img
        src={imgCertificateMonitoria}
        alt="Imagem do certificado monitoria."
      />
      ;
      <img
        src={imgCertificateOrganizadora}
        alt="Imagem do certificado comissão organizadora."
      />
      ;
    </div>
  );
};

export default Certificate;
