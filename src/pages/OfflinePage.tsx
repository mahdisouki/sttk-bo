import { useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { createAdminApi } from "../lib/adminApi";
import { ApiError } from "../lib/api";
import { useUiStore } from "../stores/uiStore";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";

export default function OfflinePage() {
  const openModal = useUiStore((s) => s.openModal);
  const { authFetch } = useAuth();
  const api = useMemo(() => createAdminApi(authFetch), [authFetch]);
  const [ids, setIds] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const publicIds = ids
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  async function submit() {
    setBusy(true);
    setError("");
    try {
      await api.markOffline(publicIds);
      openModal("offline");
      setIds("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Marquage impossible");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="offline-grid">
      <section className="card form-card">
        <span className="eyebrow">RATTRAPAGE HORS-LIGNE</span>
        <h3>Marquer des bons comme utilisés</h3>
        <p className="muted">
          Collez les identifiants publics collectés par la station. L’opération est atomique : si un
          identifiant échoue, aucun bon ne sera modifié.
        </p>
        {error && <div className="error-note">{error}</div>}
        <label>
          Identifiants publics
          <textarea className="ids" value={ids} onChange={(e) => setIds(e.target.value)} />
          <small>Un identifiant par ligne · {publicIds.length} détectés</small>
        </label>
        <Button disabled={busy || !publicIds.length} onClick={submit}>
          Marquer comme utilisés
        </Button>
      </section>
      <aside className="card guide">
        <span>
          <Icon name="cloud" />
        </span>
        <h3>Avant de continuer</h3>
        <ol>
          <li>Vérifiez que la période hors-ligne est terminée.</li>
          <li>Exportez les identifiants depuis l’appareil station.</li>
          <li>Chaque bon doit être disponible et non expiré.</li>
        </ol>
        <div className="notice mini">
          <Icon name="alert" />
          <p>
            Un bon déjà utilisé renverra l’erreur <code>already_used</code>.
          </p>
        </div>
      </aside>
    </div>
  );
}
