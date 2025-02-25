import styles from "./tickets.module.css";

import Section from "../../shared/Section";
import Title from "../../shared/Title";
import ButtonSecondary from "../../shared/ButtonSecondary";
import FormGetData from "../../shared/FormGetData";

import { IoTicketOutline } from "react-icons/io5";

import { useState } from "react";
import CountdownTimer from "../../shared/CountdownTimer";

const Item1 = ({ setFormGetData, setLink, setGroup }) => {
  const handleBuyTicket = (link) => {
    setFormGetData(true);
    setLink(link);
  };
  return (
    <div className={styles.box} data-active="true">
      <strong className={styles.sale}>40% OFF</strong>
      <div className={styles.boxContent}>
        <span>Ingresso</span>
        <h4>Pré-venda - Ingresso INDIVIDUAL</h4>
        <h5>Disponível até:</h5>
        <p>15/03 ou enquanto durar</p>
      </div>
      <div className={styles.boxValue}>
        <h4>
          <span>de:</span>{" "}
          <s>
            R$ 839,90 <br />
          </s>{" "}
          <span>por:</span> <strong>10X de </strong>R$ 49,90
        </h4>
        <ul>
          <li>Garanta o seu ingresso com o menor valor!</li>
          <li>Economize mais 40% no valor do ingresso!</li>
          <li>
            Garanta sua vaga em um evento único com grandes referências da
            Neurodiversidade.
          </li>
          <li>
            Participe do networking com profissionais e familiares engajados no
            tema.
          </li>
        </ul>
        <div className={styles.buttons}>
          <div className={styles.button}>
            <ButtonSecondary
              style={{ width: "100%" }}
              action="button"
              onClick={() => {
                setGroup(false);
                handleBuyTicket("https://cielolink.com.br/3EhFl7C");
              }}
            >
              COMPRAR INGRESSO{" "}
              <IoTicketOutline style={{ fontSize: "1.2rem" }} />
            </ButtonSecondary>
          </div>
        </div>
      </div>
    </div>
  );
};

const Item2 = ({ setFormGetData, setLink, setGroup }) => {
  const handleBuyTicket = (link) => {
    setFormGetData(true);
    setLink(link);
  };
  return (
    <div className={styles.box} data-active="true">
      <strong className={styles.sale}>40% OFF</strong>
      <div className={styles.boxContent}>
        <span>Ingresso</span>
        <h4>Pré-venda - Ingresso GRUPO</h4>
        <h5>Disponível até:</h5>
        <p>15/03 ou enquanto durar</p>
        <p>Compre no mínimo 5 ingressos para ter desconto.</p>
      </div>
      <div className={styles.boxValue}>
        <h4>
          <span>de:</span>{" "}
          <s>
            R$ 839,90 <br />
          </s>{" "}
          <span>por:</span> <strong>10X de </strong>R$ 44,90
          <span>/ por unidade</span>
        </h4>
        <ul>
          <li>Garanta o seu ingresso com o menor valor!</li>
          <li>Economize mais 40% no valor do ingresso!</li>
          <li>
            Garanta sua vaga em um evento único com grandes referências da
            Neurodiversidade.
          </li>
          <li>
            Participe do networking com profissionais e familiares engajados no
            tema.
          </li>
        </ul>
        <div className={styles.buttons}>
          <div className={styles.button}>
            <span>
              Clique no botão abaixo e fale com nosso suporte para comprar o
              ingresso Grupo.
            </span>

            <ButtonSecondary
              style={{ width: "100%" }}
              action="link"
              target="_blank"
              link="https://wa.me/5598988259214?text=Quero%20saber%20como%20comprar%20o%20ingresso%20grupo%3F"
            >
              COMPRAR INGRESSO{" "}
              <IoTicketOutline style={{ fontSize: "1.2rem" }} />
            </ButtonSecondary>
          </div>
        </div>
      </div>
    </div>
  );
};

