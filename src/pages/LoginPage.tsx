import { useState, type FormEvent } from "react";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";

const coast =
  "https://images.unsplash.com/photo-1531649755688-af9ee584c794?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=85&w=1400";

export default function LoginPage() {
  const auth = useAuth();
  const [step, setStep] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("admin@mastervoyage.tn");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    try {
      if (step === "login") {
        await auth.login(email, password);
      } else {
        await auth.forgotPassword(email);
        setInfo("Si le compte existe, un e-mail a été envoyé.");
        setStep("login");
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Erreur";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <section
        className="auth-visual"
        style={{
          backgroundImage: `linear-gradient(180deg,rgba(12,30,124,.15),rgba(12,30,124,.88)),url(${coast})`,
        }}
      >
        <div className="brand brand-light">
          <img className="brand-logo" src="/logo-sttk.png" alt="STTK Korbous" />
        </div>
        <div className="auth-quote">
          <span className="eyebrow light">KORBOUS · TUNISIE</span>
          <h1>Le voyage commence par une opération bien orchestrée.</h1>
          <p>
            Une plateforme calme et précise pour gérer chaque bon, chaque partenaire et chaque
            visite.
          </p>
        </div>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-form">
          <span className="secure">
            <span></span> Espace sécurisé
          </span>
          <h2>{step === "login" ? "Bienvenue" : "Mot de passe oublié"}</h2>
          <p className="muted">
            {step === "login"
              ? "Connectez-vous avec un compte admin ou agent."
              : "Nous vous enverrons un lien sécurisé par e-mail."}
          </p>
          {error && <div className="error-note">{error}</div>}
          {info && <div className="success-note">{info}</div>}
          <form onSubmit={submit}>
            {step === "login" ? (
              <>
                <label>
                  Adresse e-mail
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </label>
                <label>
                  Mot de passe
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </label>
                <div className="form-row">
                  <span />
                  <button type="button" className="link" onClick={() => setStep("forgot")}>
                    Mot de passe oublié ?
                  </button>
                </div>
                <Button type="submit" disabled={busy}>
                  {busy ? "Connexion…" : "Se connecter"} <Icon name="arrow" size={16} />
                </Button>
              </>
            ) : (
              <>
                <label>
                  Adresse e-mail
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>
                <Button type="submit" disabled={busy}>
                  Envoyer le lien
                </Button>
                <button className="back-link" type="button" onClick={() => setStep("login")}>
                  Retour à la connexion
                </button>
              </>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
