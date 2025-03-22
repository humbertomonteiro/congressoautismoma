import React, { createContext, useContext } from "react";
import useDashboardData from "../hooks/useDashboardData"; // Ajuste o caminho

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const dashboardData = useDashboardData();
  return (
    <DashboardContext.Provider value={dashboardData}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};
