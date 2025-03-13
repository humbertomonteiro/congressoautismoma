// src/components/checkout/ParticipantsList.js
import styles from "./ParticipantsList.module.css";

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

    const newHalfTickets = updatedParticipants.reduce(
      (count, p) => count + (p.isHalfPrice ? 1 : 0),
      0
    );
    setHalfTickets(newHalfTickets);
  };

  return (
    <div className={styles.participantsList}>
      <h2>Participantes Adicionados</h2>
      <ul>
        {participants.map((participant, index) => (
          <li key={index} className={styles.participantItem}>
            <div className={styles.participantInfo}>
              <span>
                {participant.name} - {participant.email}
              </span>
              <span className={styles.ticketType}>
                {participant.isHalfPrice ? "(Meia)" : "(Inteira)"}
              </span>
            </div>
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
