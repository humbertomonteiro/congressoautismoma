// import styles from "./tickets.module.css";

// import Section from "../../shared/Section";
// import Title from "../../shared/Title";
// import ButtonSecondary from "../../shared/ButtonSecondary";
// import FormGetData from "../../shared/FormGetData";
// import { useNavigate } from "react-router-dom";

// import { IoTicketOutline } from "react-icons/io5";
// import { FaWhatsapp } from "react-icons/fa";

// import { useState } from "react";
// import CountdownTimer from "../../shared/CountdownTimer";

// const handleAddToCart = (itemId, itemName, price) => {
//   window.dataLayer.push({
//     event: "add_to_cart",
//     items: [
//       {
//         item_id: itemId,
//         item_name: itemName,
//         price: price,
//         quantity: 1,
//       },
//     ],
//     timestamp: new Date().toISOString(),
//   });
// };

// const handleViewContent = (itemId, itemName, price) => {
//   window.dataLayer.push({
//     event: "view_content",
//     items: [
//       {
//         item_id: itemId,
//         item_name: itemName,
//         price: price,
//         quantity: 1,
//       },
//     ],
//     timestamp: new Date().toISOString(),
//   });
// };

// const Item1 = ({ wpp }) => {
//   const navigate = useNavigate();
//   return (
//     <div className={styles.box} data-active="true">
//       {/* <strong className={styles.sale}>40% OFF</strong> */}
//       <div className={styles.boxContent}>
//         <span>Ingresso</span>
//         <h4>Ingresso INDIVIDUAL</h4>
//         <h5>Disponível até:</h5>
//         <p>31/03 ou enquanto durar</p>
//       </div>
//       <div className={styles.boxValue}>
//         <span>De R$ 799,80 por:</span>
//         <h4>R$ 499,90</h4>
//         <h3>
//           ou <strong>10X de </strong>R$ 49,90
//         </h3>

//         <ul>
//           <li>Garanta o seu ingresso com o menor valor!</li>
//           <li>Economize mais 40% no valor do ingresso!</li>
//           <li>
//             Garanta sua vaga em um evento único com grandes referências da
//             Neurodiversidade.
//           </li>
//           <li>
//             Participe do networking com profissionais e familiares engajados no
//             tema.
//           </li>
//         </ul>
//         <div className={styles.buttons}>
//           <div className={styles.button}>
//             {!wpp ? (
//               <ButtonSecondary
//                 style={{ width: "100%" }}
//                 action="button"
//                 onClick={() => {
//                   navigate("/checkout");
//                   handleAddToCart();
//                 }}
//               >
//                 Comprar Ingresso{" "}
//                 <IoTicketOutline style={{ fontSize: "1.2rem" }} />
//               </ButtonSecondary>
//             ) : (
//               <ButtonSecondary
//                 styleButton={{ width: "100%" }}
//                 action={"link"}
//                 link={
//                   "https://api.whatsapp.com/send?phone=5598988259214&text=Olá!%20Gostaria%20de%20falar%20com%20vocês.%20"
//                 }
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 onClick={handleViewContent}
//               >
//                 Comprar pelo Whatsapp{" "}
//                 <FaWhatsapp style={{ fontSize: "1.2rem" }} />
//               </ButtonSecondary>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Item2 = ({ wpp }) => {
//   const navigate = useNavigate();

//   return (
//     <div className={styles.box} data-active="true">
//       {/* <strong className={styles.sale}>40% OFF</strong> */}
//       <div className={styles.boxContent}>
//         <span>Ingresso</span>
//         <h4>Ingresso GRUPO</h4>
//         <h5>Disponível até:</h5>
//         <p>31/03 ou enquanto durar</p>
//         <p>Compre no mínimo 5 ingressos para ter desconto.</p>
//       </div>
//       <div className={styles.boxValue}>
//         <span>De R$ 799,80 por: </span>
//         <h4>R$ 449,90</h4>

//         <h3>
//           ou <strong>10X de R$ 44,90</strong>
//         </h3>
//         <ul>
//           <li>Garanta o seu ingresso com o menor valor!</li>
//           <li>Economize mais 40% no valor do ingresso!</li>
//           <li>
//             Garanta sua vaga em um evento único com grandes referências da
//             Neurodiversidade.
//           </li>
//           <li>
//             Participe do networking com profissionais e familiares engajados no
//             tema.
//           </li>
//         </ul>
//         <div className={styles.buttons}>
//           <div className={styles.button}>
//             <span>
//               Clique no botão abaixo e fale com nosso suporte para comprar o
//               ingresso Grupo.
//             </span>

