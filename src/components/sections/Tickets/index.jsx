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
import bannerDesktopBg from "../../../assets/speakers/banner-desktop-bg.png";
import bannerMobile from "../../../assets/speakers/banner-mobile.png";
import useEventConfig from "../../../data/hooks/useEventConfig";

// import panfletoFiqueAtento from "../../../assets/shared/panfleto-fique-atento.jpeg";
// const TAX_PRICE_PERCENTAGE = 10;

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

const Item1 = ({ wpp, openChatbot, basePrice, batchLabel, availableUntil }) => {
  const navigate = useNavigate();
  return (
    <div className={styles.box} data-active="true">
      <div className={styles.boxContent}>
        <span>Ingresso</span>
        <h4>INDIVIDUAL{batchLabel ? ` - ${batchLabel}` : ""}</h4>
        <h5>Disponível até:</h5>
        <p>{availableUntil}</p>
      </div>
      <div className={styles.boxValue}>
        {/* <span>
          De <s>{formatToBRL(Number(basePrice))}</s> por:
        </span> */}
        <h4 className={styles.valueTicket}>
          {formatToBRL(Number(basePrice))}
          {/* <span>À vista</span> */}
          {/* <div className={styles.infoPrice}>
            Taxa da Bilheteria Digital cobrada no momento da compra.
          </div> */}
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
                //bilheteria
                // action="link"
                // link="https://www.bilheteriadigital.com/iv-congresso-de-autismo-16-de-maio"
                // target="_blank"

                //whatsapp
                // action="link"
                // link="https://api.whatsapp.com/send?phone=5598991058908&text=Olá!%20Gostaria%20de%20comprar%20ingresso"
                // target="_blank"

                //checkout
                action="button"
                onClick={() => {
                  navigate("/checkout?all=1");
                  handleAddToCart(
                    "individual",
                    "Ingresso Individual",
                    Number(basePrice)
                  );
                }}
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

const Item2 = ({
  wpp,
  openChatbot,
  socialPrice,
  batchLabel,
  availableUntil,
}) => {
  const navigate = useNavigate();
  return (
    <div className={styles.box} data-active="true">
      <div className={styles.boxContent}>
        <span>Ingresso</span>
        <h4>SOCIAL{batchLabel ? ` - ${batchLabel}` : ""}</h4>
        <h5>Disponível até:</h5>
        <p>{availableUntil}</p>
        {/* <p>Compre no mínimo 5 ingressos para ter desconto.</p> */}
      </div>
      <div className={styles.boxValue}>
        <h4 className={styles.valueTicket}>
          {formatToBRL(Number(socialPrice))}
          <span>+ 1kg de alimento</span>
        </h4>

        <ul>
          <li>Evento com Certificado de 20 horas.</li>
          <li>Garanta o seu ingresso com o menor valor!</li>

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
            <p>
              Informação Importante: O valor do ingresso refere-se
              exclusivamente à inscrição no evento. A taxa de serviço da
              Bilheteria Digital não está inclusa e será cobrada separadamente
              pela plataforma, com informação discriminada no momento da compra.
            </p>
            {!wpp ? (
              <ButtonSecondary
                style={{ width: "100%" }}
                //whatsapp
                // action="link"
                // link="https://api.whatsapp.com/send?phone=5598991058908&text=Olá!%20Gostaria%20de%20comprar%20ingresso"
                // target="_blank"

                //bilheteria
                // action="link"
                // link="https://www.bilheteriadigital.com/iv-congresso-de-autismo-16-de-maio"
                // target="_blank"

                //checkout
                action="button"
                onClick={() => {
                  navigate("/checkout?social=1");
                  handleAddToCart(
                    "social",
                    "Ingresso Social",
                    Number(socialPrice)
                  );
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

const ItemHalf = ({
  wpp,
  openChatbot,
  halfPrice,
  batchLabel,
  availableUntil,
}) => {
  const navigate = useNavigate();
  return (
    <div className={styles.box} data-active="true">
      <div className={styles.boxContent}>
        <span>Ingresso</span>
        <h4>MEIA-ENTRADA{batchLabel ? ` - ${batchLabel}` : ""}</h4>
        <h5>Disponível até:</h5>
        <p>{availableUntil}</p>
        <p>
          Lembre-se: os documentos comprobatórios devem ser apresentados na
          entrada do evento.
        </p>
      </div>
      <div className={styles.boxValue}>
        {/* <span>50% de R$ 798,00:</span> */}
        <h4 className={styles.valueTicket}>
          {formatToBRL(Number(halfPrice))}
          {/* <span>À vista</span> */}
        </h4>

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
          <p>
            Informação Importante: O valor do ingresso refere-se exclusivamente
            à inscrição no evento. A taxa de serviço da Bilheteria Digital não
            está inclusa e será cobrada separadamente pela plataforma, com
            informação discriminada no momento da compra.
          </p>
          <div className={styles.button}>
            <span>
              A meia entrada é um direito que promove a inclusão e o acesso, e
              sua colaboração na apresentação dos documentos é necessário.
            </span>
            {!wpp ? (
              <ButtonSecondary
                style={{ width: "100%" }}
                //whatsapp
                // action="link"
                // link="https://www.bilheteriadigital.com/iv-congresso-de-autismo-16-de-maio"
                // target="_blank"

                //bilheteria
                // action="link"
                // link="https://www.bilheteriadigital.com/iv-congresso-de-autismo-16-de-maio"
                // target="_blank"

                //checkout
                action="button"
                onClick={() => {
                  navigate("/checkout?half=1");
                  handleAddToCart(
                    "half",
                    "Ingresso Meia-Entrada",
                    Number(halfPrice)
                  );
                }}
              >
                Comprar Ingresso{" "}
                <IoTicketOutline style={{ fontSize: "1.2rem" }} />
              </ButtonSecondary>
            ) : (
              // <ButtonSecondary
              //   style={{ width: "100%" }}
              //   action="button"
              //   onClick={() => {
              //     navigate("/checkout?type=half");
              //     handleAddToCart("half", "Ingresso Meia-Entrada", 399.9);
              //   }}
              // >
              //   Comprar Ingresso{" "}
              //   <IoTicketOutline style={{ fontSize: "1.2rem" }} />
              // </ButtonSecondary>
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
  const { config } = useEventConfig();
  const {
    full: basePrice,
    half: halfPrice,
    social: socialPrice,
  } = config.ticketPrices;
  const { ticketBatches } = config;

  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [initialTicketType, setInitialTicketType] = useState("");
  // const [targetDate, setTargetDate] = useState("");

  const openChatbot = (ticketType) => {
    setInitialTicketType(ticketType);
    setIsChatbotOpen(true);
  };

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

          {/* <img
            className={styles.bannerDesktop}
            src={bannerDesktopBg}
            alt="Banner dos palestrantes desktop"
          />
          <img
            className={styles.bannerMobile}
            src={bannerMobile}
            alt="Banner dos palestrantes mobile"
          /> */}

          {/* <strong className={styles.highlightText}>
            As primeiras 300 inscrições ganharão uma exclusiva camisa do
            Congresso!
          </strong> */}
          {/* <CountdownTimer targetDate={new Date().getTime()} /> */}
        </div>
        <div className={styles.boxes}>
          {/* <img src={panfletoFiqueAtento} alt="Panfleto fique atento" /> */}
          <Item1
            wpp={wpp}
            openChatbot={openChatbot}
            basePrice={basePrice}
            batchLabel={ticketBatches.full.label}
            availableUntil={ticketBatches.full.availableUntil}
          />
          <Item2
            wpp={wpp}
            openChatbot={openChatbot}
            socialPrice={socialPrice}
            batchLabel={ticketBatches.social.label}
            availableUntil={ticketBatches.social.availableUntil}
          />
          <ItemHalf
            wpp={wpp}
            openChatbot={openChatbot}
            halfPrice={halfPrice}
            batchLabel={ticketBatches.half.label}
            availableUntil={ticketBatches.half.availableUntil}
          />
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
