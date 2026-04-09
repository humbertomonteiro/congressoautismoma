import styles from "./ParticipantsList.module.css";

const TICKET_TYPE_LABEL = {
  full: "Inteiro",
  half: "Meia-entrada",
  social: "Social",
};

const ParticipantsList = ({ participants, setParticipants }) => {
  const handleRemoveParticipant = (index) => {
    setParticipants((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.participantsList}>
      <h2>Participantes Adicionados</h2>
      <ul>
        {participants.map((participant, index) => (
          <li key={index} className={styles.participantItem}>
            <div className={styles.participantInfo}>
              <span>
                {participant.name} — {participant.email}
              </span>
              <span className={styles.ticketType}>
                {TICKET_TYPE_LABEL[participant.ticketType] || "Inteiro"}
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
