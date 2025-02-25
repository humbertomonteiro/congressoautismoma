import { useState } from "react";
import styles from "./politic.module.css";

import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

const Politic = () => {
  const [showText, setShowText] = useState(false);
  return (
    <div className={styles.container}>
      <h2>POLÍTICAS DO CONGRESSO</h2>
      <div className={styles.content}>
        <button
          className={styles.button}
          onClick={() => setShowText(!showText)}
        >
          {showText ? <IoIosArrowUp /> : <IoIosArrowDown />}
        </button>
        {showText && (
          <>
            <h3>Políticas de Cancelamento, Acesso e Transferência</h3>
            <p>
              Cancelamentos e Reembolsos: Seguimos estritamente o Código de
              Defesa do Consumidor (Lei nº 8.078/1990, Art. 49), aceitando
              cancelamentos e solicitações de reembolso até 7 dias após a
              compra. Passado este prazo, não será possível realizar
              cancelamentos ou reembolsos devido aos compromissos operacionais e
              sociais assumidos.
            </p>
            <p>
              Acesso ao Congresso: Asseguramos que o acesso ao conteúdo será
              disponibilizado remotamente por 24 meses, tanto para quem optar
              por não participar presencialmente quanto para todos os
              participantes, garantindo a flexibilidade e comodidade de todos.
            </p>
            <p>
              Transferência de Titularidade: A política do evento proíbe a
              transferência de titularidade dos ingressos, visando a organização
              e a segurança do evento, conforme as normativas aplicáveis.
            </p>
            <p>
              Responsabilidade por Desistência: Não nos responsabilizamos por
              desistências ou não participações resultantes de decisões pessoais
              ou erros na compra. Recomendamos atenção no processo de compra,
              pois, dentro do prazo legal, é possível solicitar o reembolso
              integral.
            </p>
            <h3>Política de Cupons</h3>
            <p>
              A utilização de cupons de desconto está sujeita à responsabilidade
              integral do congressista, tanto em sua aplicação quanto em sua
              utilização. É imprescindível que o congressista aplique o cupom de
              desconto no ato da compra, verificando e confirmando o valor final
              antes de concluir a transação. Esta medida assegura que o
              benefício do desconto seja corretamente aplicado e reconhecido no
              processo de compra.
            </p>
            <p>
              Cupons: Exitem vários a responsabilidade de utilização é total do
              congressista, em sua aplicação e utilização, que deve ser feita no
              ato da compra, confirmando o valor é compra.
            </p>
            <h3>Políticas e Informações Importantes</h3>
            <p>
              Conteúdo: O conteúdo será gravado, editado, e disponibolizado com
              acesso online por 24 meses. Com certificação de participação.
            </p>
            <p>
              Seleção do Ingresso e Meia-Entrada: Regulamentada pelo Estatuto da
              Juventude (Lei nº 12.852/2013) e pelo Estatuto do Idoso (Lei nº
              10.741/2003), exigindo documentação comprovatória. Caso a
              documentação exigida não comprove sua meia entrada, é necessário o
              pagamento da diferença na hora do ato do credenciamento.”
              (Disponibilizamos maquina de cartão.)
            </p>
            <p>
              Compromisso com Causas Sociais: Apoiamos iniciativas
              significativas para o avanço no tratamento e compreensão do
              autismo.
            </p>
            <p>
              Suporte ao Participante: Disponibilizamos canais de suporte para
              resolver dúvidas ou problemas.
            </p>
            <p>
              Compras em Grupo: Oferecemos descontos para compras de cinco ou
              mais ingressos.
            </p>
            <h3>Reforço Legal</h3>
            <p>
              Em conformidade com o Código de Defesa do Consumidor,
              estabelecemos regras específicas para assegurar o bom andamento e
              a segurança do evento. As políticas, incluindo a proibição de
              transferência e revenda de ingressos, são comunicadas claramente a
              todos os participantes.
            </p>
            <h3>Presença de Palestrantes e Experiência do Participante</h3>
            <p>
              Nos comprometemos com a qualidade do evento e uma gestão adequada
              das mudanças na agenda, assegurando a melhor experiência para
              todos.
            </p>
            <h3>Objetivo do Evento</h3>
            <p>
              O Congresso Cuidar + tem como missão oferecer uma experiência
              educativa e inspiradora, focada na qualidade, segurança e impacto
              social positivo. Agradecemos sua participação e apoio nesta
              jornada significativa.
            </p>
            <p>Atenciosamente,</p>
            <p>Equipe Congresso Cuidar +</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Politic;