//             {!wpp ? (
//               <ButtonSecondary
//                 style={{ width: "100%" }}
//                 action="button"
//                 onClick={() => {
//                   navigate("/checkout?tickets=5&coupon=grupo");
//                   handleAddToCart();
//                 }}
//               >
//                 Comprar Ingresso{" "}
//                 <IoTicketOutline style={{ fontSize: "1.2rem" }} />
//               </ButtonSecondary>
//             ) : (
//               <ButtonSecondary
//                 styleButton={{ width: "100%" }}
//                 action={"link"}
//                 link={
//                   "https://api.whatsapp.com/send?phone=5598988259214&text=Olá!%20Gostaria%20de%20falar%20com%20vocês.%20"
//                 }
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 onClick={handleViewContent}
//               >
//                 Comprar pelo Whatsapp{" "}
//                 <FaWhatsapp style={{ fontSize: "1.2rem" }} />
//               </ButtonSecondary>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const ItemHalf = ({ wpp }) => {
//   const navigate = useNavigate();

//   return (
//     <div className={styles.box} data-active="true">
//       {/* <strong className={styles.sale}>40% OFF</strong> */}
//       <div className={styles.boxContent}>
//         <span>Ingresso</span>
//         <h4>Ingresso MEIA-ENTRADA</h4>
//         <h5>Disponível até:</h5>
//         <p>31/03 ou enquanto durar</p>
//         <p>
//           Lembre-se: os documentos comprobatórios devem ser apresentados na
//           entrada do evento.
//         </p>
//       </div>
//       <div className={styles.boxValue}>
//         <span>50% de R$ 799,80: </span>
//         <h4>R$ 399,90</h4>
//         <h3>
//           ou <strong>10X de R$ 39,90</strong>
//         </h3>
//         <h5>Veja se você se encaixa na meia entrada:</h5>
//         <ul>
//           <li>
//             Pessoas com Deficiência (PcD), incluindo autistas: Apresentar
//             documento comprovativo da condição.
//           </li>

//           <li>Idosos (60 anos ou mais): Documento de identidade com foto.</li>

//           <li>
//             Estudantes (de qualquer curso): Carteira de Identificação Estudantil
//             (CIE), Comprovante de Matrícula ou Mensalidade.
//           </li>

//           <li>
//             Professores de redes públicas e privadas: Comprovante de vínculo com
//             instituição de ensino.
//           </li>

//           <li>
//             Pais de autistas: Documento que comprove a condição de responsável
//             legal.
//           </li>
//         </ul>
//         <div className={styles.buttons}>
//           <div className={styles.button}>
//             <span>
//               A meia entrada é um direito que promove a inclusão e o acesso, e
//               sua colaboração na apresentação dos documentos é necessário.
//             </span>
//             {!wpp ? (
//               <ButtonSecondary
//                 style={{ width: "100%" }}
//                 action="button"
//                 onClick={() => {
//                   navigate("/checkout?type=half");
//                   handleAddToCart();
//                 }}
//               >
//                 Comprar Ingresso{" "}
//                 <IoTicketOutline style={{ fontSize: "1.2rem" }} />
//               </ButtonSecondary>
//             ) : (
//               <ButtonSecondary
//                 styleButton={{ width: "100%" }}
//                 action={"link"}
//                 link={
//                   "https://api.whatsapp.com/send?phone=5598988259214&text=Olá!%20Gostaria%20de%20falar%20com%20vocês.%20"
//                 }
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 onClick={handleViewContent}
//               >
//                 Comprar pelo Whatsapp{" "}
//                 <FaWhatsapp style={{ fontSize: "1.2rem" }} />
//               </ButtonSecondary>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Tickets = ({ wpp }) => {
//   return (
//     <Section>
//       <Title text="Ingressos " align="center" />
//       <div id="tickets" data-aos="zoom-in" className={styles.container}>
//         <div className={styles.content}>
//           <h3>Ingressos Limitados – Garanta já sua participação!</h3>
//           <p>
//             Não perca o maior congresso sobre TEA do ano! Os ingressos estão
//             divididos em lotes, com preços promocionais para quem comprar
//             antecipado.
//           </p>
//           <strong>⚡ Confira os valores e garanta o melhor preço:</strong>
//           <CountdownTimer targetDate="2025-05-15T23:59:59" />
//         </div>
//         <div className={styles.boxes}>
//           <Item1 wpp={wpp} />
//           <Item2 wpp={wpp} />
//           <ItemHalf wpp={wpp} />
//         </div>
//       </div>
//     </Section>
//   );
// };

