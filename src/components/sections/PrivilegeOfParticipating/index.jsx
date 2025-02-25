import styles from "./privilegeOfParticipating.module.css";
import { PiBridge } from "react-icons/pi";
import { BiWorld, BiNetworkChart } from "react-icons/bi";
import { LuNetwork } from "react-icons/lu";
import Title from "../../shared/Title";
import Section from "../../shared/Section";

const PrivilegeOfParticipating = () => {
  return (
    <Section>
      <Title text="Privilégios em participar" align="center" />
      <div className={styles.boxes}>
        <article data-aos="zoom-in">
          <PiBridge />
          <h3>Palestrantes renomados na área.</h3>
        </article>
        <article data-aos="zoom-in">
          <BiWorld />
          <h3>Especialistas Internacionais.</h3>
        </article>
        <article data-aos="zoom-in">
          <BiNetworkChart />
          <h3>Oportunidade de networking com especialistas.</h3>
        </article>
        <article data-aos="zoom-in">
          <LuNetwork />
          <h3>Extrutura de alto nível e ambiente acolhedor.</h3>
        </article>
      </div>
    </Section>
  );
};

export default PrivilegeOfParticipating;
