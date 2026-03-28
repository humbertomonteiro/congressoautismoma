import { useState } from "react";
import styles from "./adminDashboard.module.css";
import { IoExitOutline, IoMenuOutline } from "react-icons/io5";
import {
  MdOutlineSpaceDashboard,
  MdOutlineMarkEmailRead,
  MdOutlineBadge,
} from "react-icons/md";
import { IoBagCheckOutline } from "react-icons/io5";
import { MdOutlineQrCode } from "react-icons/md";
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import useAuth from "../../data/hooks/useAuth";
import logo from "../../assets/logos/logo-no-text.png";
import DashboardSection from "../../components/admin/dashboard/DashboardSection";
import EmailSection from "../../components/admin/email/EmailSection";
import AddManualPayment from "../../components/admin/dashboard/AddManualPayment";
import CertificateContainer from "../../components/certificateGenerator/CertificateContainer";
import Scanner from "../../components/admin/Scanner";
import SellerSection from "../../components/admin/SellerSection";

import { DashboardProvider } from "../../data/contexts/DashboardContext";

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (isMobile) setIsDrawerOpen(false);
  };

  const drawerContent = (
    <Box className={styles.drawerContent}>
      <List>
        <ListItem
          button
          className={`${styles.navItem} ${
            activeSection === "dashboard" ? styles.active : ""
          }`}
          onClick={() => handleSectionChange("dashboard")}
        >
          <ListItemIcon>
            <MdOutlineSpaceDashboard />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>

        <ListItem
          button
          className={`${styles.navItem} ${
            activeSection === "checkout-manual" ? styles.active : ""
          }`}
          onClick={() => handleSectionChange("checkout-manual")}
        >
          <ListItemIcon>
            <IoBagCheckOutline />
          </ListItemIcon>
          <ListItemText primary="Add Checkout" />
        </ListItem>

        <ListItem
          button
          className={`${styles.navItem} ${
            activeSection === "sellers" ? styles.active : ""
          }`}
          onClick={() => handleSectionChange("sellers")}
        >
          <ListItemIcon>
            <MdOutlineBadge />
          </ListItemIcon>
          <ListItemText primary="Vendedores" />
        </ListItem>

        <ListItem
          button
          className={`${styles.navItem} ${
            activeSection === "certificate-generator" ? styles.active : ""
          }`}
          onClick={() => handleSectionChange("certificate-generator")}
        >
          <ListItemIcon>
            <IoBagCheckOutline />
          </ListItemIcon>
          <ListItemText primary="Certificados" />
        </ListItem>

        <ListItem
          button
          className={`${styles.navItem} ${
            activeSection === "accreditation" ? styles.active : ""
          }`}
          onClick={() => handleSectionChange("accreditation")}
        >
          <ListItemIcon>
            <MdOutlineQrCode />
          </ListItemIcon>
          <ListItemText primary="Credenciamento" />
        </ListItem>

        <ListItem
          button
          className={`${styles.navItem} ${
            activeSection === "emails" ? styles.active : ""
          }`}
          onClick={() => handleSectionChange("emails")}
        >
          <ListItemIcon>
            <MdOutlineMarkEmailRead />
          </ListItemIcon>
          <ListItemText primary="Emails" />
        </ListItem>

        <ListItem onClick={logout} className={styles.navItem} data-exit="true">
          <ListItemIcon>
            <IoExitOutline />
          </ListItemIcon>
          <ListItemText primary="Sair" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <DashboardProvider>
      <Box className={styles.dashboardContainer}>
        {/* Header fixo no mobile */}
        {isMobile && (
          <>
            <AppBar position="fixed" className={styles.appBar}>
              <Toolbar>
                <Box className={styles.logoContainer}>
                  <img
                    src={logo}
                    alt="Congresso Autismo MA"
                    className={styles.logo}
                  />
                </Box>
                <IconButton
                  edge="end"
                  color="inherit"
                  onClick={toggleDrawer}
                  sx={{ ml: "auto" }}
                >
                  <IoMenuOutline />
                </IconButton>
              </Toolbar>
            </AppBar>
            <Drawer
              anchor="left"
              open={isDrawerOpen}
              onClose={toggleDrawer}
              PaperProps={{ sx: { width: 250 } }}
            >
              {drawerContent}
            </Drawer>
          </>
        )}

        {/* Sidebar fixa no desktop */}
        {!isMobile && (
          <Box component="aside" className={styles.aside}>
            <Box className={styles.logoContainer}>
              <img
                src={logo}
                alt="Congresso Autismo MA"
                className={styles.logo}
              />
            </Box>
            {drawerContent}
          </Box>
        )}

        {/* Conteúdo principal */}
        <Box component="main" className={styles.mainContent}>
          {activeSection === "dashboard" && <DashboardSection />}
          {activeSection === "checkout-manual" && <AddManualPayment />}
          {activeSection === "emails" && <EmailSection />}
          {activeSection === "certificate-generator" && (
            <CertificateContainer />
          )}
          {activeSection === "accreditation" && <Scanner />}
          {activeSection === "sellers" && <SellerSection />}
        </Box>
      </Box>
    </DashboardProvider>
  );
};

export default AdminDashboard;
