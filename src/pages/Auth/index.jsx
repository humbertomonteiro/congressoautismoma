// src/components/Auth.js
import useAuth from "../../data/hooks/useAuth";
import { useState } from "react";
import styles from "./auth.module.css";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, error } = useAuth();

  async function handleLogin(event) {
    event.preventDefault();
    await login(email, password);
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Área Administrativa</h1>
        <h2>Congresso Autismo MA</h2>
        <form onSubmit={handleLogin}>
          <label>
            <p>Email</p>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="text"
              required
              className={styles.input}
            />
          </label>
          <label>
            <p>Senha</p>
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type="password"
              required
              className={styles.input}
            />
          </label>
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" className={styles.loginButton}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
