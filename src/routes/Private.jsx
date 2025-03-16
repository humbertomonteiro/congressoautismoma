import { useContext } from "react";
import { AuthContext } from "../data/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Loading from "../components/shared/Loading";

export default function Private({ children }) {
  const { signed, loading } = useContext(AuthContext);

  if (loading) return <Loading />;

  if (!signed) {
    return <Navigate to="/login" />;
  }

  return children;
}
