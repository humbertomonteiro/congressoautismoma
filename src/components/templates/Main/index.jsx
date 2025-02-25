import styles from "./main.module.css";

const Main = ({ children }) => {
  return <main className={styles.container}>{children}</main>;
};

export default Main;
