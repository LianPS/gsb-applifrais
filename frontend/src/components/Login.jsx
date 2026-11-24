import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthAPI, setSession } from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("bunisset@gsb.fr");
  const [password, setPassword] = useState("gsb123");
  const [erreur, setErreur] = useState(null);
  const nav = useNavigate();

  async function soumettre(e) {
    e.preventDefault();
    setErreur(null);
    try {
      const { token, visiteur } = await AuthAPI.login(email, password);
      setSession(token, visiteur);
      nav("/");
    } catch (err) {
      setErreur(err.message);
    }
  }

  return (
    <form className="login" onSubmit={soumettre}>
      <h1>GSB AppliFrais</h1>
      <label>Email
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>Mot de passe
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {erreur && <p className="erreur">{erreur}</p>}
      <button>Se connecter</button>
    </form>
  );
}