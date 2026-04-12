import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaWhatsapp, FaPaperPlane } from "react-icons/fa";
import styles from "./Chatbot.module.css";
import useEventConfig from "../../../data/hooks/useEventConfig";

const Chatbot = ({ isOpen, onClose, initialTicketType }) => {
  const whatsappNumber = "5598988259214";
  const { config: eventConfig } = useEventConfig();
  const ticketPrices = {
    full:  eventConfig.ticketPrices.full,
    half:  eventConfig.ticketPrices.half,
    group: eventConfig.ticketPrices.full,
  };

  const [state, setState] = useState({
    step: "quantity",
    quantity: 1,
    type: "full",
    payment: "",
    messages: [],
    inputEnabled: true,
  });

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  const getTicketLabel = (type) => {
    const labels = {
      full: "Inteiro",
      half: "Meia-entrada",
      group: "Grupo",
    };
    return labels[type] || "Inteiro";
  };

  // Efeito para inicialização do chat
  useEffect(() => {
    if (isOpen) {
      const validType = ["full", "half", "group"].includes(initialTicketType)
        ? initialTicketType
        : "full";

      const newMessages = initialTicketType
        ? [
            {
              sender: "bot",
              text:
                validType === "group"
                  ? `Você está comprando ingresso ${getTicketLabel(
                      validType
                    )}. Quantos ingressos deseja? (Mínimo 5 ingressos)`
                  : `Você está comprando ingresso ${getTicketLabel(
                      validType
                    )}. Quantos ingressos deseja? (1-100)`,
            },
          ]
        : [
            {
              sender: "bot",
              text: "Olá! Seja bem-vindo ao atendimento do Congresso Autismo MA 2026!",
            },
            {
              sender: "bot",
              text: "Quantos ingressos você deseja comprar? (Digite um número entre 1 e 100)",
            },
          ];

      setState((prev) => ({
        ...prev,
        type: validType,
        messages: newMessages,
        step: "quantity",
        quantity: 1,
        payment: "",
        inputEnabled: true,
      }));
      setInputValue("");
    }
  }, [isOpen, initialTicketType]);

  // Rolagem automática
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages]);

  const resetChat = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: "quantity",
      quantity: 1,
      type: "full",
      payment: "",
      messages: [
        {
          sender: "bot",
          text: "Olá! Seja bem-vindo ao atendimento do Congresso Autismo MA 2026!",
        },
        {
          sender: "bot",
          text: "Quantos ingressos você deseja comprar? (Digite um número entre 1 e 100)",
        },
      ],
      inputEnabled: true,
    }));
    setInputValue("");
  }, []);

  const addMessage = useCallback((sender, text, options = []) => {
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, { sender, text, options }],
      inputEnabled: options.length === 0,
    }));
  }, []);

  const showTicketTypeOptions = useCallback(
    (quantity) => {
      const options = [
        {
          label: `Inteiro (R$ ${ticketPrices.full.toFixed(2)})`,
          action: () => selectType("full", quantity),
        },
        {
          label: `Meia-entrada (R$ ${ticketPrices.half.toFixed(2)})`,
          action: () => selectType("half", quantity),
        },
      ];

      if (quantity >= 5) {
        options.push({
          label: `Grupo (R$ ${ticketPrices.group.toFixed(2)} cada)`,
          action: () => selectType("group", quantity),
        });
      }

      addMessage("bot", "Selecione o tipo de ingresso:", options);
    },
    [addMessage, ticketPrices]
  );

  const showPaymentOptions = useCallback(
    (quantity, type) => {
      console.log("showPaymentOptions - type:", type, "quantity:", quantity); // Log de depuração
      const paymentOptions = [
        {
          label: "Cartão de Crédito",
          action: () => selectPayment("Cartão de Crédito", quantity, type),
        },
        { label: "PIX", action: () => selectPayment("PIX", quantity, type) },
        {
          label: "Débito",
          action: () => selectPayment("Débito", quantity, type),
        },
        {
          label: "Boleto",
          action: () => selectPayment("Boleto", quantity, type),
        },
      ];

      addMessage("bot", "Selecione o método de pagamento:", paymentOptions);
    },
    [addMessage]
  );

  const processInput = useCallback(
    (input) => {
      const quantity = parseInt(input);

      if (isNaN(quantity)) {
        addMessage("bot", "Por favor, digite um número válido.");
        return false;
      }

      if (quantity < 1 || quantity > 100) {
        addMessage("bot", "Por favor, digite um número entre 1 e 100.");
        return false;
      }

      if (state.type === "group" && quantity < 5) {
        addMessage(
          "bot",
          "Para ingressos do tipo Grupo, a quantidade mínima é 5 ingressos. Por favor, digite uma quantidade válida."
        );
        return false;
      }

      setState((prev) => {
        console.log(
          "processInput - setting quantity:",
          quantity,
          "type:",
          prev.type
        ); // Log de depuração
        return {
          ...prev,
          quantity,
          step: initialTicketType ? "payment" : "type",
        };
      });

      if (initialTicketType) {
        showPaymentOptions(quantity, initialTicketType);
      } else {
        showTicketTypeOptions(quantity);
      }

      return true;
    },
    [
      initialTicketType,
      addMessage,
      showPaymentOptions,
      showTicketTypeOptions,
      state.type,
    ]
  );

  const selectType = useCallback(
    (type, quantity) => {
      console.log("selectType - type:", type, "quantity:", quantity); // Log de depuração
      if (type === "group" && quantity < 5) {
        setState((prev) => ({
          ...prev,
          step: "quantity",
          type,
          quantity: 1,
          messages: [
            ...prev.messages,
            {
              sender: "bot",
              text: "Para ingressos do tipo Grupo, a quantidade mínima é 5 ingressos. Quantos ingressos deseja? (Mínimo 5)",
            },
          ],
          inputEnabled: true,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        step: "payment",
        type,
        quantity,
      }));
      showPaymentOptions(quantity, type);
    },
    [showPaymentOptions]
  );

  const selectPayment = useCallback(
    (payment, quantity, type) => {
      console.log(
        "selectPayment - payment:",
        payment,
        "type:",
        type,
        "quantity:",
        quantity
      ); // Log de depuração
      setState((prev) => ({
        ...prev,
        step: "summary",
        payment,
        quantity,
        type,
      }));

      const price = ticketPrices[type];
      const total = (quantity * price).toFixed(2);

      const summary = `
        🎟️ Resumo do Pedido 🎟️
        -------------------------
        • Quantidade: ${quantity} ingresso(s)
        • Tipo: ${getTicketLabel(type)}
        • Valor unitário: R$ ${price.toFixed(2)}
        • Total: R$ ${total}
        • Pagamento: ${payment}
        -------------------------
        Deseja finalizar e ser direcionado ao WhatsApp?
      `;

      addMessage("bot", summary, [
        {
          label: "✅ Sim, continuar",
          action: () => completePurchase(quantity, payment, type),
          event: "begin_checkout",
        },
        {
          label: "↩️ Voltar ao início",
          action: resetChat,
          event: "none",
        },
      ]);
    },
    [addMessage, resetChat, ticketPrices]
  );

  const completePurchase = useCallback(
    (quantity, payment, type) => {
      console.log(
        "completePurchase - type:",
        type,
        "quantity:",
        quantity,
        "payment:",
        payment
      ); // Log de depuração
      const price = ticketPrices[type];
      const total = (quantity * price).toFixed(2);

      const message = `Olá! Gostaria de comprar ingressos para o Congresso Autismo MA 2026:

🔹 Quantidade: ${quantity}
🔹 Tipo: ${getTicketLabel(type)}
🔹 Valor unitário: R$ ${price.toFixed(2)}
🔹 Total: R$ ${total}
🔹 Pagamento: ${payment}`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;

      window.open(whatsappUrl, "_blank");
      onClose();
    },
    [onClose, ticketPrices]
  );

  const handleSend = useCallback(() => {
    if (inputValue.trim() && state.inputEnabled) {
      const input = inputValue.trim();
      addMessage("user", input);
      setInputValue("");

      if (state.step === "quantity") {
        processInput(input);
      }
    }
  }, [inputValue, state.inputEnabled, state.step, addMessage, processInput]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter") handleSend();
    },
    [handleSend]
  );

  if (!isOpen) return null;

  return (
    <div className={styles.modal}>
      <div className={styles.chatbot}>
        <div className={styles.header}>
          <h3>
            Atendimento <FaWhatsapp />
          </h3>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.messages}>
          {state.messages.map((msg, index) => (
            <div
              key={index}
              className={
                msg.sender === "bot" ? styles.botMessage : styles.userMessage
              }
            >
              <p>{msg.text}</p>
              {msg.options && (
                <div className={styles.options}>
                  {msg.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={option.action}
                      className={styles.optionButton}
                      data-event={option.event}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputContainer}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              state.step === "quantity"
                ? "Digite a quantidade..."
                : "Aguardando seleção..."
            }
            disabled={!state.inputEnabled}
            className={styles.input}
            style={{ fontSize: "16px", touchAction: "manipulation" }} // Desativa zoom
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || !state.inputEnabled}
            className={styles.sendButton}
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
