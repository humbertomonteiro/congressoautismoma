import React, { useState } from "react";
import styles from "./FormRegisterSalud.module.css";
import logo from "../../assets/logos/logos-telefone.png";

function FormRegisterSalud() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    nomeCliente: "",
    cpfCliente: "",
    dataNascimentoCliente: "",
    tipoSanguineo: "",
    diagnostico: "",
    sexo: "",
    operadoraSaude: "",
    coparticipacao: "",
    // Mãe
    nomeMae: "",
    rgMae: "",
    cpfMae: "",
    dataNascimentoMae: "",
    profissaoMae: "",
    // Pai
    nomePai: "",
    rgPai: "",
    cpfPai: "",
    dataNascimentoPai: "",
    profissaoPai: "",
    // Step 2
    terapias: [],
    // Step 3
    logradouro: "",
    numero: "",
    bairro: "",
    complemento: "",
    cep: "",
    cidade: "",
    estado: "",
    // Step 4
    telefoneResidencial: "",
    telefoneMae: "",
    telefonePai: "",
    telefoneRecado: "",
    emergenciaContato: "",
    // Step 5
    autorizacao: "",
    assinaturaDigital: null,
    documentos: [],
  });
  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const validateStep1 = () => {
    if (!formData.nomeCliente.trim()) return false;
    if (!formData.cpfCliente.trim()) return false;
    if (!formData.dataNascimentoCliente) return false;
    if (!formData.tipoSanguineo) return false;
    if (!formData.diagnostico.trim()) return false;
    if (!formData.sexo) return false;
    if (!formData.operadoraSaude.trim()) return false;
    if (!formData.coparticipacao) return false;
    if (!formData.nomeMae.trim()) return false;
    if (!formData.rgMae.trim()) return false;
    if (!formData.cpfMae.trim()) return false;
    if (!formData.dataNascimentoMae) return false;
    if (!formData.profissaoMae.trim()) return false;

    return true;
  };

  const validateStep2 = () => {
    return formData.terapias.length > 0;
  };

  const validateStep3 = () => {
    if (!formData.logradouro.trim()) return false;
    if (!formData.numero.trim()) return false;
    if (!formData.bairro.trim()) return false;
    if (!formData.cep.trim()) return false;
    if (!formData.cidade.trim()) return false;
    if (!formData.estado) return false;

    return true;
  };

  const validateStep4 = () => {
    if (!formData.telefoneMae.trim()) return false;
    if (!formData.emergenciaContato.trim()) return false;

    return true;
  };

  const validateStep5 = () => {
    if (!formData.autorizacao) return false;
    if (!formData.assinaturaDigital) return false;
    if (!formData.documentos || formData.documentos.length === 0) return false;

    return true;
  };

  const validateCurrentStep = () => {
    switch (step) {
      case 1:
        return validateStep1();
      case 2:
        return validateStep2();
      case 3:
        return validateStep3();
      case 4:
        return validateStep4();
      case 5:
        return validateStep5();
      default:
        return true;
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      if (checked) {
        setFormData({
          ...formData,
          terapias: [...formData.terapias, value],
        });
      } else {
        setFormData({
          ...formData,
          terapias: formData.terapias.filter((item) => item !== value),
        });
      }
    } else if (type === "file") {
      setFormData({
        ...formData,
        [name]: e.target.multiple ? [...e.target.files] : e.target.files[0],
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const validateCurrentStepWithErrors = () => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.nomeCliente.trim())
          newErrors.nomeCliente = "Nome do cliente é obrigatório";
        if (!formData.cpfCliente.trim())
          newErrors.cpfCliente = "CPF é obrigatório";
        if (!formData.dataNascimentoCliente)
          newErrors.dataNascimentoCliente = "Data de nascimento é obrigatória";
        if (!formData.tipoSanguineo)
          newErrors.tipoSanguineo = "Tipo sanguíneo é obrigatório";
        if (!formData.diagnostico.trim())
          newErrors.diagnostico = "Diagnóstico é obrigatório";
        if (!formData.sexo) newErrors.sexo = "Sexo é obrigatório";
        if (!formData.operadoraSaude.trim())
          newErrors.operadoraSaude = "Operadora de saúde é obrigatória";
        if (!formData.coparticipacao)
          newErrors.coparticipacao = "Coparticipação é obrigatória";
        if (!formData.nomeMae.trim())
          newErrors.nomeMae = "Nome da mãe é obrigatório";
        if (!formData.rgMae.trim()) newErrors.rgMae = "RG da mãe é obrigatório";
        if (!formData.cpfMae.trim())
          newErrors.cpfMae = "CPF da mãe é obrigatório";
        if (!formData.dataNascimentoMae)
          newErrors.dataNascimentoMae =
            "Data de nascimento da mãe é obrigatória";
        if (!formData.profissaoMae.trim())
          newErrors.profissaoMae = "Profissão da mãe é obrigatória";
        break;

      case 2:
        if (formData.terapias.length === 0)
          newErrors.terapias = "Selecione pelo menos uma terapia";
        break;

      case 3:
        if (!formData.logradouro.trim())
          newErrors.logradouro = "Logradouro é obrigatório";
        if (!formData.numero.trim()) newErrors.numero = "Número é obrigatório";
        if (!formData.bairro.trim()) newErrors.bairro = "Bairro é obrigatório";
        if (!formData.cep.trim()) newErrors.cep = "CEP é obrigatório";
        if (!formData.cidade.trim()) newErrors.cidade = "Cidade é obrigatória";
        if (!formData.estado) newErrors.estado = "Estado é obrigatório";
        break;

      case 4:
        if (!formData.telefoneMae.trim())
          newErrors.telefoneMae = "Telefone da mãe é obrigatório";
        if (!formData.emergenciaContato.trim())
          newErrors.emergenciaContato = "Contato de emergência é obrigatório";
        break;

      case 5:
        if (!formData.autorizacao)
          newErrors.autorizacao = "Autorização é obrigatória";
        if (!formData.assinaturaDigital)
          newErrors.assinaturaDigital = "Assinatura digital é obrigatória";
        if (!formData.documentos || formData.documentos.length === 0) {
          newErrors.documentos = "Documentos são obrigatórios";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStepWithErrors()) {
      setStep(step + 1);
      window.scrollTo(0, 0);
      setErrors({}); // Limpa os erros ao avançar
    } else {
      // Rola para o primeiro erro
      const firstErrorElement = document.querySelector('[data-error="true"]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setIsSubmitting(true);
  //   setSubmitMessage("");

  //   try {
  //     const payload = new FormData();

  //     // 🔹 Dados simples
  //     Object.entries(formData).forEach(([key, value]) => {
  //       if (
  //         key !== "assinaturaDigital" &&
  //         key !== "documentos" &&
  //         value !== null
  //       ) {
  //         if (Array.isArray(value)) {
  //           payload.append(key, JSON.stringify(value));
  //         } else {
  //           payload.append(key, value);
  //         }
  //       }
  //     });

  //     // 🔹 Arquivos
  //     if (formData.assinaturaDigital) {
  //       payload.append("assinaturaDigital", formData.assinaturaDigital);
  //     }

  //     if (formData.documentos && formData.documentos.length > 0) {
  //       formData.documentos.forEach((file) => {
  //         payload.append("documentos", file);
  //       });
  //     }

  //     const isProduction = import.meta.env.VITE_ENV === "production";
  //     const baseUrl = isProduction
  //       ? `${import.meta.env.VITE_BASE_URL_PRODUCTION}/client/register`
  //       : `${import.meta.env.VITE_BASE_URL_SANDBOX}/client/register`;

  //     const response = await fetch(baseUrl, {
  //       method: "POST",
  //       body: payload,
  //     });

  //     if (!response.ok) {
  //       throw new Error("Erro ao enviar formulário");
  //     }

  //     setSubmitMessage("✅ Cadastro enviado com sucesso!");
  //     setStep(6);
  //   } catch (error) {
  //     console.error(error);
  //     setSubmitMessage("❌ Erro ao enviar. Tente novamente.");
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");
    setSubmitStatus(null);

    try {
      const payload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (
          key !== "assinaturaDigital" &&
          key !== "documentos" &&
          value !== null
        ) {
          if (Array.isArray(value)) {
            payload.append(key, JSON.stringify(value));
          } else {
            payload.append(key, value);
          }
        }
      });

      if (formData.assinaturaDigital) {
        payload.append("assinaturaDigital", formData.assinaturaDigital);
      }

      if (formData.documentos?.length > 0) {
        formData.documentos.forEach((file) => {
          payload.append("documentos", file);
        });
      }

      const isProduction = import.meta.env.VITE_ENV === "production";
      const baseUrl = isProduction
        ? `${import.meta.env.VITE_BASE_URL_PRODUCTION}/client/register`
        : `${import.meta.env.VITE_BASE_URL_SANDBOX}/client/register`;

      const response = await fetch(baseUrl, {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar formulário");
      }

      setSubmitStatus("success");
      setStep(6);
    } catch (error) {
      console.error(error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ErrorStep = () => (
    <div className={styles.finalStep}>
      <div className={styles.errorIcon}>⚠️</div>

      <h2 className={styles.stepTitle}>Ops! Tivemos um probleminha 😥</h2>

      <div className={styles.errorMessage}>
        <p>Não conseguimos finalizar seu cadastro automaticamente.</p>

        <p>Mas fique tranquila(o)! Nossa equipe está pronta para te ajudar.</p>

        <p className={styles.highlight}>
          Entre em contato agora pelo WhatsApp:
        </p>

        <a
          href="https://wa.me/559888259214"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.whatsappButton}
        >
          💬 Falar no WhatsApp
        </a>

        <p className={styles.note}>
          Número: <strong>+55 98 8825-9214</strong>
        </p>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1 formData={formData} handleChange={handleChange} />;
      case 2:
        return <Step2 formData={formData} handleChange={handleChange} />;
      case 3:
        return <Step3 formData={formData} handleChange={handleChange} />;
      case 4:
        return <Step4 formData={formData} handleChange={handleChange} />;
      case 5:
        return <Step5 formData={formData} handleChange={handleChange} />;
      case 6:
        return submitStatus === "success" ? <FinalStep /> : <ErrorStep />;
      default:
        return <Step1 formData={formData} handleChange={handleChange} />;
    }
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          {/* <h1 className={styles.logo}>Salud Cuidar Mais</h1> */}
          <img
            src={logo}
            className={styles.logo}
            alt="Logo Salud Cuidar Mais"
          />
          <p className={styles.tagline}>
            Cuidando com carinho e profissionalismo
          </p>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(step / 6) * 100}%` }}
            ></div>
          </div>
          <div className={styles.stepIndicators}>
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div
                key={num}
                className={`${styles.stepIndicator} ${
                  step >= num ? styles.active : ""
                }`}
              >
                <span className={styles.stepNumber}>{num}</span>
                <span className={styles.stepLabel}>
                  {num === 1 && "Cliente"}
                  {num === 2 && "Terapias"}
                  {num === 3 && "Endereço"}
                  {num === 4 && "Contato"}
                  {num === 5 && "Autorização"}
                  {num === 6 && "Final"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formContent}>{renderStep()}</div>

          <div className={styles.buttonContainer}>
            {step > 1 && step < 6 && (
              <button
                type="button"
                onClick={prevStep}
                className={`${styles.button} ${styles.buttonSecondary}`}
              >
                ← Voltar
              </button>
            )}

            {step < 5 && (
              <button
                type="button"
                onClick={nextStep}
                className={`${styles.button} ${styles.buttonPrimary}`}
                disabled={!validateCurrentStep()}
              >
                Continuar →
              </button>
            )}

            {step === 5 && (
              <button
                type="submit"
                className={`${styles.button} ${styles.buttonSuccess}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "✅ Finalizar Cadastro"}
              </button>
            )}
          </div>
        </form>
      </main>

      <footer className={styles.footer}>
        <p>© 2024 Salud Cuidar Mais. Todos os direitos reservados.</p>
        <p className={styles.contact}>
          Dúvidas? Entre em contato: atendimentosalud@gmail.com
        </p>
      </footer>
    </div>
  );
}

