import { BrowserRouter } from "react-router-dom";

import Main from "./components/templates/Main";

import { useEffect } from "react";
import ScrollToTop from "./components/shared/ScrollToTop";

import Aos from "aos";
import "aos/dist/aos.css";

import { Toaster } from "react-hot-toast";
import RoutesApp from "./routes/RoutesApp";
import AuthProvider from "./data/contexts/AuthContext";

function App() {
  useEffect(() => {
    Aos.init({ duration: 800 });
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Toaster position="top-right" reverseOrder={false} />
        <Main>
          <RoutesApp />
        </Main>
        <div className="bubbles">
          {/* <img className="bg-top" src={bgTop} alt="Background Top" /> */}
          <div className="cube"></div>
          <div className="cube"></div>
          <div className="cube"></div>
          <div className="cube"></div>
          <div className="cube"></div>
          <div className="cube"></div>
          {/* <img className="bg-bottom" src={bgBottom} alt="Background Bottom" /> */}
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
