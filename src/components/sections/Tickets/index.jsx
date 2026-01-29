import React, { useEffect, useState } from "react";
import styles from "./tickets.module.css";
import Section from "../../shared/Section";
import Title from "../../shared/Title";
import ButtonSecondary from "../../shared/ButtonSecondary";
// import CountdownTimer from "../../shared/CountdownTimer";
import Chatbot from "../Chatbot";
import { IoTicketOutline } from "react-icons/io5";
import { FaWhatsapp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { formatToBRL } from "../../../data/functions/formatToBRL";

import panfletoFiqueAtento from "../../../assets/shared/panfleto-fique-atento.jpeg";

const BASE_PRICE = import.meta.env.VITE_BASE_PRICE;
// const HALF_PRICE = import.meta.env.VITE_HALF_PRICE;
const SOCIAL_PRICE = import.meta.env.VITE_SOCIAL_PRICE;
const TAX_PRICE_PERCENTAGE = 10;

const handleAddToCart = (itemId, itemName, price) => {
  window.dataLayer.push({
    event: "add_to_cart",
    items: [
      {
        item_id: itemId,
        item_name: itemName,
        price: price,
        quantity: 1,
      },
    ],
    timestamp: new Date().toISOString(),
  });
};

const handleViewContent = (itemId, itemName, price) => {
  window.dataLayer.push({
    event: "view_content",
    items: [
      {
        item_id: itemId,
        item_name: itemName,
        price: price,
        quantity: 1,
      },
    ],
    timestamp: new Date().toISOString(),
  });
};

const Item1 = ({ wpp, openChatbot }) => {
  // const navigate = useNavigate();
  return (
    <div className={styles.box} data-active="true">
      <div className={styles.boxContent}>
        <span>Ingresso</span>
        <h4>INDIVIDUAL - PRÉ-VENDA</h4>
        <h5>Disponível até:</h5>
        <p>30/01 ou enquanto durar</p>
      </div>
      <div className={styles.boxValue}>
        <span>
          De <s>{formatToBRL(Number(BASE_PRICE))}</s> por:
        </span>
        <h4 className={styles.valueTicket}>
          {formatToBRL(Number(SOCIAL_PRICE))}
          {/* <span>À vista</span> */}
          <div className={styles.infoPrice}>
            Taxa da Bilheteria Digital cobrada no momento da compra.
          </div>
        </h4>
        {/* <h3>
          ou <strong>10X de {formatToBRL(Number(BASE_PRICE) / 10)}</strong>
        </h3> */}
        <ul>
          <li>Evento com Certificado de 20 horas.</li>
          <li>Garanta o seu ingresso com o menor valor!</li>
          {/* <li>Economize mais 40% no valor do ingresso!</li> */}
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
          <p>
            Informação Importante: O valor do ingresso refere-se exclusivamente
            à inscrição no evento. A taxa de serviço da Bilheteria Digital não
            está inclusa e será cobrada separadamente pela plataforma, com
            informação discriminada no momento da compra.
          </p>
          <div className={styles.button}>
            {!wpp ? (
              <ButtonSecondary
                style={{ width: "100%" }}
                action="link"
                link="https://www.bilheteriadigital.com/iv-congresso-de-autismo-16-de-maio"
                target="_blank"
                // action="button"
                // onClick={() => {
                //   navigate("/checkout");
                //   handleAddToCart("individual", "Ingresso Individual", 499.9);
                // }}
                // action="link"
                // link="https://api.whatsapp.com/send?phone=5598991058908&text=Olá!%20Gostaria%20de%20comprar%20ingresso"
                // target="_blank"
                // action="button"
                // disabled={true}
              >
                Comprar Ingresso
                {/* INGRESSOS ESGOTADOS */}
                {/* EM BREVE */}
                <IoTicketOutline style={{ fontSize: "1.2rem" }} />
              </ButtonSecondary>
            ) : (
              <ButtonSecondary
                style={{ width: "100%" }}
                action="button"
                onClick={() => {
                  openChatbot("full");
                  handleViewContent("individual", "Ingresso Individual", 499.9);
                }}
              >
                Comprar pelo Whatsapp{" "}
                <FaWhatsapp style={{ fontSize: "1.2rem" }} />
              </ButtonSecondary>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Item2 = ({ wpp, openChatbot }) => {
  // const navigate = useNavigate();
  return (
    <div className={styles.box} data-active="true">
      <div className={styles.boxContent}>
        <span>Ingresso</span>
        <h4>Ingresso GRUPO</h4>
        <h5>Disponível até:</h5>
        <p>30/01 ou enquanto durar</p>
        <p>Compre no mínimo 5 ingressos para ter desconto.</p>
      </div>
      <div className={styles.boxValue}>
        <span>
          De <s>R$ 798,00</s> por:
        </span>
        <h4>R$ 649,00</h4>
        <h3>
          ou <strong>10X de R$ 64,90</strong>
        </h3>
        <ul>
          <li>Evento com Certificado de 20 horas.</li>
          <li>Garanta o seu ingresso com o menor valor!</li>
          {/* <li>Economize mais 40% no valor do ingresso!</li> */}
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
            {/* <span>
              Clique no botão abaixo e fale com nosso suporte para comprar o
              ingresso Grupo.
            </span> */}
            {!wpp ? (
              <ButtonSecondary
                style={{ width: "100%" }}
                // action="button"
                // onClick={() => {
                //   navigate("/checkout?tickets=5&coupon=grupo");
                //   handleAddToCart("group", "Ingresso Grupo", 449.9);
                // }}
                // action="link"
                // link="https://api.whatsapp.com/send?phone=5598991058908&text=Olá!%20Gostaria%20de%20comprar%20ingresso"
                // target="_blank"
                action="button"
                disabled={true}
              >
                INGRESSOS ESGOTADOS{" "}
                <IoTicketOutline style={{ fontSize: "1.2rem" }} />
              </ButtonSecondary>
            ) : (
              <ButtonSecondary
                style={{ width: "100%" }}
                action="button"
                onClick={() => {
                  openChatbot("group");
                  handleViewContent("group", "Ingresso Grupo", 449.9);
                }}
              >
                Comprar pelo Whatsapp{" "}
                <FaWhatsapp style={{ fontSize: "1.2rem" }} />
              </ButtonSecondary>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ItemHalf = ({ wpp, openChatbot }) => {
  const navigate = useNavigate();
  return (
    <div className={styles.box} data-active="true">
      <div className={styles.boxContent}>
        <span>Ingresso</span>
        <h4>MEIA-ENTRADA - PRÉ-VENDA</h4>
        <h5>Disponível até:</h5>
        <p>30/01 ou enquanto durar</p>
        <p>
          Lembre-se: os documentos comprobatórios devem ser apresentados na
          entrada do evento.
        </p>
      </div>
      <div className={styles.boxValue}>
        {/* <span>50% de R$ 798,00:</span> */}
        <h4>R$ 144,50</h4>
        <h3>
          ou <strong>10X de R$ 14,45</strong>
        </h3>
        <h5>Veja se você se encaixa na meia entrada:</h5>
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
          <li>Evento com Certificado de 20 horas.</li>
        </ul>
        <div className={styles.buttons}>
          <div className={styles.button}>
            <span>
              A meia entrada é um direito que promove a inclusão e o acesso, e
              sua colaboração na apresentação dos documentos é necessário.
            </span>
            {!wpp ? (
              <ButtonSecondary
                style={{ width: "100%" }}
                action="button"
                onClick={() => {
                  navigate("/checkout?type=half");
                  handleAddToCart("half", "Ingresso Meia-Entrada", 399.9);
                }}
              >
                Comprar Ingresso{" "}
                <IoTicketOutline style={{ fontSize: "1.2rem" }} />
              </ButtonSecondary>
            ) : (
              <ButtonSecondary
                style={{ width: "100%" }}
                action="button"
                onClick={() => {
                  openChatbot("half");
                  handleViewContent("half", "Ingresso Meia-Entrada", 399.9);
                }}
              >
                Comprar pelo Whatsapp{" "}
                <FaWhatsapp style={{ fontSize: "1.2rem" }} />
              </ButtonSecondary>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Tickets = ({ wpp }) => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [initialTicketType, setInitialTicketType] = useState("");
  // const [targetDate, setTargetDate] = useState("");

  const openChatbot = (ticketType) => {
    setInitialTicketType(ticketType);
    setIsChatbotOpen(true);
  };

  // useEffect(() => {
  //   const calculateTargetDate = () => {
  //     const currentDate = new Date();
  //     const target = new Date(currentDate);
  //     target.setDate(currentDate.getDate() + 3); // 3 dias a partir de hoje
  //     target.setHours(23, 59, 59, 999);

  //     const year = target.getFullYear();
  //     const month = String(target.getMonth() + 1).padStart(2, "0");
  //     const day = String(target.getDate()).padStart(2, "0");

  //     return `${year}-${month}-${day}T23:59:59`;
  //   };

  //   const storedDate = localStorage.getItem("countdownTargetDate");
  //   const now = new Date().getTime();

  //   if (storedDate) {
  //     const storedTimestamp = new Date(storedDate).getTime();
  //     if (storedTimestamp > now) {
  //       // Data armazenada ainda é válida
  //       setTargetDate(storedDate);
  //       console.log("Using stored targetDate:", storedDate);
  //     } else {
  //       // Data expirou, calcular nova
  //       const newTargetDate = calculateTargetDate();
  //       localStorage.setItem("countdownTargetDate", newTargetDate);
  //       setTargetDate(newTargetDate);
  //       console.log("Stored date expired, new targetDate:", newTargetDate);
  //     }
  //   } else {
  //     // Nenhuma data armazenada, calcular nova
  //     const newTargetDate = calculateTargetDate();
  //     localStorage.setItem("countdownTargetDate", newTargetDate);
  //     setTargetDate(newTargetDate);
  //     console.log("No stored date, new targetDate:", newTargetDate);
  //   }
  // }, []);

  return (
    <Section>
      <Title text="Ingressos" align="center" />
      <div id="tickets" data-aos="zoom-in" className={styles.container}>
        <div className={styles.content}>
          <h3>Ingressos Limitados – Garanta já sua participação!</h3>
          <p>
            Não perca o maior congresso sobre TEA do ano! Os ingressos estão
            divididos em lotes, com preços promocionais para quem comprar
            antecipado.
          </p>
          {/* <strong>⚡ Confira os valores e garanta o melhor preço:</strong> */}
          {/* <CountdownTimer targetDate={"2026-05-30T23:59:59"} /> */}
          <strong className={styles.highlightText}>
            As primeiras 300 inscrições ganharão uma exclusiva camisa do
            Congresso!
          </strong>
          {/* <CountdownTimer targetDate={new Date().getTime()} /> */}
        </div>
        <div className={styles.boxes}>
          <img src={panfletoFiqueAtento} alt="Panfleto fique atento" />
          <Item1 wpp={wpp} openChatbot={openChatbot} />
          {/* <Item2 wpp={wpp} openChatbot={openChatbot} />*/}
          {/* <ItemHalf wpp={wpp} openChatbot={openChatbot} />*/}
        </div>
      </div>
      <Chatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        initialTicketType={initialTicketType}
      />
    </Section>
  );
};

export default Tickets;
