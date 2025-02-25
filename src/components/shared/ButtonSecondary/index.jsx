import styles from "./buttonSecondary.module.css";

const ButtonSecondary = ({ action, children, link, styleButton, ...args }) => {
  return (
    <>
      {action === "link" ? (
        <a
          data-style-button={styleButton}
          className={styles.button}
          href={link}
          {...args}
        >
          {children}
        </a>
      ) : (
        <button
          data-style-button={styleButton}
          className={styles.button}
          {...args}
        >
          {children}
        </button>
      )}
    </>
  );
};

export default ButtonSecondary;
