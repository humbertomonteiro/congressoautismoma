import React from "react";
import styles from "./ParticipantsList.module.css"; // Presumo que exista

const ParticipantsList = ({
  participants,
  setParticipants,
  halfTickets,
  setHalfTickets,
}) => {
  const handleRemoveParticipant = (index) => {
    const participantToRemove = participants[index];
    const updatedParticipants = participants.filter((_, i) => i !== index);
    setParticipants(updatedParticipants);

    if (participantToRemove.isHalfPrice) {
      setHalfTickets((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <div className={styles.container}>
      <h2>Participantes Adicionados</h2>
      <ul>
        {participants.map((participant, index) => (
          <li key={index} className={styles.participantItem}>
            <span>
              {participant.name} - {participant.cpf}{" "}
              {participant.isHalfPrice ? "(Meia)" : ""}
            </span>
            <button
              onClick={() => handleRemoveParticipant(index)}
              className={styles.removeButton}
            >
              Remover
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ParticipantsList;
