import styles from "./topBar.module.css";

const TopBar = ({ text, action, textAction, linkAction, functionAction }) => {
  const handleViewItem = (itemId, itemName) => {
    window.dataLayer.push({
      event: "view_item",
      item_id: itemId,
      item_name: itemName,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div data-aos="fade-down" data-aos-delay="200" className={styles.container}>
      <span>{text}</span>
      {action === "link" ? (
        <a onClick={handleViewItem} href={linkAction}>
          {textAction}
        </a>
      ) : (
        <button onClick={functionAction}>{textAction}</button>
      )}
    </div>
  );
};

export default TopBar;
