import styles from "./local.module.css";

import Title from "../../shared/Title";
import Section from "../../shared/Section";

import multicenter from "../../../assets/videos/multiCenter.mp4";
import ButtonSecondary from "../../shared/ButtonSecondary";

import podcast from "../../../assets/bg/neuropod.jpg";

const Local = () => {
  const handleViewItem = (itemId, itemName) => {
    window.dataLayer.push({
      event: "view_item",
      item_id: itemId,
      item_name: itemName,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <Section>
      <Title text={"Local confirmado"} align="center" />
      <div className={styles.container} data-aos="zoom-in">
        <div className={styles.boxes}>
          <div className={styles.boxVideo}>
            <video controls={true} src={multicenter}></video>
          </div>

          <div className={styles.boxLocal}>
            <div className={styles.list}>
              <span>Dia 16/05 e 17/05 em São Luís - MA</span>
              <h3>Centro de Convenções Multicenter</h3>
              <h4>AUDITÓRIO DARCY RIBEIRO</h4>
              <ul>
                <li>Com 1 grande palco na Expo</li>
                <li>⁠Stands na área secundária</li>
                <li>⁠Opção de almoço buffet no local</li>
                <li>Comodidade para hospedagem</li>
                <li>⁠Fácil acesso</li>
                <li>⁠Estacionamento seguro e amplo</li>
                {/* <li>
                  Neuropod será gravado ao vivo com nossos patrocinadores!
                </li> */}
                {/* <li>
                  <img src={podcast} alt="Podcast Neuropod" />
                </li> */}
              </ul>
              <ButtonSecondary
                action={"link"}
                link="#tickets"
                onClick={handleViewItem}
              >
                COMPRAR INGRESSO
                {/* INGRESSOS ESGOTADOS */}
              </ButtonSecondary>
            </div>
            <div className={styles.map}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3986.010705652708!2d-44.2670215!3d-2.5033531!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7f68ddd8bc4719d%3A0xb967a0aada8a5665!2sSebrae%20Multicenter!5e0!3m2!1spt-BR!2sbr!4v1737137211419!5m2!1spt-BR!2sbr"
                allowfullscreen=""
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Local;
