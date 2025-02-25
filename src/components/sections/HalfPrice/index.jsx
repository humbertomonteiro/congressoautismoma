import styles from "./halfPrice.module.css";

import Section from "../../shared/Section";
import Title from "../../shared/Title";
import ButtonSecondary from "../../shared/ButtonSecondary";
import FormGetData from "../../shared/FormGetData";

import { useState } from "react";

export default function HalfiPrice() {
  const [formGetData, setFormGetData] = useState(false);
  return (
    <Section>
      <Title text="Meia entrada" align="center" />

      <div id="half-price" data-aos="zoom-in" className={styles.container}>
        <div className={styles.img}>
          <img
            loading="lazy"
            src="https://img.freepik.com/fotos-gratis/foto-interna-de-um-estudante-feliz-do-sexo-masculino-com-cabelo-encaracolado-vestido-casualmente-sentado-na-cafeteria-trabalhando-com-tecnologias-modernas-enquanto-estuda-olhando-com-um-sorriso-no-caderno-recebendo-mensagem-de-um-amigo_273609-7468.jpg?t=st=1737132001~exp=1737135601~hmac=31b570f50864860de94d54e5b99447632f352d43c8bbd9425b87a09b1649c45c&w=740"
            alt="Imagem de palestra do Conect Autismo"
          />
        </div>
        <div className={styles.content}>
          <h3 id="meia-entrada">Veja se você se encaixa na meia entrada:</h3>
          <ul>
            <li>
              ✔︎ Pessoas com Deficiência (PcD), incluindo autistas: Apresentar
              documento comprovativo da condição.
            </li>

            <li>
              ✔︎ Idosos (60 anos ou mais): Documento de identidade com foto.
            </li>

            <li>
              ✔︎ Estudantes (de qualquer curso): Carteira de Identificação
              Estudantil (CIE), Comprovante de Matrícula ou Mensalidade.
            </li>

            <li>
              ✔︎ Professores de redes públicas e privadas: Comprovante de
              vínculo com instituição de ensino.
            </li>

            <li>
              ✔︎ Pais de autistas: Documento que comprove a condição de
              responsável legal.
            </li>
          </ul>

          {/* <span>
            🔖 Para obter o benefício da meia entrada, utilize o{" "}
            <mark>CUPOM: MEIAENTRADA</mark> (tudo em maiúsculo, sem espaços) no
            momento da compra. Este cupom não é acumulativo com outros descontos
            ou promoções.
          </span> */}

          <span>
            Lembre-se: os documentos comprobatórios devem ser apresentados na
            entrada do evento. A meia entrada é um direito que promove a
            inclusão e o acesso, e sua colaboração na apresentação dos
            documentos é necessário. Caso contrario. Teremos a opção de upgrade
            no dia do credenciamento.
          </span>
          <strong>Ingresso Pré-venda meia entrada</strong>
          <div className={styles.button}>
            <strong>
              <span>10X de</span>R$ 39,90
            </strong>
            <ButtonSecondary
              action="button"
              onClick={() => setFormGetData(true)}
            >
              COMPRAR INGRESSO
            </ButtonSecondary>
          </div>
        </div>
        {formGetData && (
          <FormGetData
            setFormGetData={setFormGetData}
            link={"https://cielolink.com.br/40yi0G0"}
          />
        )}
      </div>
    </Section>
  );
}
