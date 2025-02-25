import styles from "./sponsors.module.css";

const item1 = () => {
  return (
    <img
      id="support"
      className={styles.img}
      src="https://i.pinimg.com/736x/1c/2a/fd/1c2afd5df5bc136bfbae9ce51386cd5f.jpg"
      alt="logo"
    />
  );
};
const item2 = () => {
  return (
    <img
      className={styles.img}
      src="https://i.pinimg.com/736x/ec/20/7b/ec207ba6819c6ecac4dcfe3404a376ee.jpg"
      alt="logo"
    />
  );
};
const item3 = () => {
  return (
    <img
      className={styles.img}
      src="https://i.pinimg.com/736x/49/5f/20/495f20134292014c3014b11b0ffeea50.jpg"
      alt="logo"
    />
  );
};
const item4 = () => {
  return (
    <img
      className={styles.img}
      src="https://i.pinimg.com/736x/32/f3/c4/32f3c455ca6d751be2ef6ef19e108717.jpg"
      alt="logo"
    />
  );
};
const item5 = () => {
  return (
    <img
      className={styles.img}
      src="https://i.pinimg.com/736x/f8/f5/43/f8f5436463614b1d7d06d6e98927dab3.jpg"
      alt="logo"
    />
  );
};

export const ItemsSponsors = [
  {
    id: 1,
    content: item1(),
  },
  {
    id: 2,
    content: item2(),
  },
  {
    id: 3,
    content: item3(),
  },
  {
    id: 4,
    content: item4(),
  },
  {
    id: 5,
    content: item5(),
  },
];
