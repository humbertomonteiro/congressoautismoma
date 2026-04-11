import { useState, useEffect } from "react";
import styles from "./adminDashboard.module.css";
import { IoExitOutline, IoMenuOutline } from "react-icons/io5";
import {
  MdOutlineSpaceDashboard,
  MdOutlineMarkEmailRead,
  MdOutlineBadge,
  MdOutlinePeopleAlt,
  MdOutlineLocalOffer,
  MdOutlineAccountBalance,
  MdOutlineQrCodeScanner,
  MdOutlineWorkspacePremium,
  MdOutlineShoppingCart,
} from "react-icons/md";
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  Box,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import useAuth from "../../data/hooks/useAuth";
import useRole from "../../data/hooks/useRole";
import logo from "../../assets/logos/logo.png";
import DashboardSection from "../../components/admin/dashboard/DashboardSection";
import EmailSection from "../../components/admin/email/EmailSection";
import AddManualPayment from "../../components/admin/dashboard/AddManualPayment";
import CertificateContainer from "../../components/certificateGenerator/CertificateContainer";
import Scanner from "../../components/admin/Scanner";
import SellerSection from "../../components/admin/SellerSection";
import UserManagementSection from "../../components/admin/UserManagementSection";
import CouponManagementSection from "../../components/admin/CouponManagementSection";
import CaixaSection from "../../components/admin/caixa/CaixaSection";
import { DashboardProvider } from "../../data/contexts/DashboardContext";
import { useSearchParams } from "react-router-dom";

const ROLE_LABELS = {
  adm: "Administrador",
  viewer: "Visualizador",
  scanner: "Scanner",
  vendedor: "Vendedor",
};

const AdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(
    searchParams.get("section") || "dashboard"
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { logout, user } = useAuth();
  const {
    canSeeDashboard,
    canSeeManualPayment,
    canSeeSellers,
    canSeeCertificates,
    canSeeAccreditation,
    canSeeEmails,
    canSeeUserManagement,
    canSeeCaixa,
    isScanner,
  } = useRole();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    if (isScanner) setActiveSection("accreditation");
  }, [isScanner]);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (isMobile) setIsDrawerOpen(false);
  };

  // Iniciais do nome para o avatar
  const initials = user?.name
    ? user.name.trim().split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "?";

  const NavItem = ({ section, icon, label, visible = true }) => {
    if (!visible) return null;
    return (
      <button
        className={`${styles.navItem} ${activeSection === section ? styles.active : ""}`}
        onClick={() => handleSectionChange(section)}
      >
        <span className={styles.navItemIcon}>{icon}</span>
        {label}
      </button>
    );
  };

  const SectionLabel = ({ label, visible = true }) => {
    if (!visible) return null;
    return <p className={styles.sectionLabel}>{label}</p>;
  };

  // Decide quais grupos de seções ficam visíveis
  const hasOperacional = canSeeDashboard || canSeeManualPayment || canSeeAccreditation;
  const hasFinanceiro = canSeeCaixa;
  const hasGestao = canSeeSellers || canSeeEmails || canSeeCertificates;
  const hasAdmin = canSeeUserManagement;

  const drawerContent = (
    <Box className={styles.drawerContent}>
      {/* Usuário logado */}
      {user && (
        <div className={styles.userBadge}>
          <div className={styles.userAvatar}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div className={styles.userName}>{user.name}</div>
            <div className={styles.userRole}>
              {ROLE_LABELS[user.role] || user.role}
            </div>
          </div>
        </div>
      )}

      {/* Nav agrupada com scroll */}
      <div className={styles.navScroll}>
        <SectionLabel label="Operacional" visible={hasOperacional} />
        <NavItem section="dashboard" icon={<MdOutlineSpaceDashboard size={18} />} label="Dashboard" visible={canSeeDashboard} />
        <NavItem section="checkout-manual" icon={<MdOutlineShoppingCart size={18} />} label="Add Checkout" visible={canSeeManualPayment} />
        <NavItem section="accreditation" icon={<MdOutlineQrCodeScanner size={18} />} label="Credenciamento" visible={canSeeAccreditation} />

        {hasFinanceiro && <div className={styles.navDivider} />}
        <SectionLabel label="Financeiro" visible={hasFinanceiro} />
        <NavItem section="caixa" icon={<MdOutlineAccountBalance size={18} />} label="Caixa do Evento" visible={canSeeCaixa} />

        {hasGestao && <div className={styles.navDivider} />}
        <SectionLabel label="Gestão" visible={hasGestao} />
        <NavItem section="sellers" icon={<MdOutlineBadge size={18} />} label="Vendedores" visible={canSeeSellers} />
        <NavItem section="emails" icon={<MdOutlineMarkEmailRead size={18} />} label="E-mails" visible={canSeeEmails} />
        <NavItem section="certificate-generator" icon={<MdOutlineWorkspacePremium size={18} />} label="Certificados" visible={canSeeCertificates} />

        {hasAdmin && <div className={styles.navDivider} />}
        <SectionLabel label="Administração" visible={hasAdmin} />
        <NavItem section="coupons" icon={<MdOutlineLocalOffer size={18} />} label="Cupons" visible={canSeeUserManagement} />
        <NavItem section="users" icon={<MdOutlinePeopleAlt size={18} />} label="Usuários" visible={canSeeUserManagement} />
      </div>

      {/* Logout fixo no rodapé */}
      <div className={styles.logoutArea}>
        <button className={styles.logoutBtn} onClick={logout}>
          <IoExitOutline size={18} />
          Sair
        </button>
      </div>
    </Box>
  );

  return (
    <DashboardProvider>
      <Box className={styles.dashboardContainer}>
        {/* AppBar mobile */}
        {isMobile && (
          <>
            <AppBar position="fixed" className={styles.appBar}>
              <Toolbar sx={{ minHeight: "56px !important" }}>
                <img src={logo} alt="Congresso Autismo MA" className={styles.appBarLogo} />
                <IconButton
                  edge="end"
                  color="inherit"
                  onClick={() => setIsDrawerOpen(true)}
                  sx={{ ml: "auto" }}
                >
                  <IoMenuOutline size={22} />
                </IconButton>
              </Toolbar>
            </AppBar>
            <Drawer
              anchor="left"
              open={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              PaperProps={{ sx: { width: 240, backgroundColor: "#0f172a", border: "none" } }}
            >
              {drawerContent}
            </Drawer>
          </>
        )}

        {/* Sidebar desktop */}
        {!isMobile && (
          <Box component="aside" className={styles.aside}>
            <div className={styles.logoContainer}>
              <img src={logo} alt="Congresso Autismo MA" className={styles.logo} />
            </div>
            {drawerContent}
          </Box>
        )}

        {/* Conteúdo principal */}
        <Box component="main" className={styles.mainContent}>
          {activeSection === "dashboard" && canSeeDashboard && <DashboardSection />}
          {activeSection === "checkout-manual" && canSeeManualPayment && <AddManualPayment />}
          {activeSection === "emails" && canSeeEmails && <EmailSection />}
          {activeSection === "certificate-generator" && canSeeCertificates && <CertificateContainer />}
          {activeSection === "accreditation" && canSeeAccreditation && <Scanner />}
          {activeSection === "sellers" && canSeeSellers && <SellerSection />}
          {activeSection === "caixa" && canSeeCaixa && <CaixaSection />}
          {activeSection === "coupons" && canSeeUserManagement && <CouponManagementSection />}
          {activeSection === "users" && canSeeUserManagement && <UserManagementSection />}
        </Box>
      </Box>
    </DashboardProvider>
  );
};

export default AdminDashboard;