const ItemHalf = ({ setFormGetData, setLink, setGroup }) => {
  const handleBuyTicket = (link) => {
    setFormGetData(true);
    setLink(link);
  };
  return (
    <div className={styles.box} data-active="true">
      <strong className={styles.sale}>40% OFF</strong>
      <div className={styles.boxContent}>
        <span>Ingresso</span>
        <h4>Pré-venda - Ingresso MEIA-ENTRADA</h4>
        <h5>Disponível até:</h5>
        <p>15/03 ou enquanto durar</p>
        <p>
          Lembre-se: os documentos comprobatórios devem ser apresentados na
          entrada do evento.
        </p>
      </div>
      <div className={styles.boxValue}>
        <h4>
          <span>de:</span>{" "}
          <s>
            R$ 839,90 <br />
          </s>{" "}
          <span>por:</span> <strong>10X de </strong>R$ 39,90
          <span>/ por unidade</span>
        </h4>
        <h3>Veja se você se encaixa na meia entrada:</h3>
        <ul>
          <li>
            Pessoas com Deficiência (PcD), incluindo autistas: Apresentar
            documento comprovativo da condição.
          </li>

          <li>Idosos (60 anos ou mais): Documento de identidade com foto.</li>

          <li>
            Estudantes (de qualquer curso): Carteira de Identificação Estudantil
            (CIE), Comprovante de Matrícula ou Mensalidade.
          </li>

          <li>
            Professores de redes públicas e privadas: Comprovante de vínculo com
            instituição de ensino.
          </li>

          <li>
            Pais de autistas: Documento que comprove a condição de responsável
            legal.
          </li>
        </ul>
        <div className={styles.buttons}>
          <div className={styles.button}>
            <span>
              A meia entrada é um direito que promove a inclusão e o acesso, e
              sua colaboração na apresentação dos documentos é necessário.
            </span>
            <ButtonSecondary
              style={{ width: "100%" }}
              action="button"
              onClick={() => {
                setGroup(false);
                handleBuyTicket("https://cielolink.com.br/40yi0G0");
              }}
            >
              COMPRAR INGRESSO{" "}
              <IoTicketOutline style={{ fontSize: "1.2rem" }} />
            </ButtonSecondary>
          </div>
        </div>
      </div>
    </div>
  );
};

const Item3 = () => {
  return (
    <div className={styles.box}>
      <strong className={styles.sale}>30% OFF</strong>
      <div className={styles.boxContent}>
        <span>Ingresso</span>
        <h4>Lote 1</h4>
        <h5>Disponível até:</h5>
        <p>01/04 ou enquanto durar</p>
      </div>

      <div className={styles.boxValue}>
        <h4>
          <span>de:</span>{" "}
          <s>
            R$ 839,90 <br />
          </s>{" "}
          <span>por:</span> <strong>10X de </strong>R$ 58,90
        </h4>
        <ul>
          <li>Economize até 30% no valor do ingresso!</li>
          <li>Garanta sua vaga em um evento único com especialistas em TEA.</li>
          <li>
            Participe do networking com profissionais e familiares engajados no
            tema.
          </li>
        </ul>
      </div>
    </div>
  );
};

const Item4 = () => {
  return (
    <div className={styles.box}>
      <strong className={styles.sale}>20% OFF</strong>
      <div className={styles.boxContent}>
        <span>Ingresso</span>
        <h4>Lote 2</h4>
        <h5>Disponível até:</h5>
        <p>15/05 ou enquanto durar</p>
      </div>
      <div className={styles.boxValue}>
        <h4>
          <span>de:</span>{" "}
          <s>
            R$ 839,90 <br />
          </s>{" "}
          <span>por:</span> <strong>10X de </strong>R$ 67,90
        </h4>
        <ul>
          <li>Economize até 20% no valor do ingresso!</li>
          <li>Garanta sua vaga em um evento único com especialistas em TEA.</li>
          <li>
            Participe do networking com profissionais e familiares engajados no
            tema.
          </li>
        </ul>
      </div>
    </div>
  );
};

const Tickets = () => {
  const [formGetData, setFormGetData] = useState(false);
  const [group, setGroup] = useState(false);
  const [link, setLink] = useState("");

  return (
    <Section>
      <Title text="Ingressos " align="center" />
      <div id="tickets" data-aos="zoom-in" className={styles.container}>
        <div className={styles.content}>
          <h3>Ingressos Limitados – Garanta já sua participação!</h3>
          <p>
            Não perca o maior congresso sobre TEA do ano! Os ingressos estão
            divididos em lotes, com preços promocionais para quem comprar
            antecipado.
          </p>
          <strong>⚡ Confira os valores e garanta o melhor preço:</strong>
          <CountdownTimer targetDate="2025-03-15T23:59:59" />
        </div>
        <div className={styles.boxes}>
          <Item1
            setFormGetData={setFormGetData}
            setLink={setLink}
            setGroup={setGroup}
          />
          <Item2
          // setFormGetData={setFormGetData}
          // setLink={setLink}
          // setGroup={setGroup}
          />
          <ItemHalf />
          {/* <Item4 /> */}
        </div>
        {formGetData && (
          <FormGetData
            setFormGetData={setFormGetData}
            link={link}
            group={group}
          />
        )}
      </div>
    </Section>
  );
};

export default Tickets;
