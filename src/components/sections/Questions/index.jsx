import styles from "./questions.module.css";
import Title from "../../shared/Title";
import { TiArrowDown, TiArrowUp } from "react-icons/ti";
import { useState } from "react";
// import { FaWhatsapp } from "react-icons/fa";
// import ButtonSecondary from "../../shared/ButtonSecondary";
import Section from "../../shared/Section";

// import { FaArrowRight } from "react-icons/fa";

const Questions = () => {
  const [item1, setItem1] = useState(false);
  const [item2, setItem2] = useState(false);
  const [item3, setItem3] = useState(false);
  const [item4, setItem4] = useState(false);
  const [item5, setItem5] = useState(false);
  const [item6, setItem6] = useState(false);
  const [item7, setItem7] = useState(false);
  // const [item8, setItem8] = useState(false);
  return (
    <Section>
      <Title text="Perguntas frequentes" align="center" />
      <div data-aos="zoom-in" className={styles.container}>
        {/* <div className={styles.box}>
          <FaWhatsapp />
          <h3>Prefere falar com nosso time?</h3>
          <p>Fale com nosso time de suporte pelo Whatsapp</p>
          <ButtonSecondary
            action="link"
            link="https://wa.me/5598988830200"
            target="_blank"
          >
            Clique aqui <FaArrowRight />
          </ButtonSecondary>
        </div> */}
        <ul className={styles.list}>
          <li>
            <div>
              <h4 onClick={() => setItem1(!item1)}>
                Para quem é o Congresso?{" "}
                {item1 ? <TiArrowUp /> : <TiArrowDown />}
              </h4>
              {item1 && (
                <div>
                  <p>
                    É para quem deseja um espaço dedicado a troca de
                    experiências, se aprofundar nas últimas pesquisas e avanços
                    científicos, práticas e abordagens para entender, apoiar e
                    incluir pessoas neurodivergentes.
                  </p>
                  <p>
                    Então, você que é pai atípico , terapeuta , professor,
                    médico, estudante da área da edução ou saúde. Esse evento é
                    para você.
                  </p>
                </div>
              )}
            </div>
          </li>
          <li>
            <div>
              <h4 onClick={() => setItem2(!item2)}>
                Como faço para adquirir meia entrada?{" "}
                {item2 ? <TiArrowUp /> : <TiArrowDown />}
              </h4>
              {item2 && (
                <div>
                  <p>
                    Para obter meia-entrada, é necessário apresentar a Carteira
                    de Identificação Estudantil (CIE) ou documento equivalente.
                    Também são elegíveis pessoas com deficiência e seus
                    acompanhantes, famílias atípicas, idosos, jovens de baixa
                    renda e educadores, mediante documentação comprobatória
                  </p>
                </div>
              )}
            </div>
          </li>
          <li>
            <div>
              <h4 onClick={() => setItem3(!item3)}>
                Quais são os benefícios de participar do congresso?{" "}
                {item3 ? <TiArrowUp /> : <TiArrowDown />}
              </h4>
              {item3 && (
                <div>
                  {/* <ul>
                    <li>1 Grande palco.</li>
                    <li>Grandes palestrantes inusitados.</li>
                    <li>Dois dias de muita imersão</li>
                    <li>Mais tempo de ricas palestras.</li>
                    <li>Acesso a palestrantes renomados e inusitados.</li>
                    <li>Certificado de 30 horas.</li>
                    <li>Acesso ao conteúdo gravado por 24 meses.</li>
                    <li>
                      Networking com uma comunidade global de profissionais da
                      saúde.
                    </li>
                    <li>Expositores com as últimas inovações em saúde.</li>
                    <li>
                      Impacto social com parte dos rendimentos apoiando
                      iniciativas sociais.
                    </li>
                  </ul> */}
                  <p>
                    Esses encontros proporcionam uma série de benefícios que
                    contribuem para o desenvolvimento e aprimoramento do
                    conhecimento, além de possibilitar a troca de experiências e
                    muito networking com grandes profissionais da área.
                  </p>
                </div>
              )}
            </div>
          </li>
          <li>
            <div>
              <h4 onClick={() => setItem4(!item4)}>
                Como entrar em contato com o Congresso?{" "}
                {item4 ? <TiArrowUp /> : <TiArrowDown />}
              </h4>
              {item4 && (
                <div>
                  <p>
                    Você pode entrar em contato com a equipe através do e-mail
                    disponibilizado na página de vendas
                    saludcuidarmais@gmail.com ou via Instagram @saludcuidarmais
                  </p>
                </div>
              )}
            </div>
          </li>
          <li>
            <div>
              <h4 onClick={() => setItem5(!item5)}>
                Como funciona a política de cancelamento e reembolso?{" "}
                {item5 ? <TiArrowUp /> : <TiArrowDown />}
              </h4>
              {item5 && (
                <div>
                  <p>
                    Respeitamos o Código de Defesa do Consumidor, permitindo
                    cancelamentos e reembolsos em até 7 dias após a compra. Após
                    este período, não oferecemos cancelamentos, transferencias
                    de titularidade ou reembolsos devido aos compromissos já
                    estabelecidos.
                  </p>
                </div>
              )}
            </div>
          </li>
          {/* <li>
            <div>
              <h4 onClick={() => setItem6(!item6)}>
                Como será o asseco ao conteúdo online?{" "}
                {item6 ? <TiArrowUp /> : <TiArrowDown />}
              </h4>
              {item6 && (
                <div>
                  <p>
                    O conteúdo será gravado e editado e disponibilizado na
                    plataforma Hotmart para que o aluno possa usufruir a vontade
                    durante 24 meses. Permitindo que você assista quando e onde
                    desejar.
                  </p>
                </div>
              )}
            </div>
          </li> */}
          <li>
            <div>
              <h4 onClick={() => setItem7(!item7)}>
                Tive um problema com o pagamento. O que devo fazer?{" "}
                <TiArrowDown />
              </h4>
              {item7 && (
                <div>
                  <p>
                    Sentimos muito pelo transtorno! Por favor, entre em contato
                    conosco pelo WhatsApp para que possamos resolver o problema
                    o mais rápido possível.{" "}
                    <a
                      href="https://wa.me/5598988830200?text=Olá,%20tive%20um%20problema%20com%20o%20pagamento%20do%20congresso%20TEA%20e%20gostaria%20de%20ajuda.
"
                    >
                      Clique aqui
                    </a>
                    . Nossa equipe está pronta para ajudar!
                  </p>
                </div>
              )}
            </div>
          </li>
          {/* <li>
            <div>
              <h4 onClick={() => setItem8(!item8)}>
                Meia entrada <TiArrowDown />
              </h4>
              {item8 && (
                <div>
                  <p>
                    Para obter meia-entrada, é necessário apresentar a Carteira
                    de Identificação Estudantil (CIE) ou documento equivalente.
                    Também são elegíveis pessoas com deficiência e seus
                    acompanhantes, famílias atípicas, idosos, jovens de baixa
                    renda e educadores, mediante documentação comprobatória
                  </p>
                </div>
              )}
            </div>
          </li> */}
        </ul>
      </div>
    </Section>
  );
};

export default Questions;
