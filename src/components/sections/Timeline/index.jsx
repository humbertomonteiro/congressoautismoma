import Section from "../../shared/Section";
import Title from "../../shared/Title";

import imgTimeline from "../../../assets/timeline/image.png";

import styles from "./timeline.module.css";

const Timeline = () => {
  return (
    <Section>
      <Title align="center" text="Cronograma" />
      <div id="cronograma" className={styles.container}>
        <img src={imgTimeline} alt="Cronograma do evento" />
      </div>
    </Section>
  );
};

export default Timeline;
