import styles from "./carouselScrollInfinit.module.css";
import Section from "../Section";

export const imagesnLogos = [
  {
    img: "https://i.pinimg.com/736x/1c/2a/fd/1c2afd5df5bc136bfbae9ce51386cd5f.jpg",
  },
  {
    img: "https://i.pinimg.com/736x/ec/20/7b/ec207ba6819c6ecac4dcfe3404a376ee.jpg",
  },
  {
    img: "https://i.pinimg.com/736x/49/5f/20/495f20134292014c3014b11b0ffeea50.jpg",
  },
  {
    img: "https://i.pinimg.com/736x/32/f3/c4/32f3c455ca6d751be2ef6ef19e108717.jpg",
  },
  {
    img: "https://i.pinimg.com/736x/f8/f5/43/f8f5436463614b1d7d06d6e98927dab3.jpg",
  },
];

const CarouselScrollInfinit = () => {
  return (
    <Section>
      <div className={styles.carousel}>
        <div className={styles.group}>
          {imagesnLogos.map((item, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.noContent}>
                <h5>Sua logo aqui!</h5>
              </div>
              {/* <img
                className={styles.img}
                src={item.img}
                alt={`Imagem logo: ${index}`}
              /> */}
            </div>
          ))}
        </div>
        <div arial-hidden="true" className={styles.group}>
          {imagesnLogos.map((item, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.noContent}>
                <h5>Sua logo aqui!</h5>
              </div>
              {/* <img
                loading="lazy"
                className={styles.img}
                src={item.img}
                alt={`Imagem logo: ${index}`}
              /> */}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default CarouselScrollInfinit;
