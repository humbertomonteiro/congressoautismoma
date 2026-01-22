import styles from "./Speakers.module.css";

import Section from "../../shared/Section";
import Title from "../../shared/Title";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

import tiagoCastroVideo from "../../../assets/videos/abertura-evento-tiago-castro.mp4";
import thiagoCastroImg from "../../../assets/speakers/dr-thiago-castro.jpeg";
// exemplo de novo palestrante
import outroPalestranteImg from "../../../assets/speakers/debora-sauressig.jpeg";

import imgTShirt from "../../../assets/shared/tshirt.png";

const speakers = [
  {
    name: "Dr. Thiago Castro",
    description: "Pela primeira vez no Maranhão",
    image: thiagoCastroImg,
  },
  {
    name: "Débora Saueressig",
    description: "Especialista convidado",
    image: outroPalestranteImg,
  },
];

export default function Speakers() {
  return (
    <Section>
      <Title text="Mais de 12 Palestrantes" align="center" />

      <div className={styles.container}>
        {/* Vídeo */}
        <div className={styles.video}>
          <video src={tiagoCastroVideo} controls autoPlay />
        </div>

        <div className={styles.content}>
          {/* Texto */}
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
              amor. Preparem-se para viver o extraordinário no IV Congresso de
              Autismo.
            </p>

            <img
              src={imgTShirt}
              alt="Promoção de comprar ganha camisa exclusiva."
            />
          </div>

          {/* Slider de palestrantes */}
          <div className={styles.speakers}>
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={20}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              autoplay
              className={styles.swiper}
            >
              {speakers.map((speaker, index) => (
                <SwiperSlide key={index}>
                  <div className={styles.speakerCard}>
                    <h3>
                      {speaker.description}: {speaker.name}
                    </h3>
                    <img src={speaker.image} alt={speaker.name} />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </Section>
  );
}