// export default Tickets;

import React, { useEffect, useState } from "react";
import styles from "./tickets.module.css";
import Section from "../../shared/Section";
import Title from "../../shared/Title";
import ButtonSecondary from "../../shared/ButtonSecondary";
import CountdownTimer from "../../shared/CountdownTimer";
import Chatbot from "../Chatbot";
import { IoTicketOutline } from "react-icons/io5";
import { FaWhatsapp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  return (
    <div className={styles.box} data-active="true">
      <div className={styles.boxContent}>
        <span>Ingresso</span>
        <h4>Ingresso INDIVIDUAL</h4>
        <h5>Disponível até:</h5>
        <p>28/05 ou enquanto durar</p>
      </div>
      <div className={styles.boxValue}>
        <span>
          De <s>R$ 798,00</s> por:
        </span>
        <h4>R$ 549,00</h4>
        <h3>
          ou <strong>10X de R$ 54,90</strong>
        </h3>
        <ul>
          <li>Evento com Certificado de 20 horas.</li>
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
            {!wpp ? (
              <ButtonSecondary
                style={{ width: "100%" }}
                action="button"
                onClick={() => {
                  navigate("/checkout");
                  handleAddToCart("individual", "Ingresso Individual", 499.9);
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
  const navigate = useNavigate();
  return (
    <div className={styles.box} data-active="true">
      <div className={styles.boxContent}>
        <span>Ingresso</span>
        <h4>Ingresso GRUPO</h4>
        <h5>Disponível até:</h5>
        <p>28/05 ou enquanto durar</p>
        <p>Compre no mínimo 5 ingressos para ter desconto.</p>
      </div>
      <div className={styles.boxValue}>
        <span>
          De <s>R$ 798,00</s> por:
        </span>
        <h4>R$ 449,00</h4>
        <h3>
          ou <strong>10X de R$ 44,90</strong>
        </h3>
        <ul>
          <li>Evento com Certificado de 20 horas.</li>
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
            {/* <span>
              Clique no botão abaixo e fale com nosso suporte para comprar o
              ingresso Grupo.
            </span> */}
            {!wpp ? (
              <ButtonSecondary
                style={{ width: "100%" }}
                action="button"
                onClick={() => {
                  navigate("/checkout?tickets=5&coupon=grupo");
                  handleAddToCart("group", "Ingresso Grupo", 449.9);
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

const ItemHalf = ({ wpp, openChatbot }) => {
  const navigate = useNavigate();
  return (
    <div className={styles.box} data-active="true">
      <div className={styles.boxContent}>
        <span>Ingresso</span>
        <h4>Ingresso MEIA-ENTRADA</h4>
        <h5>Disponível até:</h5>
        <p>28/05 ou enquanto durar</p>
        <p>
          Lembre-se: os documentos comprobatórios devem ser apresentados na
          entrada do evento.
        </p>
      </div>
      <div className={styles.boxValue}>
        <span>50% de R$ 798,00:</span>
        <h4>R$ 399,00</h4>
        <h3>
          ou <strong>10X de R$ 39,90</strong>
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
  const [targetDate, setTargetDate] = useState("");

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
          <strong>⚡ Confira os valores e garanta o melhor preço:</strong>
          <CountdownTimer targetDate={"2025-05-28T23:59:59"} />
          <strong className={styles.highlightText}>
            Lote promocional encerrando em breve. Compre agora e economize!
          </strong>
          {/* <CountdownTimer targetDate={new Date().getTime()} /> */}
        </div>
        <div className={styles.boxes}>
          <Item1 wpp={wpp} openChatbot={openChatbot} />
          <Item2 wpp={wpp} openChatbot={openChatbot} />
          <ItemHalf wpp={wpp} openChatbot={openChatbot} />
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
