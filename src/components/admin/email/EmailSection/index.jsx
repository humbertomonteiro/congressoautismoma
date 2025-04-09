import styles from "./emailSection.module.css";
import EmailSectionContainer from "../EmailSectionContainer";

const EmailSection = () => {
  return (
    <div
      className={styles.container}
      style={{
        backgroundColor: "#F5F7FA",
        padding: "20px",
        borderRadius: "12px",
      }}
    >
      <EmailSectionContainer />
    </div>
  );
};

export default EmailSection;