// Componentes para cada step
const Step1 = ({ formData, handleChange }) => (
  <div className={styles.step}>
    <h2 className={styles.stepTitle}>
      👶 Precisamos Conhecer Nosso Mini Cliente
    </h2>
    <p className={styles.stepDescription}>
      Espaço destinado para as informações do Cliente e seus responsáveis
      legais.
    </p>

    <div className={styles.formSection}>
      <h3 className={styles.sectionTitle}>Informações do Cliente</h3>

      <div className={styles.formGroup}>
        <label htmlFor="nomeCliente" className={styles.label}>
          NOME DO CLIENTE *
        </label>
        <input
          type="text"
          id="nomeCliente"
          name="nomeCliente"
          value={formData.nomeCliente}
          onChange={handleChange}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label htmlFor="cpfCliente" className={styles.label}>
            CPF *
          </label>
          <input
            type="text"
            id="cpfCliente"
            name="cpfCliente"
            value={formData.cpfCliente}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="dataNascimentoCliente" className={styles.label}>
            DATA DE NASCIMENTO *
          </label>
          <input
            type="date"
            id="dataNascimentoCliente"
            name="dataNascimentoCliente"
            value={formData.dataNascimentoCliente}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label htmlFor="tipoSanguineo" className={styles.label}>
            TIPO SANGUÍNEO *
          </label>
          <select
            id="tipoSanguineo"
            name="tipoSanguineo"
            value={formData.tipoSanguineo}
            onChange={handleChange}
            className={styles.select}
            required
          >
            <option value="">Selecione</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="sexo" className={styles.label}>
            SEXO *
          </label>
          <select
            id="sexo"
            name="sexo"
            value={formData.sexo}
            onChange={handleChange}
            className={styles.select}
            required
          >
            <option value="">Selecione</option>
            <option value="MASCULINO">MASCULINO</option>
            <option value="FEMININO">FEMININO</option>
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="diagnostico" className={styles.label}>
          DIAGNÓSTICO (DESCREVER O CID QUE CONSTA EM LAUDO) *
        </label>
        <textarea
          id="diagnostico"
          name="diagnostico"
          value={formData.diagnostico}
          onChange={handleChange}
          className={styles.textarea}
          rows="3"
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="operadoraSaude" className={styles.label}>
          QUAL A OPERADORA DE SAÚDE DO CLIENTE? *
        </label>
        <input
          type="text"
          id="operadoraSaude"
          name="operadoraSaude"
          value={formData.operadoraSaude}
          onChange={handleChange}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          A OPERADORA DE SAÚDE POSSUI COPARTICIPAÇÃO? *
        </label>
        <div className={styles.radioGroup}>
          <div className={styles.radioItem}>
            <input
              type="radio"
              id="coparticipacao-sim"
              name="coparticipacao"
              value="Sim"
              checked={formData.coparticipacao === "Sim"}
              onChange={handleChange}
              className={styles.radioInput}
              required
            />
            <label htmlFor="coparticipacao-sim" className={styles.radioLabel}>
              Sim
            </label>
          </div>
          <div className={styles.radioItem}>
            <input
              type="radio"
              id="coparticipacao-nao"
              name="coparticipacao"
              value="Não"
              checked={formData.coparticipacao === "Não"}
              onChange={handleChange}
              className={styles.radioInput}
            />
            <label htmlFor="coparticipacao-nao" className={styles.radioLabel}>
              Não
            </label>
          </div>
        </div>
      </div>
    </div>

    <div className={styles.formSection}>
      <h3 className={styles.sectionTitle}>Informações da Mãe</h3>

      <div className={styles.formGroup}>
        <label htmlFor="nomeMae" className={styles.label}>
          NOME DA MÃE *
        </label>
        <input
          type="text"
          id="nomeMae"
          name="nomeMae"
          value={formData.nomeMae}
          onChange={handleChange}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label htmlFor="rgMae" className={styles.label}>
            RG *
          </label>
          <input
            type="text"
            id="rgMae"
            name="rgMae"
            value={formData.rgMae}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="cpfMae" className={styles.label}>
            CPF *
          </label>
          <input
            type="text"
            id="cpfMae"
            name="cpfMae"
            value={formData.cpfMae}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label htmlFor="dataNascimentoMae" className={styles.label}>
            DATA DE NASCIMENTO *
          </label>
          <input
            type="date"
            id="dataNascimentoMae"
            name="dataNascimentoMae"
            value={formData.dataNascimentoMae}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="profissaoMae" className={styles.label}>
            PROFISSÃO *
          </label>
          <input
            type="text"
            id="profissaoMae"
            name="profissaoMae"
            value={formData.profissaoMae}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>
      </div>
    </div>

    <div className={styles.formSection}>
      <h3 className={styles.sectionTitle}>Informações do Pai</h3>

      <div className={styles.formGroup}>
        <label htmlFor="nomePai" className={styles.label}>
          NOME DO PAI *
        </label>
        <input
          type="text"
          id="nomePai"
          name="nomePai"
          value={formData.nomePai}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label htmlFor="rgPai" className={styles.label}>
            RG
          </label>
          <input
            type="text"
            id="rgPai"
            name="rgPai"
            value={formData.rgPai}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="cpfPai" className={styles.label}>
            CPF
          </label>
          <input
            type="text"
            id="cpfPai"
            name="cpfPai"
            value={formData.cpfPai}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label htmlFor="dataNascimentoPai" className={styles.label}>
            DATA DE NASCIMENTO
          </label>
          <input
            type="date"
            id="dataNascimentoPai"
            name="dataNascimentoPai"
            value={formData.dataNascimentoPai}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="profissaoPai" className={styles.label}>
            PROFISSÃO
          </label>
          <input
            type="text"
            id="profissaoPai"
            name="profissaoPai"
            value={formData.profissaoPai}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
      </div>
    </div>
  </div>
);

