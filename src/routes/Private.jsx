import { useContext } from "react";
import { AuthContext } from "../data/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function Private({ children }) {
  const { signed, loading } = useContext(AuthContext);

  if (loading) {
    return <div> Carregando </div>;
  }

  if (!signed) {
    return <Navigate to="/login" />;
  }

  return children;
}
