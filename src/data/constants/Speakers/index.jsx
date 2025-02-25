import styles from "./speakers.module.css";

import jessicaAmorim from "../../../assets/speakers/jessica-amorim.jpeg";
import camilaLeon from "../../../assets/speakers/camila-leon.jpeg";
import kaduLins from "../../../assets/speakers/kadu-lins.png";
import mateusBrasileiro from "../../../assets/speakers/mateus-brasileiro.jpg";
import walberCastro from "../../../assets/speakers/walber-castro.jpeg";
import damiaoSilva from "../../../assets/speakers/damiao-silva.jpeg";
import nicksonSoeiro from "../../../assets/speakers/nickson-soeiro.jpeg";
import vivianPacifico from "../../../assets/speakers/vivian-pacifico.png";

const speakersImages = [
  {
    url: "https://carta.anthropogeny.org/sites/default/files/styles/scale_width_200/public/pictures/picture-507-1634249380.jpg?itok=fs5AjsAP",
    name: "Dr Allyson R. Moutri",
    experience:
      "professor dos Departamentos de Pediatria e Medicina Celular e Molecular da Universidade da Califórnia, em San Diego.",
  },
  {
    url: "https://ugc.production.linktr.ee/oCud0OvSXC7xBO3Q6L8Q_5fUGXwdtFka0OSg2?io=true&size=avatar-v3_0",
    name: "Dra. Ana Brito",
    experience:
      "Pós-doutora em Neurobiologia - USP, Doutora em Neurociências - USP, Escritora e Palestrante",
  },
  {
    url: "https://www.fcneurology.net/wp-content/uploads/2022/06/dr-carlos-gadia-md.jpg",
    name: "Dr. Carlos Gadia",
    experience:
      "Neurologia Pediátrica pela University of Miami School of Medicine, humanitário comprometido ativamente e pioneiro em terapias.",
  },
  {
    url: "https://media.licdn.com/dms/image/v2/C5603AQELCUJ0eji87g/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1516930082943?e=1743033600&v=beta&t=wsEP29z1Yg2NJ0c2w5CNvqoPSChzb1elf5j1Gm6AW_I",
    name: "Graziella Gadia",
    experience:
      "Talento e Pedagogia: Uma fusão inspiradora de habilidades artísticas e ensino. Uma dedicação tangível ao progresso terapêutico no espectro autista.",
  },
  {
    url: jessicaAmorim,
    name: "Coralina Matos",
    experience:
      "Especialista em Desenvolvimento infantil, Análise de Comportamento Aplicada, Intervenção Precoce no Autismo, 15 anos de atuação clínica como Terapeuta Ocupacional.",
  },
  {
    url: "https://www.revistacircuito.com/wp-content/uploads/2019/09/14979812132980-696x545.jpg",
    name: "Nicolas Brito Sales",
    experience:
      "Fotógrafo, escritor, artista plástico, atendente terapêutico e tenho autismo.",
  },
  {
    url: "https://olzeniribeiro.com.br/wp-content/uploads/2024/06/olzenir-ribeiro.png",
    name: "Dra. Olzeni Ribeiro",
    experience:
      "Phd em Educação, Neuropsicopedagoga Clínica | Neurodivergente, Especialista em Avaliação AHSD e 2E",
  },
  {
    url: "https://ugc.production.linktr.ee/20dbbceb-7e14-46ef-addd-2228a0e51f10_IMG-1315.jpeg?io=true&size=avatar-v3_0",
    name: "Dra. Patrícia Junqueira",
    experience: "Fonoaudióloga e Doutora em Distúrbios da Comunicação Humana.",
  },
  {
    url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUF5k2AkEWI79cAz11e1q0-LaichfdcnOKwg&s",
    name: "Dr. Thiago Gusmão",
    experience:
      "Neurologista Exemplar: Formado com especialização pela UFF, Dr. Thiago é um especialista comprometido com a neurologia de crianças e adolescentes.",
  },
  {
    url: kaduLins,
    name: "Kadu Lins",
    experience:
      "Formado em Educação Física, Psicomotricista e especialista em Análise do Comportamento Aplicada (ABA). Mestrando em educação física com estudos em desenvolvimento motor infantil. Formações acadêmicas internacionais nos Estados Unidos e na Austrália.",
  },
  {
    url: mateusBrasileiro,
    name: "Mateus Brasileiro",
    experience:
      "Mestre e doutor em Psicologia Experimental: Análise de Comportamento (PUC - SP), Umas das grandes referências em ABA do Brasil na atualidade.  ",
  },
  {
    url: camilaLeon,
    name: "Camila León",
    experience:
      "Pedagoga, Licenciada em Letras, Psicopedagoga, Mestre e Doutora em Distúrbio do Desenvolvimento.",
  },
  {
    url: vivianPacifico,
    name: "Vivian Pacífico",
    experience:
      "Psicopedagoga Clínica e Institucional, formada pela Faculdade Fama, com especialização em Gestão de Pessoas pela Universidade Ceuma. Ela também é especialista em Intervenção ABA para Autismo e Deficiência Intelectual, certificada pela CBI of Miami, além de atuar como Educadora Parental e Psicanalista.",
  },
  {
    url: walberCastro,
    type: "music",
    name: "Walber Castro Lobato",
    experience:
      "Musicoterapeuta. Licenciado em música(UFMA), Pós graduado em Musicoterapia, Pós graduado em Neurociência e Comportamento.",
  },
  {
    url: damiaoSilva,
    type: "music",
    name: "Damião Silva Santos Júnior",
    experience:
      "Musicoterapeuta clínico, especialista em Saúde mental e Autismo, e professor de música com vasta experiência.",
  },
  {
    url: nicksonSoeiro,
    type: "music",
    name: "Nickson Soeiro",
    experience:
      "Graduado em Educação Musical pela UEMA e Pós graduado em Musicoterapia pela CENSUPEG, é mestrando em Estudos Comparados.",
  },
];

import imgBottom from "../../../assets/bg/bg-bootm1.jpg";
import imgTop from "../../../assets/bg/bg-top1.jpg";

export const itemsSpeakers = speakersImages.map((item, index) => ({
  id: index + 1,
  type: item.type,
  content: (
    <div className={styles.card}>
      <div className={styles.imgTop}>
        <img src={imgTop} alt="logo colorida" />
      </div>
      <img
        key={index}
        className={styles.img}
        src={item.url}
        alt={`Palestrante ${index + 1}`}
      />
      <div className={styles.content}>
        <h3>{item.name}</h3>
        <p>{item.experience}</p>
      </div>
      <div className={styles.imgBottom}>
        <img src={imgBottom} alt="logo colorida" />
      </div>
    </div>
  ),
}));
