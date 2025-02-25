import Title from "../../shared/Title";
import styles from "./beSupport.module.css";
import { itemsBoxesSupport } from "../../../data/constants/BoxesSupport";

import { TbArrowBigRightLine } from "react-icons/tb";

const BeSupport = () => {
  return (
    <section className={styles.containerSupport}>
      <Title text="Seja um Patrocinador" align="center" />
      <div data-aos="zoom-in" className={styles.container}>
        <div className={styles.content} data-aos="zoom-in">
          <div className={styles.contentTitle}>
            <h3>
              EXPOSIÇÃO
              <br /> <span>DE MÍDIA NO EVENTO</span>
            </h3>
          </div>
          <ul>
            <li>
              <TbArrowBigRightLine />
              +DE 2.000 PESSOAS
            </li>
            <li>
              <TbArrowBigRightLine />
              +DE 30H EM CONTEÚDOS
            </li>
            <li>
              <TbArrowBigRightLine />
              +DE R$ 30.000 EM MÍDIAS
            </li>
          </ul>
        </div>
        <div className={styles.boxes}>
          <div className={styles.boxesItems}>
            {itemsBoxesSupport.map((boxSupport, index) => (
              <div key={index} data-aos="zoom-in">
                {boxSupport.content}
              </div>
            ))}
          </div>

          <div className={styles.info}>
            <p>
              Para informações sobre valores fale com nossa equipe : (98)
              99113-1020 /(98) 98164-4714 .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BeSupport;
