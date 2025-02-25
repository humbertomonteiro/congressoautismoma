import styles from "./boxesSupport.module.css";

const Item1 = () => {
  return (
    <div className={styles.box}>
      <h3 style={{ background: "#ffd26a" }}>Ouro</h3>
      <ul style={{ background: "#ffd26a" }}>
        <li>Stand;</li>
        <li>Logo no outdoor;</li>
        <li>Postagens dedicadas nas mídias sociais do evento;</li>
        <li>Logo em destaque nos materiais de divulgação;</li>
        <li>
          Inserção de brindes ou materiais promocionais da empresa no kit do
          participante;
        </li>
        <li>
          Agradecimentos especiais durante a abertura e encerramento do evento;
        </li>
        <li>
          Direito à exibição do filme institucional e/ou puclicitário, de até 30
          segundos, no intervalo;
        </li>
        <li>Logo no vídeo institucional;</li>
        <li>
          Exibição da marca no ebook de patrocínio da próxima edição do
          congresso;
        </li>
        <li>01 entrevista no podcast Neuropod.</li>
      </ul>
      {/* <strong>R$ 15.000,00</strong> */}
    </div>
  );
};
const Item2 = () => {
  return (
    <div className={styles.box}>
      <h3 style={{ background: "#00ba9f", color: "#fff" }}>Prata</h3>
      <ul style={{ background: "#00ba9f", color: "#fff" }}>
        <li>Stand;</li>
        <li>Postagens dedicadas nas mídias sociais do evento;</li>
        <li>Logo em destaque nos materiais de divulgação;</li>

        <li>
          Agradecimentos especiais durante a abertura e encerramento do evento;
        </li>
        <li>
          direito à exibição do filme institucional e/ou puclicitário, de até 30
          segundos, no intervalo;
        </li>
        <li>Logo no vídeo institucional;</li>
        <li>
          Exibição da marca no ebook de patrocínio da próxima edição do
          congresso.
        </li>
      </ul>
      {/* <strong>R$ 10.000,00</strong> */}
    </div>
  );
};
const Item3 = () => {
  return (
    <div className={styles.box}>
      <h3 style={{ background: "#e26891", color: "#fff" }}>Bronze</h3>
      <ul style={{ background: "#e26891", color: "#fff" }}>
        <li>Postagens dedicadas nas mídias sociais do evento;</li>

        <li>Logo no vídeo institucional.</li>
      </ul>
      {/* <strong>R$ 5.000,00</strong> */}
    </div>
  );
};

export const itemsBoxesSupport = [
  {
    id: 1,
    content: Item1(),
  },
  {
    id: 2,
    content: Item2(),
  },
  {
    id: 3,
    content: Item3(),
  },
];
