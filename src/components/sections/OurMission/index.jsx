import styles from "./ourMission.module.css";
import Section from "../../shared/Section";
import ButtonSecondary from "../../shared/ButtonSecondary";
import { FaArrowDown } from "react-icons/fa";

import img1 from "../../../assets/events/foto-1.jpeg";
import img2 from "../../../assets/events/foto-2.jpeg";
import img3 from "../../../assets/events/event-1.jpg";
import img4 from "../../../assets/events/event-2.jpg";
import img5 from "../../../assets/events/event-3.jpg";
import img6 from "../../../assets/events/event-4.jpg";
import img7 from "../../../assets/events/event-5.jpg";

import bgBottom from "../../../assets/bg/bg-bootm1.jpg";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css/effect-flip";
import { EffectFlip, Pagination, Navigation, Autoplay } from "swiper/modules";

const OurMission = () => {
  return (
    <Section>
      <div data-aos="zoom-in" className={styles.container}>
        <div className={styles.content}>
          <h2>Nossa missão</h2>
          <p>
            Nossa missão é transformar vidas por meio da inclusão, conhecimento
            e inovação. Acreditamos no poder de conectar pessoas, promover o
            aprendizado e criar soluções que gerem impacto positivo na
            sociedade. Buscamos oferecer excelência em tudo o que fazemos,
            sempre com empatia e respeito às necessidades de cada indivíduo.
          </p>

          <ButtonSecondary action="link" link="#tickets">
            COMPRAR INGRESSO <FaArrowDown />
          </ButtonSecondary>
        </div>
        <div className={styles.img}>
          <Swiper
            effect={"flip"}
            grabCursor={true}
            pagination={true}
            navigation={true}
            autoplay={true}
            modules={[EffectFlip, Pagination, Navigation, Autoplay]}
            className="mySwiper"
          >
            <SwiperSlide>
              <img src={img1} alt="Imagem do evento" />
            </SwiperSlide>
            <SwiperSlide>
              <img src={img2} alt="Imagem do evento" />
            </SwiperSlide>
            <SwiperSlide>
              <img src={img3} alt="Imagem do evento" />
            </SwiperSlide>
            <SwiperSlide>
              <img src={img4} alt="Imagem do evento" />
            </SwiperSlide>
            <SwiperSlide>
              <img src={img5} alt="Imagem do evento" />
            </SwiperSlide>
            <SwiperSlide>
              <img src={img6} alt="Imagem do evento" />
            </SwiperSlide>
            <SwiperSlide>
              <img src={img7} alt="Imagem do evento" />
            </SwiperSlide>
          </Swiper>
        </div>
        <img className={styles.bgBottom} src={bgBottom} alt="bg bottom" />
      </div>
    </Section>
  );
};

export default OurMission;