const Step2 = ({ formData, handleChange }) => {
  const terapias = [
    "TERAPIA ABA",
    "FONOAUDIOLOGIA",
    "PSICOTERAPIA",
    "TERAPIA OCUPACIONAL",
    "INTEGRAÇÃO SENSORIAL",
    "PSICOPEDAGOGIA",
    "MUSICOTERAPIA",
    "FISIOTERAPIA",
    "PSICOMOTRICIDADE",
  ];

  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>
        🎯 Quais Terapias Nosso Cliente Precisará?
      </h2>
      <div className={styles.infoBox}>
        <p>
          Nossa agenda tem como base o pedido médico prescrito pelo médico(a) do
          seu filho(a), no entanto, priorizamos também aquilo que os pais
          desejam.
        </p>
        <p>
          <strong>
            Assinale as opções que você deseja que o seu filho(a) inicie na
            clínica.
          </strong>
        </p>
        <p>
          Essa seção é importante para podermos entender o que você deseja e
          para que nós possamos verificar se temos a disponibilidade para lhe
          atender, de acordo com nossa estrutura e quadro clínico.
        </p>
        <p className={styles.highlight}>
          Garanto que nos esforçaremos para atender ao seu pedido, baseado no
          pedido médico e proporcionar a melhor experiência com acolhimento e
          resultados positivos.
        </p>
      </div>

      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Plano Terapêutico *</h3>

        <div className={styles.checkboxGrid}>
          {terapias.map((terapia) => (
            <label key={terapia} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="terapias"
                value={terapia}
                checked={formData.terapias.includes(terapia)}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <span className={styles.checkboxCustom}></span>
              <span className={styles.checkboxText}>{terapia}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

const Step3 = ({ formData, handleChange }) => (
  <div className={styles.step}>
    <h2 className={styles.stepTitle}>
      📍 Entender a Região do Nosso Mini Cliente
    </h2>
    <p className={styles.stepDescription}>
      É muito importante para nós! (Colocar o endereço que a criança reside)
    </p>

    <div className={styles.formSection}>
      <div className={styles.formGroup}>
        <label htmlFor="logradouro" className={styles.label}>
          LOGRADOURO *
          <span className={styles.subLabel}>
            (Nome da rua, avenida, praça, etc.)
          </span>
        </label>
        <input
          type="text"
          id="logradouro"
          name="logradouro"
          value={formData.logradouro}
          onChange={handleChange}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label htmlFor="numero" className={styles.label}>
            NÚMERO *
          </label>
          <input
            type="text"
            id="numero"
            name="numero"
            value={formData.numero}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="bairro" className={styles.label}>
            BAIRRO *
          </label>
          <input
            type="text"
            id="bairro"
            name="bairro"
            value={formData.bairro}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="complemento" className={styles.label}>
          COMPLEMENTO
        </label>
        <input
          type="text"
          id="complemento"
          name="complemento"
          value={formData.complemento}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label htmlFor="cep" className={styles.label}>
            CEP *
          </label>
          <input
            type="text"
            id="cep"
            name="cep"
            value={formData.cep}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="cidade" className={styles.label}>
            CIDADE *
          </label>
          <input
            type="text"
            id="cidade"
            name="cidade"
            value={formData.cidade}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="estado" className={styles.label}>
            ESTADO *
          </label>
          <select
            id="estado"
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            className={styles.select}
            required
          >
            <option value="">Selecione</option>
            <option value="AC">Acre</option>
            <option value="AL">Alagoas</option>
            <option value="AP">Amapá</option>
            <option value="AM">Amazonas</option>
            <option value="BA">Bahia</option>
            <option value="CE">Ceará</option>
            <option value="DF">Distrito Federal</option>
            <option value="ES">Espírito Santo</option>
            <option value="GO">Goiás</option>
            <option value="MA">Maranhão</option>
            <option value="MT">Mato Grosso</option>
            <option value="MS">Mato Grosso do Sul</option>
            <option value="MG">Minas Gerais</option>
            <option value="PA">Pará</option>
            <option value="PB">Paraíba</option>
            <option value="PR">Paraná</option>
            <option value="PE">Pernambuco</option>
            <option value="PI">Piauí</option>
            <option value="RJ">Rio de Janeiro</option>
            <option value="RN">Rio Grande do Norte</option>
            <option value="RS">Rio Grande do Sul</option>
            <option value="RO">Rondônia</option>
            <option value="RR">Roraima</option>
            <option value="SC">Santa Catarina</option>
            <option value="SP">São Paulo</option>
            <option value="SE">Sergipe</option>
            <option value="TO">Tocantins</option>
          </select>
        </div>
      </div>
    </div>
  </div>
);

const Step4 = ({ formData, handleChange }) => (
  <div className={styles.step}>
    <h2 className={styles.stepTitle}>📞 Como Podemos Conversar com Você?</h2>
    <p className={styles.stepDescription}>
      Preencha os contatos dos pais e responsáveis, quanto mais contatos
      tivermos melhor será nossa comunicação.
    </p>

    <div className={styles.formSection}>
      <div className={styles.formGroup}>
        <label htmlFor="telefoneResidencial" className={styles.label}>
          TELEFONE RESIDENCIAL/E OU TRABALHO
        </label>
        <input
          type="tel"
          id="telefoneResidencial"
          name="telefoneResidencial"
          value={formData.telefoneResidencial}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="telefoneMae" className={styles.label}>
          TELEFONE DA MÃE *
          <span className={styles.subLabel}>Informar um contato WhatsApp</span>
        </label>
        <input
          type="tel"
          id="telefoneMae"
          name="telefoneMae"
          value={formData.telefoneMae}
          onChange={handleChange}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="telefonePai" className={styles.label}>
          TELEFONE DO PAI
          <span className={styles.subLabel}>Informar um contato WhatsApp</span>
        </label>
        <input
          type="tel"
          id="telefonePai"
          name="telefonePai"
          value={formData.telefonePai}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="telefoneRecado" className={styles.label}>
          TELEFONE PARA RECADO
          <span className={styles.subLabel}>Informar um contato WhatsApp</span>
        </label>
        <input
          type="tel"
          id="telefoneRecado"
          name="telefoneRecado"
          value={formData.telefoneRecado}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="emergenciaContato" className={styles.label}>
          EM CASO DE EMERGÊNCIA PARA QUEM DEVEMOS LIGAR PRIMEIRO? *
          <span className={styles.subLabel}>Deixe o nome e telefone</span>
        </label>
        <textarea
          id="emergenciaContato"
          name="emergenciaContato"
          value={formData.emergenciaContato}
          onChange={handleChange}
          className={styles.textarea}
          rows="3"
          placeholder="Ex: Maria (mãe) - (11) 99999-9999"
          required
        />
      </div>
    </div>
  </div>
);

const Step5 = ({ formData, handleChange }) => (
  <div className={styles.step}>
    <h2 className={styles.stepTitle}>📝 Autorização</h2>
    <div className={styles.infoBox}>
      <p>
        Estamos quase finalizando essa etapa, aqui é o momento de você nos dar
        ciência de que está de acordo com as disposições estabelecidas pela
        clínica. Vamos lá?!
      </p>
      <p>
        Seu e-mail no início do processo nos ajuda a entender que este
        formulário foi respondido de um dispositivo móvel utilizado por você.
        Mas, ele não exclui a sua assinatura.
      </p>
    </div>

    <div className={styles.formSection}>
      <div className={styles.declarationBox}>
        <p className={styles.declarationText}>
          <strong>DECLARAÇÃO:</strong> Eu, abaixo assinado, requeiro a inscrição
          do paciente acima identificado, declarando estar de acordo com as
          disposições estabelecidas pela Clínica Salud Cuidar. Assumo inteira
          responsabilidade pelas informações citadas neste formulário de
          pré-inscrição.
        </p>

        <div className={styles.formGroup}>
          <label className={styles.label}>CONFIRMAR DECLARAÇÃO *</label>
          <div className={styles.radioGroup}>
            <div className={styles.radioItem}>
              <input
                type="radio"
                id="autorizacao-sim"
                name="autorizacao"
                value="SIM"
                checked={formData.autorizacao === "SIM"}
                onChange={handleChange}
                className={styles.radioInput}
                required
              />
              <label htmlFor="autorizacao-sim" className={styles.radioLabel}>
                SIM, confirmo e concordo
              </label>
            </div>
            <div className={styles.radioItem}>
              <input
                type="radio"
                id="autorizacao-nao"
                name="autorizacao"
                value="NÃO"
                checked={formData.autorizacao === "NÃO"}
                onChange={handleChange}
                className={styles.radioInput}
              />
              <label htmlFor="autorizacao-nao" className={styles.radioLabel}>
                NÃO concordo
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.uploadSection}>
        <h3 className={styles.sectionTitle}>Documentação Necessária</h3>
        <div className={styles.uploadInfo}>
          <p>
            <strong>Dica:</strong> Assine manualmente em uma folha de papel em
            branco, tire foto e nos envie no espaço abaixo.
          </p>
          <p>
            <strong>Precisaremos das seguintes documentações:</strong>
          </p>
          <ul className={styles.documentList}>
            <li>RG</li>
            <li>CPF</li>
            <li>Comprovante de Residência</li>
            <li>Foto de perfil da criança</li>
            <li>Laudo Médico</li>
            <li>Carteira do Plano</li>
          </ul>
          <p className={styles.note}>Obs.: Lembrar de anexar fotos legíveis.</p>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="assinaturaDigital" className={styles.label}>
            ASSINATURA DIGITAL OU FOTO DA ASSINATURA *
            <span className={styles.subLabel}>
              Entre no aplicativo do GOV.BR, acesse assinatura, tire print da
              assinatura e envie neste espaço. Ou envie foto da assinatura
              manual.
            </span>
          </label>
          <input
            type="file"
            id="assinaturaDigital"
            name="assinaturaDigital"
            onChange={handleChange}
            className={styles.fileInput}
            accept="image/*,.pdf"
            required
          />
          <div className={styles.fileInfo}>
            <span className={styles.fileIcon}>📄</span>
            <span>Arquivo único - Máx. 10MB</span>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="documentos" className={styles.label}>
            DOCUMENTOS DE IDENTIFICAÇÃO *
            <span className={styles.subLabel}>
              Será importante para concluirmos os processos de autorização junto
              à operadora de saúde e para fins de cadastro do cliente.
            </span>
          </label>
          <input
            type="file"
            id="documentos"
            name="documentos"
            onChange={handleChange}
            className={styles.fileInput}
            accept="image/*,.pdf,.doc,.docx"
            multiple
            required
          />
          <div className={styles.fileInfo}>
            <span className={styles.fileIcon}>📎</span>
            <span>Até 3 arquivos - Máx. 10MB cada</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const FinalStep = () => (
  <div className={styles.finalStep}>
    <div className={styles.successIcon}>🎉</div>
    <h2 className={styles.stepTitle}>
      Pronto, Terminamos Essa Etapa com Sucesso!
    </h2>

    <div className={styles.successMessage}>
      <p>
        Obrigada por preencher a ficha de pré-inscrição! Sua chegada até aqui é
        muito importante para nós.
      </p>
      <p>
        Em breve nossa equipe técnica entrará em contato para dar continuidade
        ao processo de admissão.
      </p>
      <p className={styles.highlight}>
        Estamos à disposição sempre que precisar.
      </p>
      <p className={styles.signature}>
        Até breve!
        <br />
        <strong>Com cuidado,</strong>
        <br />
        Equipe de Atendimento Salud Cuidar Mais.
      </p>
    </div>
  </div>
);

export default FormRegisterSalud;
