import React, { useState, useEffect } from "react";
import InputMask from "react-input-mask";

import { FaUser, FaEnvelope, FaPhone, FaIdCard, FaLock } from "react-icons/fa";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

import styles from "./paymentForm.module.css";
import ParticipantsList from "../../components/checkout/ParticipantsList";
import PaymentMethodsComponent from "../../components/checkout/PaymentMethods";
import Modal from "../../components/checkout/Modal";
import logo from "../../assets/logos/logo-no-text.png";
import usePaymentForm from "../../data/hooks/usePaymentForm";
import AnimatedButton from "../../components/shared/AnimatedButton";
import { useLocation, useNavigate } from "react-router-dom";
import ButtonWhatsapp from "../../components/sections/ButtonWhatsapp";

const TICKET_PRICES = {
  all: "R$ 674,00",
  half: "R$ 337,00",
  social: "R$ 347,00",
};
const TICKET_LABELS = {
  all: "Inteiro",
  half: "Meia-entrada",
  social: "Social",
};

const TICKET_TYPE_BADGE = {
  full: "Inteiro",
  half: "Meia-entrada",
  social: "Social",
};

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
    modalState,
    setModalState,
    totals,
    ticketQuantity,
    handleTicketTypeChange,
    handleAddParticipant,
    handleApplyCoupon,
    handleRemoveCoupon,
    handlePayment,
    deriveTicketType,
  } = usePaymentForm();

  const [step, setStep] = useState(1);
  const [documentError, setDocumentError] = useState("");
  const [payerType, setPayerType] = useState("participant");
  const [selectedPayer, setSelectedPayer] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCouponAppliedInitially, setIsCouponAppliedInitially] =
    useState(false);

  const brands = ["Visa", "Mastercard", "Amex", "Elo"];
  const location = useLocation();
  const navigate = useNavigate();

  // Inicializar selectedPayer com o primeiro participante
  useEffect(() => {
    if (
      payerType === "participant" &&
      participants.length > 0 &&
      !selectedPayer
    ) {
      setSelectedPayer(participants[0]);
    }
  }, [participants, payerType, selectedPayer]);

  // Inicializar quantidades e cupom a partir da URL
  useEffect(() => {
    if (isInitialized) return;
    const searchParams = new URLSearchParams(location.search);

    const allParam = parseInt(searchParams.get("all")) || 0;
    const halfParam = parseInt(searchParams.get("half")) || 0;
    const socialParam = parseInt(searchParams.get("social")) || 0;
    const couponParam = searchParams.get("coupon");

    // Suporte legado: ?tickets=N&type=half
    const legacyTickets = parseInt(searchParams.get("tickets")) || 0;
    const legacyType = searchParams.get("type");

    if (allParam > 0 || halfParam > 0 || socialParam > 0) {
      setFormState((prev) => ({
        ...prev,
        allTickets: allParam,
        halfTickets: halfParam,
        socialTickets: socialParam,
      }));
    } else if (legacyTickets > 0) {
      if (legacyType === "half") {
        setFormState((prev) => ({
          ...prev,
          allTickets: 0,
          halfTickets: legacyTickets,
        }));
      } else if (legacyType === "social") {
        setFormState((prev) => ({
          ...prev,
          allTickets: 0,
          socialTickets: legacyTickets,
        }));
      } else {
        setFormState((prev) => ({ ...prev, allTickets: legacyTickets }));
      }
    }

    if (couponParam && !isCouponAppliedInitially) {
      setFormState((prev) => ({
        ...prev,
        coupon: { code: couponParam, isApplied: true },
      }));
      handleApplyCoupon(null, couponParam);
      setIsCouponAppliedInitially(true);
    }

    setIsInitialized(true);
  }, [location.search, isInitialized]);

  // GTM
  useEffect(() => {
    if (window.dataLayer) {
      window.dataLayer.push({
        event: "add_payment_info",
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  const handleParticipantChange = (field, value) => {
    setCurrentParticipant((prev) => ({ ...prev, [field]: value }));
    if (field === "document") {
      const cleanDoc = value.replace(/\D/g, "");
      if (currentParticipant.documentType === "cpf") {
        setDocumentError(
          cleanDoc.length > 0 && cleanDoc.length !== 11
            ? "O CPF deve ter 11 dígitos."
            : ""
        );
      } else if (currentParticipant.documentType === "cnpj") {
        setDocumentError(
          cleanDoc.length > 0 && cleanDoc.length !== 14
            ? "O CNPJ deve ter 14 dígitos."
            : ""
        );
      }
    }
  };

  const handleCreditCardChange = (field, value) => {
    setCreditCardData((prev) => ({ ...prev, [field]: value }));
  };

  // Tipo do ingresso do próximo participante a ser adicionado
  const nextParticipantType = (() => {
    const pos = participants.length;
    const raw = deriveTicketType(
      pos,
      formState.allTickets,
      formState.halfTickets
    );
    return { raw, label: TICKET_TYPE_BADGE[raw] || "Inteiro" };
  })();

  const nextStep = () => {
    if (step === 1) {
      if (ticketQuantity === 0) {
        setModalState({
          isOpen: true,
          title: "Nenhum ingresso selecionado",
          message: "Selecione ao menos 1 ingresso antes de continuar.",
          type: "error",
        });
        return;
      }
    }

    if (step === 2) {
      let automaticallyAdded = false;

      if (ticketQuantity === 1 && participants.length === 0) {
        automaticallyAdded = true;
        const requiredFields = ["name", "email", "phone", "document"];
        const missingFields = requiredFields.filter(
          (f) => !currentParticipant[f] || currentParticipant[f].trim() === ""
        );
        if (missingFields.length > 0) {
          setModalState({
            isOpen: true,
            title: "Campos Incompletos",
            message: `Preencha os seguintes campos: ${missingFields.join(
              ", "
            )}.`,
            type: "error",
          });
          return;
        }
        const cleanDoc = currentParticipant.document.replace(/\D/g, "");
        if (
          currentParticipant.documentType === "cpf" &&
          cleanDoc.length !== 11
        ) {
          setModalState({
            isOpen: true,
            title: "CPF Inválido",
            message: "O CPF deve ter 11 dígitos.",
            type: "error",
          });
          return;
        }
        if (
          currentParticipant.documentType === "cnpj" &&
          cleanDoc.length !== 14
        ) {
          setModalState({
            isOpen: true,
            title: "CNPJ Inválido",
            message: "O CNPJ deve ter 14 dígitos.",
            type: "error",
          });
          return;
        }
        handleAddParticipant({ preventDefault: () => {} });
      }

      if (participants.length < ticketQuantity && !automaticallyAdded) {
        setModalState({
          isOpen: true,
          title: "Participantes Insuficientes",
          message: `Você adicionou ${participants.length} de ${ticketQuantity} participante(s). Adicione todos antes de continuar.`,
          type: "error",
        });
        return;
      }
    }

    setStep((prev) => prev + 1);
  };

  const prevStep = () => setStep((prev) => prev - 1);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!selectedPayer) {
      setModalState({
        isOpen: true,
        title: "Pagador Não Selecionado",
        message:
          "Por favor, selecione ou adicione um pagador antes de prosseguir.",
        type: "error",
      });
      return;
    }
    handlePayment(e, selectedPayer, navigate);
  };

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
              <h1>Congresso Autismo MA 2026</h1>
              <span>Checkout Seguro</span>
              <h2>Descrição</h2>
              <p>
                Passaporte para dois dias: 16 e 17 de maio! Participe do maior
                congresso sobre Neurodiversidade.
              </p>
            </div>
          </div>

          {/* ── STEP 1: Quantidade ── */}
          {step === 1 && (
            <div className={`${styles.orderSummary} ${styles.card}`}>
              <h2>Quantidade de Ingressos</h2>

              {["all", "half", "social"].map((type) => {
                const fieldMap = {
                  all: "allTickets",
                  half: "halfTickets",
                  social: "socialTickets",
                };
                const field = fieldMap[type];
                const value = formState[field];

                return (
                  <div key={type} className={styles.ticketRow}>
                    <div className={styles.ticketInfo}>
                      <span className={styles.ticketName}>
                        {TICKET_LABELS[type]}
                      </span>
                      <span className={styles.ticketPrice}>
                        {TICKET_PRICES[type]}{" "}
                        {type === "social" &&
                          " + 1kg de alimento para cada ingresso"}
                      </span>
                    </div>
                    <div className={styles.counter}>
                      <button
                        type="button"
                        className={styles.counterBtn}
                        onClick={() =>
                          handleTicketTypeChange(
                            type,
                            String(Math.max(0, value - 1))
                          )
                        }
                        disabled={value === 0}
                      >
                        −
                      </button>
                      <span className={styles.counterVal}>{value}</span>
                      <button
                        type="button"
                        className={styles.counterBtn}
                        onClick={() =>
                          handleTicketTypeChange(type, String(value + 1))
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}

              {ticketQuantity > 0 && (
                <p
                  style={{ marginTop: "8px", fontSize: "13px", color: "#555" }}
                >
                  Total de ingressos: <strong>{ticketQuantity}</strong>
                </p>
              )}

              {formState.coupon.isApplied && (
                <p>
                  Cupom <strong>{formState.coupon.code}</strong> aplicado —
                  Desconto: R$ {totals.discount}
                </p>
              )}

              <p className={styles.total}>
                <strong>Total: R$ {totals.total}</strong>
              </p>

              <button
                onClick={nextStep}
                data-primary-button-next="true"
                className={`${styles.nextButton} ${styles.primaryButton}`}
              >
                Próximo <IoIosArrowForward />
              </button>
            </div>
          )}
          {/* ── STEP 2: Participantes ── */}
          {step === 2 && (
            <>
              {participants.length < ticketQuantity ? (
                <div className={styles.participantForm}>
                  <h2>
                    Adicionar Participante ({participants.length}/
                    {ticketQuantity})
                  </h2>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#2c3e50",
                      marginBottom: "8px",
                      fontWeight: "bold",
                    }}
                  >
                    Tipo do ingresso:{" "}
                    <span
                      style={{
                        background: "#eaf4ff",
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {nextParticipantType.label}
                    </span>
                  </p>
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
                        value={currentParticipant.phone}
                        onChange={(e) =>
                          handleParticipantChange("phone", e.target.value)
                        }
                        required
                      >
                        {(inputProps) => <input {...inputProps} type="text" />}
                      </InputMask>
                    </label>
                    <label>
                      <p>
                        <FaIdCard />{" "}
                        {currentParticipant.documentType === "cnpj"
                          ? "CNPJ"
                          : "CPF"}
                      </p>
                      <InputMask
                        mask={
                          currentParticipant.documentType === "cnpj"
                            ? "99.999.999/9999-99"
                            : "999.999.999-99"
                        }
                        value={currentParticipant.document}
                        onChange={(e) =>
                          handleParticipantChange("document", e.target.value)
                        }
                        required
                      >
                        {(inputProps) => <input {...inputProps} type="text" />}
                      </InputMask>
                      {documentError && (
                        <span className={styles.error}>{documentError}</span>
                      )}
                    </label>
                    {ticketQuantity > 1 && (
                      <button
                        type="submit"
                        className={`${styles.addButton} ${styles.primaryButton}`}
                      >
                        Adicionar
                      </button>
                    )}
                  </form>
                </div>
              ) : (
                <div className={styles.card}>
                  <h2>Todos os Participantes Adicionados</h2>
                  <p>
                    Você adicionou todos os {ticketQuantity} participantes
                    necessários.
                  </p>
                </div>
              )}

              {participants.length > 0 && (
                <ParticipantsList
                  participants={participants}
                  setParticipants={setParticipants}
                />
              )}

              <div className={styles.navigation}>
                <button onClick={prevStep} className={styles.backButton}>
                  <IoIosArrowBack /> Voltar
                </button>
                <button
                  onClick={nextStep}
                  className={`${styles.nextButton} ${styles.primaryButton}`}
                >
                  Próximo <IoIosArrowForward />
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Pagamento ── */}
          {step === 3 && (
            <div>
              <PaymentMethodsComponent
                setPaymentMethod={(value) =>
                  setFormState((prev) => ({ ...prev, paymentMethod: value }))
                }
              />
              <div className={`${styles.paymentSummary} ${styles.card}`}>
                <h2>Resumo do Pedido</h2>
                {formState.allTickets > 0 && (
                  <p>
                    Inteiro: {formState.allTickets} × R$ 674,00 ={" "}
                    <strong>R$ {totals.valueTicketsAll}</strong>
                  </p>
                )}
                {formState.halfTickets > 0 && (
                  <p>
                    Meia-entrada: {formState.halfTickets} × R$ 337,00 ={" "}
                    <strong>R$ {totals.valueTicketsHalf}</strong>
                  </p>
                )}
                {formState.socialTickets > 0 && (
                  <p>
                    Social: {formState.socialTickets} × R$ 347,00 ={" "}
                    <strong>R$ {totals.valueTicketsSocial}</strong>
                  </p>
                )}
                {formState.coupon.isApplied && (
                  <p>
                    Desconto ({formState.coupon.code}): -{" "}
                    <strong>R$ {totals.discount}</strong>
                  </p>
                )}
                <p className={styles.total}>
                  <strong>Total: R$ {totals.total}</strong>
                </p>
              </div>

              <form className={styles.payment} onSubmit={handleFormSubmit}>
                {formState.paymentMethod === "creditCard" ? (
                  <>
                    <div className={styles.paymentDetails}>
                      <h2>Dados do Pagador</h2>
                      <label>
                        <p>Tipo de Pagador</p>
                        <select
                          value={payerType}
                          onChange={(e) => {
                            setPayerType(e.target.value);
                            setSelectedPayer(null);
                          }}
                        >
                          <option value="participant">
                            Um dos participantes
                          </option>
                          <option value="new">Adicionar pagador</option>
                        </select>
                      </label>
                      {payerType === "participant" ? (
                        <label>
                          <p>Selecione o Pagador</p>
                          <select
                            value={selectedPayer?.document || ""}
                            onChange={(e) => {
                              const payer = participants.find(
                                (p) => p.document === e.target.value
                              );
                              setSelectedPayer(payer);
                            }}
                            required
                          >
                            <option value="" disabled>
                              Selecione um participante
                            </option>
                            {participants.map((p) => (
                              <option key={p.document} value={p.document}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : (
                        <>
                          <label>
                            <p>Nome do Pagador</p>
                            <input
                              type="text"
                              value={selectedPayer?.name || ""}
                              onChange={(e) =>
                                setSelectedPayer((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              required
                            />
                          </label>
                          <label>
                            <p>CPF</p>
                            <InputMask
                              mask="999.999.999-99"
                              value={selectedPayer?.document || ""}
                              onChange={(e) =>
                                setSelectedPayer((prev) => ({
                                  ...prev,
                                  document: e.target.value,
                                }))
                              }
                              required
                            >
                              {(inputProps) => (
                                <input {...inputProps} type="text" />
                              )}
                            </InputMask>
                          </label>
                        </>
                      )}
                    </div>
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
                        <p>Vencimento (MM/AAAA)</p>
                        <InputMask
                          mask="99/9999"
                          value={creditCardData.maturity}
                          onChange={(e) =>
                            handleCreditCardChange("maturity", e.target.value)
                          }
                          placeholder="Ex: 05/2026"
                          required
                        >
                          {(inputProps) => (
                            <input {...inputProps} type="text" />
                          )}
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
                            handleCreditCardChange(
                              "installments",
                              e.target.value
                            )
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
                  </>
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
                      <p>Tipo de Pagador</p>
                      <select
                        value={payerType}
                        onChange={(e) => {
                          setPayerType(e.target.value);
                          setSelectedPayer(null);
                        }}
                      >
                        <option value="participant">
                          Um dos participantes
                        </option>
                        <option value="new">Adicionar pagador</option>
                      </select>
                    </label>
                    {payerType === "participant" ? (
                      <label>
                        <p>Selecione o Pagador</p>
                        <select
                          value={selectedPayer?.document || ""}
                          onChange={(e) => {
                            const payer = participants.find(
                              (p) => p.document === e.target.value
                            );
                            setSelectedPayer({
                              name: payer?.name || "",
                              document: payer?.document || "",
                              documentType: payer?.documentType || "cpf",
                              zipCode: "",
                              street: "",
                              addressNumber: "",
                              district: "",
                              city: "",
                              state: "",
                            });
                          }}
                          required
                        >
                          <option value="" disabled>
                            Selecione um participante
                          </option>
                          {participants.map((p) => (
                            <option key={p.document} value={p.document}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <>
                        <label>
                          <p>Nome do Pagador</p>
                          <input
                            type="text"
                            value={selectedPayer?.name || ""}
                            onChange={(e) =>
                              setSelectedPayer((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            required
                          />
                        </label>
                        <label>
                          <p>Tipo de Documento</p>
                          <select
                            value={selectedPayer?.documentType || "cpf"}
                            onChange={(e) =>
                              setSelectedPayer((prev) => ({
                                ...prev,
                                documentType: e.target.value,
                                document: "",
                              }))
                            }
                          >
                            <option value="cpf">CPF</option>
                            <option value="cnpj">CNPJ</option>
                          </select>
                        </label>
                        <label>
                          <p>
                            {selectedPayer?.documentType === "cnpj"
                              ? "CNPJ"
                              : "CPF"}
                          </p>
                          <InputMask
                            mask={
                              selectedPayer?.documentType === "cnpj"
                                ? "99.999.999/9999-99"
                                : "999.999.999-99"
                            }
                            value={selectedPayer?.document || ""}
                            onChange={(e) =>
                              setSelectedPayer((prev) => ({
                                ...prev,
                                document: e.target.value,
                              }))
                            }
                            required
                          >
                            {(inputProps) => (
                              <input {...inputProps} type="text" />
                            )}
                          </InputMask>
                        </label>
                      </>
                    )}
                  </div>
                )}

                <div className={styles.navigation}>
                  <button onClick={prevStep} className={styles.backButton}>
                    <IoIosArrowBack /> Voltar
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

      {formState.loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className={styles.spinner}></div>
            <p>Processando pagamento, por favor, não recarregue a página...</p>
          </div>
        </div>
      )}
      <ButtonWhatsapp text="" hover="Precisa de ajuda com o pagamento?" />
    </div>
  );
};

export default PaymentForm;
