import React, { useState } from "react";
import styles from "./participantsForm.module.css";

const ParticipantsForm = ({
  participants,
  setParticipants,
  ticketQuantity,
}) => {
  const [currentParticipant, setCurrentParticipant] = useState({
    name: "",
    email: "",
    cpf: "",
  });

  const handleInputChange = (field, value) => {
    setCurrentParticipant({
      ...currentParticipant,
      [field]: value,
    });
  };

  const handleAddParticipant = (e) => {
    e.preventDefault();
    if (participants.length >= ticketQuantity) {
      alert("Você já adicionou todos os participantes necessários!");
      return;
    }
    if (
      currentParticipant.name &&
      currentParticipant.email &&
      currentParticipant.cpf
    ) {
      setParticipants([...participants, currentParticipant]);
      setCurrentParticipant({ name: "", email: "", cpf: "" });
    } else {
      alert("Por favor, preencha todos os campos!");
    }
  };

  return (
    <div className={styles.participantForm}>
      <h2>
        Adicionar Participante ({participants.length + 1}/{ticketQuantity})
      </h2>
      <form className={styles.form} onSubmit={handleAddParticipant}>
        <label>
          <p>Nome completo</p>
          <input
            type="text"
            placeholder="Nome do participante"
            value={currentParticipant.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            required
          />
        </label>
        <label>
          <p>E-mail</p>
          <input
            type="email"
            placeholder="E-mail do participante"
            value={currentParticipant.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            required
          />
        </label>
        <label>
          <p>CPF</p>
          <input
            type="text"
            placeholder="CPF do participante"
            value={currentParticipant.cpf}
            onChange={(e) => handleInputChange("cpf", e.target.value)}
            required
          />
        </label>
        <button type="submit" className={styles.addButton}>
          Adicionar
        </button>
      </form>
    </div>
  );
};

export default ParticipantsForm;
