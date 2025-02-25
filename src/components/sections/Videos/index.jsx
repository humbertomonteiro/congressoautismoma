import styles from "./videos.module.css";
import Title from "../../shared/Title";
import Section from "../../shared/Section";

const Videos = () => {
  return (
    <Section className="container-default">
      <Title text="Nossos Videos" align="center" />
      <div data-aos="zoom-in" className={styles.container}>
        {/* <div className={styles.content}>
          <h3>Nossos vídeos</h3>
          <p>Veja o conteúdo que produzimos no youtube.</p>
        </div> */}
        <div className={styles.boxes}>
          <div className={styles.box}>
            <iframe
              src="https://www.youtube.com/embed/KQKikybCeM0?si=OeyoQ1RVy3f-1Qob"
              title="YouTube video player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
            ></iframe>
            <h3>Marcos do Desenvolvimento Infantil</h3>
          </div>
          <div className={styles.box}>
            <iframe
              src="https://www.youtube.com/embed/f8Y74DaRAZM?si=SAtVVRGXTiVC1799"
              title="YouTube video player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
            ></iframe>
            <h3>Habilidades sociais</h3>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Videos;
