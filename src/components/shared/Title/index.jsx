import styles from "./title.module.css";

const Title = ({ text, align, link, color }) => {
  return (
    <div data-aos="zoom-in" data-align={align} className={styles.container}>
      <h2 data-color={color}>{text}</h2>
      {link && <a href={link.link}>{link.text}</a>}
    </div>
  );
};

export default Title;
