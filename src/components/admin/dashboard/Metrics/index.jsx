import {
  Box,
  Card,
  CardContent,
  Typography,
  Modal,
  IconButton,
  Button,
  Divider,
} from "@mui/material";
import { IoTicketOutline } from "react-icons/io5";
import {
  RiMoneyDollarCircleLine,
  RiMoneyDollarCircleFill,
} from "react-icons/ri";
import { HiDotsVertical } from "react-icons/hi";
import { useState } from "react";

// ── tokens ────────────────────────────────────────────────────────────────────
const T = {
  textPrimary: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  blue: "#3b82f6",
  border: "#e2e8f0",
  cardShadow: "0 1px 4px rgba(0,0,0,0.06)",
};

const rowStyle = { display: "flex", justifyContent: "space-between", mb: 0.75 };

const MetricsDetailsModal = ({
  open, onClose, title, metrics, formatToBrazilianCurrency, type,
}) => {
  const m = {
    successTicketsFull: metrics?.successTicketsFull || 0,
    successTicketsHalf: metrics?.successTicketsHalf || 0,
    successTicketsSocial: metrics?.successTicketsSocial || 0,
    successValueGross: metrics?.successValueGross || 0,
    successValueNet: metrics?.successValueNet || 0,
    totalGrossMasterVisa: metrics?.totalGrossMasterVisa || 0,
    totalFeeMasterVisa: metrics?.totalFeeMasterVisa || 0,
    totalGrossPix: metrics?.totalGrossPix || 0,
    totalFeePix: metrics?.totalFeePix || 0,
    totalGrossBoleto: metrics?.totalGrossBoleto || 0,
    totalFeeBoleto: metrics?.totalFeeBoleto || 0,
    totalGrossElo: metrics?.totalGrossElo || 0,
    totalFeeElo: metrics?.totalFeeElo || 0,
    totalGrossOthers: metrics?.totalGrossOthers || 0,
    totalTicketsMasterVisa: metrics?.totalTicketsMasterVisa || 0,
    totalTicketsPix: metrics?.totalTicketsPix || 0,
    totalTicketsBoleto: metrics?.totalTicketsBoleto || 0,
    totalTicketsElo: metrics?.totalTicketsElo || 0,
    totalTicketsOthers: metrics?.totalTicketsOthers || 0,
  };

  const totalTickets = m.successTicketsFull + m.successTicketsHalf + m.successTicketsSocial;

  const Row = ({ label, value }) => (
    <Box sx={rowStyle}>
      <Typography sx={{ color: T.textSecondary, fontSize: "0.85rem" }}>{label}</Typography>
      <Typography sx={{ color: T.textPrimary, fontWeight: 600, fontSize: "0.85rem" }}>{value}</Typography>
    </Box>
  );

  const SectionTitle = ({ children }) => (
    <Typography sx={{ color: T.blue, fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.5, mt: 0.5 }}>
      {children}
    </Typography>
  );

  const renderContent = () => {
    switch (type) {
      case "tickets":
        return (
          <>
            <SectionTitle>Por Tipo</SectionTitle>
            <Row label="Inteiro" value={m.successTicketsFull} />
            <Row label="Meia-entrada" value={m.successTicketsHalf} />
            <Row label="Social" value={m.successTicketsSocial} />
            <Box sx={{ ...rowStyle, mt: 1, pt: 1, borderTop: `1px solid ${T.border}` }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: T.textPrimary }}>Total</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: T.textPrimary }}>{totalTickets}</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <SectionTitle>Por Método de Pagamento</SectionTitle>
            <Row label="PIX" value={m.totalTicketsPix} />
            <Row label="Boleto" value={m.totalTicketsBoleto} />
            <Row label="Visa / MasterCard" value={m.totalTicketsMasterVisa} />
            <Row label="Elo" value={m.totalTicketsElo} />
            <Row label="Outros" value={m.totalTicketsOthers} />
          </>
        );
      case "gross":
        return (
          <>
            <SectionTitle>Taxas por Método</SectionTitle>
            <Row label="PIX" value={formatToBrazilianCurrency(m.totalFeePix)} />
            <Row label="Boleto" value={formatToBrazilianCurrency(m.totalFeeBoleto)} />
            <Row label="Visa / MasterCard" value={formatToBrazilianCurrency(m.totalFeeMasterVisa)} />
            <Row label="Elo" value={formatToBrazilianCurrency(m.totalFeeElo)} />
            <Row label="Outros" value={formatToBrazilianCurrency(
              m.successValueGross - m.successValueNet -
              (m.totalFeePix + m.totalFeeBoleto + m.totalFeeMasterVisa + m.totalFeeElo)
            )} />
            <Box sx={{ ...rowStyle, mt: 1, pt: 1, borderTop: `1px solid ${T.border}` }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: T.textPrimary }}>Total de Taxas</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#dc2626" }}>
                {formatToBrazilianCurrency(m.successValueGross - m.successValueNet)}
              </Typography>
            </Box>
          </>
        );
      case "net":
        return (
          <>
            <SectionTitle>Líquido por Método</SectionTitle>
            <Row label="PIX" value={formatToBrazilianCurrency(m.totalGrossPix - m.totalFeePix)} />
            <Row label="Boleto" value={formatToBrazilianCurrency(m.totalGrossBoleto - m.totalFeeBoleto)} />
            <Row label="Visa / MasterCard" value={formatToBrazilianCurrency(m.totalGrossMasterVisa - m.totalFeeMasterVisa)} />
            <Row label="Elo" value={formatToBrazilianCurrency(m.totalGrossElo - m.totalFeeElo)} />
            <Row label="Outros" value={formatToBrazilianCurrency(
              m.totalGrossOthers -
              (m.successValueGross - m.successValueNet -
                (m.totalFeePix + m.totalFeeBoleto + m.totalFeeMasterVisa + m.totalFeeElo))
            )} />
            <Box sx={{ ...rowStyle, mt: 1, pt: 1, borderTop: `1px solid ${T.border}` }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: T.textPrimary }}>Total Líquido</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#16a34a" }}>
                {formatToBrazilianCurrency(m.successValueNet)}
              </Typography>
            </Box>
          </>
        );
      default:
        return <Typography sx={{ color: T.textMuted }}>Nenhuma informação disponível.</Typography>;
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 380, maxWidth: "90%",
        bgcolor: "#fff", borderRadius: "14px",
        border: `1px solid ${T.border}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        p: 3, maxHeight: "85vh", overflowY: "auto",
      }}>
        <Typography sx={{ color: T.textPrimary, fontWeight: 700, fontSize: "1rem", mb: 2.5 }}>
          {title || "Detalhes"}
        </Typography>
        {renderContent()}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button variant="outlined" onClick={onClose} sx={{
            borderColor: T.border, color: T.textSecondary,
            textTransform: "none", fontSize: "0.85rem",
            "&:hover": { borderColor: T.blue, color: T.blue, backgroundColor: "#eff6ff" },
          }}>
            Fechar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

// ── MetricCard ────────────────────────────────────────────────────────────────
const MetricCard = ({ icon, iconBg, label, value, sub, onDetail }) => (
  <Card sx={{
    flex: "1 1 28%", minWidth: "220px",
    backgroundColor: "#fff", borderRadius: "12px",
    border: `1px solid ${T.border}`, boxShadow: T.cardShadow,
    position: "relative",
  }}>
    <CardContent sx={{ py: 2.5, px: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: "10px",
          backgroundColor: iconBg, display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {icon}
        </Box>
        <IconButton size="small" onClick={onDetail} sx={{ color: T.textMuted, mt: -0.5, mr: -0.5 }}>
          <HiDotsVertical size={16} />
        </IconButton>
      </Box>
      <Typography sx={{ color: T.textMuted, fontSize: "0.78rem", mt: 1.5, fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography sx={{ color: T.textPrimary, fontWeight: 700, fontSize: "1.6rem", lineHeight: 1.1, mt: 0.25 }}>
        {value}
      </Typography>
      {sub && (
        <Typography sx={{ color: T.textMuted, fontSize: "0.73rem", mt: 0.5 }}>
          {sub}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// ── Metrics ───────────────────────────────────────────────────────────────────
const Metrics = ({ metrics, formatToBrazilianCurrency }) => {
  const [openModal, setOpenModal] = useState(null);

  const m = metrics || {
    successTicketsFull: 0, successTicketsHalf: 0, successTicketsSocial: 0,
    successValueGross: 0, successValueNet: 0,
    totalGrossMasterVisa: 0, totalFeeMasterVisa: 0,
    totalGrossPix: 0, totalFeePix: 0,
    totalGrossBoleto: 0, totalFeeBoleto: 0,
    totalGrossElo: 0, totalFeeElo: 0, totalGrossOthers: 0,
    totalTicketsMasterVisa: 0, totalTicketsPix: 0,
    totalTicketsBoleto: 0, totalTicketsElo: 0, totalTicketsOthers: 0,
  };

  const totalTickets = m.successTicketsFull + m.successTicketsHalf + m.successTicketsSocial;

  const modalTitles = {
    tickets: "Ingressos",
    gross: "Valor Bruto",
    net: "Valor Líquido",
  };

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
      <MetricCard
        iconBg="#eff6ff"
        icon={<IoTicketOutline size={22} color={T.blue} />}
        label="Total de Ingressos"
        value={totalTickets}
        sub={`${m.successTicketsFull} inteiros · ${m.successTicketsHalf} meias · ${m.successTicketsSocial} sociais`}
        onDetail={() => setOpenModal("tickets")}
      />
      <MetricCard
        iconBg="#fffbeb"
        icon={<RiMoneyDollarCircleLine size={22} color="#d97706" />}
        label="Valor Bruto"
        value={formatToBrazilianCurrency(m.successValueGross)}
        sub={`Taxas: ${formatToBrazilianCurrency(m.successValueGross - m.successValueNet)}`}
        onDetail={() => setOpenModal("gross")}
      />
      <MetricCard
        iconBg="#f0fdf4"
        icon={<RiMoneyDollarCircleFill size={22} color="#16a34a" />}
        label="Valor Líquido"
        value={formatToBrazilianCurrency(m.successValueNet)}
        sub="Bruto menos taxas"
        onDetail={() => setOpenModal("net")}
      />

      {openModal && (
        <MetricsDetailsModal
          open={!!openModal}
          onClose={() => setOpenModal(null)}
          title={modalTitles[openModal]}
          metrics={metrics}
          formatToBrazilianCurrency={formatToBrazilianCurrency}
          type={openModal}
        />
      )}
    </Box>
  );
};

export default Metrics;
