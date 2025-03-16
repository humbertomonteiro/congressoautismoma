import React, { useState } from "react";
import InputMask from "react-input-mask";
import axios from "axios";
import { FaUser, FaEnvelope, FaPhone, FaIdCard, FaLock } from "react-icons/fa";
import styles from "./paymentForm.module.css";
import ParticipantsList from "../../components/checkout/ParticipantsList";
import PaymentMethodsComponent from "../../components/checkout/PaymentMethods";
import Modal from "../../components/checkout/Modal";
import logo from "../../assets/logos/logo-no-text.png";
import usePaymentForm from "../../data/hooks/usePaymentForm";
import AnimatedButton from "../../components/shared/AnimatedButton";

const PaymentForm = () => {
  const {
    formState,
    setFormState,
    participants,
    setParticipants,
    currentParticipant,
    setCurrentParticipant,
    creditCardData,
    setCreditCardData,
    boletoData,
    setBoletoData,
    modalState,
    setModalState,
    totals,
    handleTicketQuantityChange,
    handleAddParticipant,
    handleApplyCoupon,
    handleRemoveCoupon,
    handlePayment,
  } = usePaymentForm();

  const [step, setStep] = useState(1);
  const [cepError, setCepError] = useState("");
  const [cpfError, setCpfError] = useState("");
  const brands = ["Visa", "Mastercard", "Amex", "Elo"];

  const handleParticipantChange = (field, value) => {
    setCurrentParticipant((prev) => ({ ...prev, [field]: value }));
    if (field === "cpf") {
      const cleanCpf = value.replace(/\D/g, "");
      if (cleanCpf.length > 0 && cleanCpf.length !== 11) {
        setCpfError("O CPF deve ter 11 dígitos.");
      } else {
        setCpfError("");
      }
    }
  };

  const handleCreditCardChange = (field, value) => {
    setCreditCardData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBoletoChange = (field, value) => {
    setBoletoData((prev) => ({ ...prev, [field]: value }));
    if (field === "zipCode") {
      const cleanCep = value.replace(/\D/g, "");
      if (cleanCep.length === 8) {
        fetchAddressFromCep(cleanCep);
      }
    }
  };

  const fetchAddressFromCep = async (cep) => {
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.data.erro) {
        setBoletoData((prev) => ({
          ...prev,
          street: response.data.logradouro,
          district: response.data.bairro,
          city: response.data.localidade,
          state: response.data.uf,
        }));
        setCepError("");
      } else {
        setCepError("CEP não encontrado.");
      }
    } catch (error) {
      setCepError("Erro ao buscar o CEP.");
    }
  };

  const nextStep = () => {
    if (step === 2 && participants.length < formState.ticketQuantity) {
      setModalState({
        isOpen: true,
        title: "Participantes Insuficientes",
        message: `Você adicionou ${participants.length} participante(s), mas selecionou ${formState.ticketQuantity} ingresso(s). Adicione todos os participantes antes de continuar.`,
        type: "error",
      });
      return;
    }
    // Avança para a próxima etapa (Pagamento) sem redirecionar
    setStep((prev) => prev + 1);
  };

  const prevStep = () => setStep((prev) => prev - 1);

  return (
    <div className={styles.container}>
      <div className={styles.progressBar}>
        <div className={`${styles.step} ${step >= 1 ? styles.active : ""}`}>
          <span>1</span> Quantidade
        </div>
        <div className={`${styles.step} ${step >= 2 ? styles.active : ""}`}>
          <span>2</span> Participantes
        </div>
        <div className={`${styles.step} ${step >= 3 ? styles.active : ""}`}>
          <span>3</span> Pagamento
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.order}>
          <div className={styles.description}>
            <img src={logo} alt="Logo" />
            <div className={styles.text}>
              <h1>Congresso Autismo MA 2025</h1>
              <span>Checkout Seguro</span>
              <h2>Descrição</h2>
              <p>
                Passaporte para dois dias: 31 de maio e 1º de junho! Participe
                do maior congresso sobre Neurodiversidade.
              </p>
            </div>
          </div>

          {step === 1 && (
            <div className={`${styles.orderSummary} ${styles.card}`}>
              <h2>Quantidade de Ingressos</h2>
              <label>
                <p>Quantidade de ingresso(s)</p>
                <select
                  value={formState.ticketQuantity}
                  onChange={handleTicketQuantityChange}
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} ingresso(s)
                    </option>
                  ))}
                </select>
              </label>
              {!formState.coupon.isApplied ? (
                <label>
                  <p>Cupom de desconto</p>
                  <div className={styles.couponInputWrapper}>
                    <input
                      type="text"
                      placeholder="Digite seu cupom"
                      value={formState.coupon.code}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          coupon: { ...prev.coupon, code: e.target.value },
                        }))
                      }
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!formState.coupon.code}
                      className={styles.applyButton}
                    >
                      Aplicar
                    </button>
                  </div>
                </label>
              ) : (
                <label>
                  <p>
                    Cupom aplicado: {formState.coupon.code} - Desconto: R${" "}
                    {totals.discount}
                  </p>
                  <button
                    onClick={handleRemoveCoupon}
                    className={styles.removeCouponButton}
                  >
                    Remover
                  </button>
                </label>
              )}
              <p className={styles.total}>
                <strong>Total: R$ {totals.total}</strong>
              </p>
              <button
                onClick={nextStep}
                className={`${styles.nextButton} ${styles.primaryButton}`}
              >
                Próximo
              </button>
            </div>
          )}

          {step === 2 && (
            <>
              {participants.length < formState.ticketQuantity ? (
                <div className={styles.participantForm}>
                  <h2>
                    Adicionar Participante ({participants.length}/
                    {formState.ticketQuantity})
                  </h2>
                  <form className={styles.form} onSubmit={handleAddParticipant}>
                    <label>
                      <p>
                        <FaUser /> Nome completo
                      </p>
                      <input
                        type="text"
                        value={currentParticipant.name}
                        onChange={(e) =>
                          handleParticipantChange("name", e.target.value)
                        }
                        required
                      />
                    </label>
                    <label>
                      <p>
                        <FaEnvelope /> E-mail
                      </p>
                      <input
                        type="email"
                        value={currentParticipant.email}
                        onChange={(e) =>
                          handleParticipantChange("email", e.target.value)
                        }
                        required
                      />
                    </label>
                    <label>
                      <p>
                        <FaPhone /> Telefone
                      </p>
                      <InputMask
                        mask="(99) 99999-9999"
                        value={currentParticipant.number}
                        onChange={(e) =>
                          handleParticipantChange("number", e.target.value)
                        }
                        required
                      >
                        {(inputProps) => <input {...inputProps} type="text" />}
                      </InputMask>
                    </label>
                    <label>
                      <p>
                        <FaIdCard /> CPF
                      </p>
                      <InputMask
                        mask="999.999.999-99"
                        value={currentParticipant.cpf}
                        onChange={(e) =>
                          handleParticipantChange("cpf", e.target.value)
                        }
                        required
                      >
                        {(inputProps) => <input {...inputProps} type="text" />}
                      </InputMask>
                      {cpfError && (
                        <span className={styles.error}>{cpfError}</span>
                      )}
                    </label>
                    <label className={styles.toggleLabel}>
                      <p>Meia entrada?</p>
                      <div
                        className={`${styles.toggle} ${
                          currentParticipant.isHalfPrice
                            ? styles.toggleActive
                            : ""
                        }`}
                        onClick={() =>
                          handleParticipantChange(
                            "isHalfPrice",
                            !currentParticipant.isHalfPrice
                          )
                        }
                      >
                        <span>
                          {currentParticipant.isHalfPrice ? "Sim" : "Não"}
                        </span>
                      </div>
                    </label>
                    <button
                      type="submit"
                      className={`${styles.addButton} ${styles.primaryButton}`}
                    >
                      Adicionar
                    </button>
                  </form>
                </div>
              ) : (
                <div className={styles.card}>
                  <h2>Todos os Participantes Adicionados</h2>
                  <p>
                    Você adicionou todos os {formState.ticketQuantity}{" "}
                    participantes necessários.
                  </p>
                </div>
              )}
              {participants.length > 0 && (
                <ParticipantsList
                  participants={participants}
                  setParticipants={setParticipants}
                  halfTickets={formState.halfTickets}
                  setHalfTickets={(value) =>
                    setFormState((prev) => ({ ...prev, halfTickets: value }))
                  }
                />
              )}
              <div className={styles.navigation}>
                <button onClick={prevStep} className={styles.backButton}>
                  Voltar
                </button>
                <button
                  onClick={nextStep}
                  className={`${styles.nextButton} ${styles.primaryButton}`}
                >
                  Próximo
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <div>
              <PaymentMethodsComponent
                setPaymentMethod={(value) =>
                  setFormState((prev) => ({ ...prev, paymentMethod: value }))
                }
              />
              {/* Discriminação dos valores acima dos dados de pagamento */}
              <div className={`${styles.paymentSummary} ${styles.card}`}>
                <h2>Resumo do Pedido</h2>
                <p>
                  Ingressos inteiros:{" "}
                  {formState.ticketQuantity - formState.halfTickets} x R${" "}
                  {totals.valueTicketsAll}
                </p>
                {formState.halfTickets > 0 && (
                  <p>
                    Ingressos meia: {formState.halfTickets} x R${" "}
                    {totals.valueTicketsHalf}
                  </p>
                )}
                {formState.coupon.isApplied && (
                  <p>
                    Desconto ({formState.coupon.code}): R$ {totals.discount}
                  </p>
                )}
                <p className={styles.total}>
                  <strong>Total: R$ {totals.total}</strong>
                </p>
              </div>
              <form className={styles.payment} onSubmit={handlePayment}>
                {formState.paymentMethod === "creditCard" ? (
                  <div className={styles.paymentDetails}>
                    <h2>Pagamento com Cartão de Crédito</h2>
                    <label>
                      <p>
                        <FaIdCard /> Número do cartão
                      </p>
                      <input
                        type="text"
                        value={creditCardData.cardNumber}
                        onChange={(e) =>
                          handleCreditCardChange("cardNumber", e.target.value)
                        }
                        required
                      />
                    </label>
                    <label>
                      <p>
                        <FaUser /> Nome no cartão
                      </p>
                      <input
                        type="text"
                        value={creditCardData.cardName}
                        onChange={(e) =>
                          handleCreditCardChange("cardName", e.target.value)
                        }
                        required
                      />
                    </label>
                    <label>
                      <p>Vencimento (MM/YYYY)</p>
                      <InputMask
                        mask="99/9999"
                        value={creditCardData.maturity}
                        onChange={(e) =>
                          handleCreditCardChange("maturity", e.target.value)
                        }
                        required
                      >
                        {(inputProps) => <input {...inputProps} type="text" />}
                      </InputMask>
                    </label>
                    <label>
                      <p>CVC</p>
                      <input
                        type="text"
                        value={creditCardData.cardCode}
                        onChange={(e) =>
                          handleCreditCardChange("cardCode", e.target.value)
                        }
                        maxLength="4"
                        required
                      />
                    </label>
                    <label>
                      <p>Marca do cartão</p>
                      <select
                        value={creditCardData.brand}
                        onChange={(e) =>
                          handleCreditCardChange("brand", e.target.value)
                        }
                        required
                      >
                        {brands.map((brand) => (
                          <option key={brand} value={brand}>
                            {brand}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <p>Quantidade de parcelas</p>
                      <select
                        value={creditCardData.installments}
                        onChange={(e) =>
                          handleCreditCardChange("installments", e.target.value)
                        }
                        required
                      >
                        {Array.from({ length: 10 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1} Parcela(s)
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : formState.paymentMethod === "pix" ? (
                  <div className={styles.paymentDetails}>
                    <h2>Pagamento com PIX</h2>
                    <p>
                      Após clicar no botão abaixo, você verá o QR Code ou a
                      chave PIX.
                    </p>
                  </div>
                ) : (
                  <div className={styles.paymentDetails}>
                    <h2>Pagamento com Boleto</h2>
                    <label>
                      <p>CEP</p>
                      <InputMask
                        mask="99999-999"
                        value={boletoData.zipCode}
                        onChange={(e) =>
                          handleBoletoChange("zipCode", e.target.value)
                        }
                        required
                      >
                        {(inputProps) => <input {...inputProps} type="text" />}
                      </InputMask>
                      {cepError && (
                        <span className={styles.error}>{cepError}</span>
                      )}
                    </label>
                    <label>
                      <p>Rua</p>
                      <input
                        type="text"
                        value={boletoData.street}
                        onChange={(e) =>
                          handleBoletoChange("street", e.target.value)
                        }
                        required
                      />
                    </label>
                    <label>
                      <p>Número</p>
                      <input
                        type="text"
                        value={boletoData.number}
                        onChange={(e) =>
                          handleBoletoChange("number", e.target.value)
                        }
                        required
                      />
                    </label>
                    <label>
                      <p>Bairro</p>
                      <input
                        type="text"
                        value={boletoData.district}
                        onChange={(e) =>
                          handleBoletoChange("district", e.target.value)
                        }
                        required
                      />
                    </label>
                    <label>
                      <p>Cidade</p>
                      <input
                        type="text"
                        value={boletoData.city}
                        onChange={(e) =>
                          handleBoletoChange("city", e.target.value)
                        }
                        required
                      />
                    </label>
                    <label>
                      <p>Estado (ex.: SP)</p>
                      <input
                        type="text"
                        value={boletoData.state}
                        onChange={(e) =>
                          handleBoletoChange("state", e.target.value)
                        }
                        maxLength="2"
                        required
                      />
                    </label>
                  </div>
                )}
                <div className={styles.navigation}>
                  <button onClick={prevStep} className={styles.backButton}>
                    Voltar
                  </button>
                  <AnimatedButton
                    type="submit"
                    isLoading={formState.loading}
                    disabled={formState.loading}
                  >
                    {formState.paymentMethod === "creditCard"
                      ? "Fazer Pagamento"
                      : formState.paymentMethod === "pix"
                      ? "Gerar PIX"
                      : "Gerar Boleto"}
                  </AnimatedButton>
                </div>
                <p className={styles.securityNote}>
                  <FaLock /> Pagamento Seguro
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
      <Modal
        isOpen={modalState.isOpen}
        onClose={() =>
          setModalState((prev) => ({ ...prev, isOpen: false, content: null }))
        }
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        content={modalState.content}
      />
    </div>
  );
};

export default PaymentForm;
