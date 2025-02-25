import { createContext, useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import FirebaseAuth from "../classes/FirebaseAuth";

export const AuthContext = createContext({});

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null > null);
  const [error, setError] = useState(null > null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true);
      const auth = new FirebaseAuth();

      try {
        const currentUser = await auth.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Erro ao obter usuário atual:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  async function login(email, password) {
    try {
      const authentication = new FirebaseAuth();
      const user = await authentication.login(email, password);
      setUser(user);
      navigate("/dashboard");
    } catch (error) {
      console.error("Erro ao logar:", error);
      setError("Erro ao logar, " + error);
    }
  }

  async function register(name, email, password) {
    try {
      const authentication = new FirebaseAuth();
      const user = await authentication.register(name, email, password);
      setUser(user);
      navigate("/dashboard");
    } catch (error) {
      console.log("Erro ao criar conta," + error);
      setError("Error ao criar conta, " + error);
    }
  }

  async function logout() {
    try {
      const authentication = new FirebaseAuth();
      await authentication.logout();
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.log("Error ao deslogar, " + error);
      setError("Error ao deslogar, " + error);
    }
  }

  if (loading) return <p className="">Carregando...</p>;

  return (
    <AuthContext.Provider
      value={{
        login,
        register,
        logout,
        error,
        user,
        signed: !!user,
        setUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
