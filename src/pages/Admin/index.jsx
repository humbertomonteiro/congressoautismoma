import React, { useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import styles from "./adminDashboard.module.css";
import DashboardSection from "../../components/admin/DashboardSection";
import EmailSection from "../../components/admin/EmailSection";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#1e1e1e",
      paper: "#2c2c2c",
    },
    text: {
      primary: "#ffffff",
      secondary: "#b0b0b0",
    },
    primary: {
      main: "#4a90e2",
    },
  },
  components: {
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: "#333333",
          color: "#ffffff",
        },
        icon: {
          color: "#ffffff",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputBase-root": {
            backgroundColor: "#333333",
            color: "#ffffff",
          },
          "& .MuiInputLabel-root": {
            color: "#b0b0b0",
          },
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "#555555",
            },
            "&:hover fieldset": {
              borderColor: "#4a90e2",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#4a90e2",
            },
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: "#2c2c2c",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          color: "#ffffff",
          borderBottom: "1px solid #444444",
        },
        head: {
          backgroundColor: "#1e1e1e",
          color: "#ffffff",
          fontWeight: "bold",
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          backgroundColor: "#2c2c2c",
          color: "#ffffff",
        },
      },
    },
  },
});

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  return (
    <ThemeProvider theme={darkTheme}>
      <div className={styles.dashboardContainer}>
        <aside className={styles.aside}>
          <h2>Admin</h2>
          <nav>
            <ul>
              <li
                className={activeSection === "dashboard" ? styles.active : ""}
                onClick={() => setActiveSection("dashboard")}
              >
                Dashboard
              </li>
              <li
                className={activeSection === "emails" ? styles.active : ""}
                onClick={() => setActiveSection("emails")}
              >
                Emails
              </li>
            </ul>
          </nav>
        </aside>
        <main className={styles.mainContent}>
          {activeSection === "dashboard" && <DashboardSection />}
          {activeSection === "emails" && <EmailSection />}
        </main>
      </div>
    </ThemeProvider>
  );
};

export default AdminDashboard;
