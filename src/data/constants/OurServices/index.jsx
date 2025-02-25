import styles from "./ourServices.module.css";

const Item1 = () => {
  return (
    <div className={styles.box}>
      <div className={styles.content}>
        <h3>Escola de Lutas</h3>
        <p>
          Oferecemos aulas práticas para crianças, jovens e adultos, com foco em
          técnicas de artes marciais que promovem o bem-estar físico e mental.
        </p>
      </div>
      <img
        src="https://img.freepik.com/fotos-gratis/criancas-de-tiro-medio-praticando-boxe_23-2150930351.jpg?t=st=1736100210~exp=1736103810~hmac=a923a02daa029e2ee2a9babcfe9a23a4b1040be4839a30e7f230505abc4e8883&w=740"
        alt="Crianças aprendendo a lutar"
      />
    </div>
  );
};

const Item2 = () => {
  return (
    <div className={styles.box}>
      <div className={styles.content}>
        <h3>Cursos</h3>
        <p>
          Invista no seu desenvolvimento com nossos cursos especialmente
          planejados para transformar conhecimento em prática.
        </p>
      </div>
      {/* <div className={styles.img}> */}
      <img
        src="https://img.freepik.com/fotos-gratis/garoto-de-frente-segurando-um-livro-aberto_23-2148694789.jpg?t=st=1736100443~exp=1736104043~hmac=91d9da408d9f2d5196aafe9af8007c7ac4bb431f94bdfe7a43702d93e26fe487&w=740"
        alt="Crianças estudando"
      />
      {/* </div> */}
    </div>
  );
};

const Item3 = () => {
  return (
    <div className={styles.box}>
      <div className={styles.content}>
        <h3>Musicalização infantil</h3>
        <p>
          Nossas atividades são cuidadosamente planejadas para estimular
          habilidades cognitivas, sociais e emocionais, promovendo aprendizado e
          interação de forma lúdica e envolvente.
        </p>
      </div>
      {/* <div className={styles.img}> */}
      <img
        src="https://img.freepik.com/fotos-gratis/criancas-brincando-em-espacos-calmos-e-aconchegantes_23-2149622600.jpg?ga=GA1.1.2095538369.1681160396&semt=ais_hybrid"
        alt="Crianças Escutando música"
      />
      {/* </div> */}
    </div>
  );
};

export const itemsOurSevices = [
  { id: 3, content: Item3() },
  { id: 1, content: Item1() },
  { id: 2, content: Item2() },
];
