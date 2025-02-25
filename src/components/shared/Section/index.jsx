import styles from "./section.module.css";

const Section = ({ children }) => {
  return <section className={styles.container}>{children}</section>;
};

export default Section;
