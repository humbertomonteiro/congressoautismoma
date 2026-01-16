import styles from "./Speakers.module.css";

import Section from "../../shared/Section";
import Title from "../../shared/Title";

import tiagoCastroVideo from "../../../assets/videos/abertura-evento-tiago-castro.mp4";
import thiagoCastroImg from "../../../assets/speakers/dr-thiago-castro.jpeg";
import imgTShirt from "../../../assets/shared/tshirt.png";

export default function Speakers() {
  return (
    <Section>
      <Title text="Mais de 12 Palestrantes" align="center" />
      <div className={styles.container}>
        <div className={styles.video}>
          <video src={tiagoCastroVideo} controls="true" autoplay="true">
            {" "}
          </video>
        </div>
        <div className={styles.content}>
          <div className={styles.text}>
            <h3>Vem aí quarta edição do Congresso Autismo MA</h3>
            <p>
              O que vivemos nas edições anteriores foi muito mais do que um
              congresso. Foi encontro, aprendizado e transformação.
            </p>
            <p>
              Cada edição foi um grande sucesso porque nasceu de um compromisso
              real: com as famílias, com a escola, com os profissionais e com a
              sociedade.
            </p>
            <p>
              Agora, seguimos firmes, honrando essa história e preparando um
              evento ainda maior, mais profundo, cheio de conhecimento e muito
              amor. Preparem - se para viver o extraordinário no IV Congresso de
              Autismo.
            </p>

            <img
              src={imgTShirt}
              alt="Promoção de comprar ganha camisa exclusiva."
            />
          </div>

          <div className={styles.img}>
            <h3>Pela primeira vez no Maranhão: Dr. Thiago Castro</h3>
            <img src={thiagoCastroImg} alt="Dr. Thiago Castro" />
          </div>
        </div>
      </div>
    </Section>
  );
}
