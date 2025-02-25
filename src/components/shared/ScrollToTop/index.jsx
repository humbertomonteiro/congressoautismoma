import { useEffect, useState } from "react";
import styles from "./scrollToTop.module.css";
import { FaArrowAltCircleUp } from "react-icons/fa";

const ScrollToTop = () => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {showButton && (
        <button
          className={styles.button}
          onClick={scrollToTop}
          title="Clique para voltar ao topo da página."
        >
          <FaArrowAltCircleUp />
        </button>
      )}
    </>
  );
};

export default ScrollToTop;
