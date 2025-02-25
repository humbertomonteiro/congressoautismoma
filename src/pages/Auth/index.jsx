import useAuth from "../../data/hooks/useAuth";
import { useState } from "react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, error } = useAuth();

  async function handleLogin(event) {
    event.preventDefault();
    await login(email, password);
  }

  return (
    <div>
      <h1>Área Administrativa Congresso Autismo MA</h1>
      <form onSubmit={handleLogin}>
        <label>
          <p>Email</p>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="text"
            required
          />
        </label>
        <label>
          <p>Senha</p>
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="password"
            required
          />
        </label>
        {error && <div className="">{error}</div>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Auth;
