import styles from "./testimonials.module.css";
// import Section from "../../shared/Section";
import Title from "../../shared/Title";

import { FaStar } from "react-icons/fa";
import { BiSolidQuoteRight } from "react-icons/bi";
import { IoTicketOutline } from "react-icons/io5";

import carolinaAlcantara from "../../../assets/reviews/carolina-alcantara.jpeg";
import anaPaula from "../../../assets/reviews/ana-paula-galvao.jpeg";
import ginaCarneiro from "../../../assets/reviews/gina-carneiro.jpeg";
import ButtonSecondary from "../../shared/ButtonSecondary";

const Testimonials = () => {
  return (
    <section className={styles.container}>
      <Title
        align="center"
        text="Depoimentos: O que dizem os participantes anteriores:"
        color={"white"}
      />

      <div className={styles.reviews}>
        <div className={styles.review} data-aos="zoom-in">
          <div className={styles.content}>
            <div className={styles.quote}>
              <BiSolidQuoteRight />
            </div>
            <div>
              <div className={styles.stars}>
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
              </div>
              <p>
                "Minha experiência no congresso foi fantástica! Tive a
                oportunidade de ver e ouvir de perto grandes referências da área
                do autismo discutirem sobre a temática de forma aprofundada e
                única. O mais legal, a meu ver, foi ter tido a visão de vários
                seguimentos de atendimento sobre como cada área agrega na
                evolução da pessoa com TEA. Durante o evento tive muitos
                insights que foram importantes para o avanço de alguns dos meus
                pacientes. Sai do evento muito inspirada e mais encantada com
                tudo o que envolve o Autismo.”
              </p>
            </div>
            <div className={styles.user}>
              <img src={anaPaula} alt="Participante Ana Paula Galvão" />
              <div>
                <h3>Ana Paula Galvão</h3>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.review} data-aos="zoom-in">
          <div className={styles.content}>
            <div className={styles.quote}>
              <BiSolidQuoteRight />
            </div>
            <div>
              <div className={styles.stars}>
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
              </div>
              <p>
                “É maravilhoso ver iniciativas que buscam qualificar as práticas
                voltadas para crianças com TEA. A primeira edição do Congresso
                Autismo Salud Mais trouxe uma mensagem muito evidente de que
                temos uma urgência e demanda local para o processo de formação
                qualificada da rede de profissionais. Apoiar e enaltecer essas
                iniciativas me parece essencial. Que possamos crescer na busca
                por uma oferta de serviços qualificados, no direcionamento para
                políticas públicas necessárias e num movimento de inclusão real
                de crianças e famílias atípicas."
              </p>
            </div>
            <div className={styles.user}>
              <img
                src={carolinaAlcantara}
                alt="Participante Carolina Alcantara"
              />
              <div>
                <h3>Carolina Alcantara</h3>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.review} data-aos="zoom-in">
          <div className={styles.content}>
            <div className={styles.quote}>
              <BiSolidQuoteRight />
            </div>
            <div>
              <div className={styles.stars}>
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
              </div>
              <p>
                "Dois dias que valem mais que 1000! Com profissionais
                comprometidos a melhorar sua entrega, famílias buscando
                conhecimento e autistas validando as informações! Que Deus
                abençoe vocês @saludcuidarmais pela sensibilidade em
                compartilhar conosco tamanha benção! Desejo muito sucesso para
                todos nós que escolhemos ser ponte de transformação.”
              </p>
            </div>
            <div className={styles.user}>
              <img src={ginaCarneiro} alt="Participante Gina Carneiro" />
              <div>
                <h3>Gina Carneiro</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.button}>
        <ButtonSecondary action={"link"} link={"#tickets"}>
          COMPRAR INGRESSO <IoTicketOutline />
        </ButtonSecondary>
      </div>
    </section>
  );
};

export default Testimonials;
