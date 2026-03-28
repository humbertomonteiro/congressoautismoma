import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import {
  Avatar,
  Chip,
  Typography,
  TextField,
  InputAdornment,
} from "@mui/material";
import { MdPerson, MdVerified, MdSearch } from "react-icons/md";
import { FaWhatsapp, FaPix } from "react-icons/fa6";
import styles from "./vendedoresCredenciados.module.css";

const VendedoresCredenciados = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(collection(db, "sellers"));
        setSellers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (_) {
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = sellers.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.document?.includes(search)
  );

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <MdVerified className={styles.heroIcon} />
        <h1 className={styles.heroTitle}>Vendedores Credenciados</h1>
        <p className={styles.heroSubtitle}>
          Verifique abaixo a lista oficial de vendedores autorizados pelo
          Congresso Autismo MA. Só adquira ingressos com vendedores presentes
          nessa lista.
        </p>
      </div>

      <div className={styles.content}>
        <TextField
          placeholder="Buscar por nome ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MdSearch />
              </InputAdornment>
            ),
          }}
          variant="outlined"
          fullWidth
        />

        {loading ? (
          <Typography className={styles.emptyMsg}>Carregando...</Typography>
        ) : filtered.length === 0 ? (
          <Typography className={styles.emptyMsg}>
            {search
              ? "Nenhum vendedor encontrado com essa busca."
              : "Nenhum vendedor credenciado no momento."}
          </Typography>
        ) : (
          <div className={styles.grid}>
            {filtered.map((seller) => (
              <div key={seller.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <Avatar
                    src={seller.photoBase64 || undefined}
                    className={styles.avatar}
                  >
                    {!seller.photoBase64 && <MdPerson size={36} />}
                  </Avatar>
                  <div className={styles.badge}>
                    <MdVerified /> Credenciado
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <h2 className={styles.sellerName}>{seller.name}</h2>
                  <p className={styles.sellerDoc}>CPF: {seller.document}</p>
                  <p className={styles.sellerEmail}>{seller.email}</p>

                  <div className={styles.chips}>
                    <Chip
                      icon={<FaWhatsapp style={{ color: "#25D366" }} />}
                      label={seller.phone}
                      variant="outlined"
                      size="small"
                      className={styles.chip}
                    />
                    {/* <Chip
                      icon={<FaPix style={{ color: "#32bcad" }} />}
                      label={`Pix: ${seller.pix}`}
                      variant="outlined"
                      size="small"
                      className={styles.chip}
                    /> */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.warning}>
          <strong>⚠️ Atenção:</strong> Não realize pagamentos para pessoas fora
          dessa lista. Em caso de dúvida, entre em contato diretamente conosco
          pelo{" "}
          <a
            href="https://wa.me/5598991058908"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp oficial
          </a>
          .
        </div>
      </div>
    </div>
  );
};

export default VendedoresCredenciados;
