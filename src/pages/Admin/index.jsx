// src/AdminDashboard.js
import React, { useState } from "react";
import styles from "./adminDashboard.module.css";
import DashboardSection from "../../components/admin/dashboard/DashboardSection";
import EmailSection from "../../components/admin/email/EmailSection";
import { IoExitOutline } from "react-icons/io5";
import {
  MdOutlineSpaceDashboard,
  MdOutlineMarkEmailRead,
} from "react-icons/md";

import useAuth from "../../data/hooks/useAuth";

import logo from "../../assets/logos/logo-no-text.png";

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  const { logout } = useAuth();

  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.aside}>
        <div className={styles.logoContainer}>
          <img src={logo} alt="Congresso Autismo MA" className={styles.logo} />
        </div>
        <nav>
          <ul>
            <li
              className={`${styles.navItem} ${
                activeSection === "dashboard" ? styles.active : ""
              }`}
              onClick={() => setActiveSection("dashboard")}
            >
              Dashboard <MdOutlineSpaceDashboard />
            </li>
            <li
              className={`${styles.navItem} ${
                activeSection === "emails" ? styles.active : ""
              }`}
              onClick={() => setActiveSection("emails")}
            >
              Emails <MdOutlineMarkEmailRead />
            </li>
          </ul>
          <button className={styles.exit} onClick={logout}>
            Sair <IoExitOutline />
          </button>
        </nav>
      </aside>
      <main className={styles.mainContent}>
        {activeSection === "dashboard" && <DashboardSection />}
        {activeSection === "emails" && <EmailSection />}
      </main>
    </div>
  );
};

export default AdminDashboard;
