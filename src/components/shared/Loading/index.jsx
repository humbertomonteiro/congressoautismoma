import "./loading.css";

const Loading = () => {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="spinner-circle"></div>
        <div className="spinner-circle spinner-circle-delay"></div>
      </div>
      <p className="loading-text">Preparando sua experiência...</p>
    </div>
  );
};

export default Loading;
