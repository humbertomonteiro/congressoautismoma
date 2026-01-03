import TopBar from "../../components/sections/TopBar";
import Header from "../../components/templates/Header";
import OurMission from "../../components/sections/OurMission";
import Tickets from "../../components/sections/Tickets";
import CarouselSimple from "../../components/shared/CarouselSimple";
import { itemsSpeakers } from "../../data/constants/Speakers";
import PrivilegeOfParticipating from "../../components/sections/PrivilegeOfParticipating";
import Testimonials from "../../components/sections/Testimonials";
import CarouselScrollInfinit from "../../components/shared/CarouselScrollInfinit";
import HalfiPrice from "../../components/sections/HalfPrice";
import Support from "../../components/sections/Support";
import BeSupport from "../../components/sections/BeSupport";
import Local from "../../components/sections/Local";
import Questions from "../../components/sections/Questions";
import Politic from "../../components/sections/Politic";
import Footer from "../../components/templates/Footer";

import CertificateHome from "../../components/certificateGenerator/CertificateHome";

import { useState, useEffect } from "react";
import ButtonWhatsapp from "../../components/sections/ButtonWhatsapp";
// import Timeline from "../../components/sections/Timeline";

const Home = ({ wpp }) => {
  const [visibleItems, setVisibleItems] = useState(4);

  const updateVisibleItems = () => {
    if (window.innerWidth <= 768) {
      setVisibleItems(2);
    } else {
      setVisibleItems(4);
    }
  };

  useEffect(() => {
    updateVisibleItems();
    window.addEventListener("resize", updateVisibleItems);
    return () => window.removeEventListener("resize", updateVisibleItems);
  }, []);
  return (
    <div>
      <TopBar
        // text={"INFELIZMENTE OS INGRESSOS ESTÃO ESGOTADOS!"}
        text={"Pré-venda liberada! Aproveite o menor preço!"}
        action={"link"}
        textAction={"COMPRAR INGRESSO"}
        // textAction="INGRESSOS ESGOTADOS"
        linkAction={"#tickets"}
      />
      <Header />
      <OurMission />
      <Tickets wpp={wpp} />
      {/* <CarouselSimple
        slides={itemsSpeakers}
        numberSlidesView={visibleItems - 1}
        textTitle="Conheça nossos palestrantes"
      /> */}
      <PrivilegeOfParticipating />
      <Testimonials />
      <CarouselScrollInfinit />
      {/* <HalfiPrice wpp={wpp} /> */}
      <Support />
      {/* <Timeline /> */}
      <BeSupport />
      {/* <Local /> */}
      <CertificateHome />
      <Questions />
      <Politic />
      <Footer />
      {!wpp && <ButtonWhatsapp />}
    </div>
  );
};

export default Home;
