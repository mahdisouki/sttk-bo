import { useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { createAdminApi } from "../lib/adminApi";
import { useQuery } from "../hooks/useQuery";
import { ApiError } from "../lib/api";
import { PageSkeleton } from "../components/PageSkeleton";

export default function SettingsPage() {
  const { authFetch } = useAuth();
  const api = useMemo(() => createAdminApi(authFetch), [authFetch]);
  const { data, loading, error, reload } = useQuery(async () => {
    const result = await api.settings();
    return result.data || [];
  }, [api]);
  const [busyKey, setBusyKey] = useState("");
  const [message, setMessage] = useState("");
  if (loading) return <PageSkeleton />;
  if (error) return <div className="error-note">{error}</div>;
  const map = Object.fromEntries((data || []).map((row: any) => [row.key, row.value]));
  async function save(key: string, value: unknown) {
    setBusyKey(key);
    setMessage("");
    try {
      await api.updateSetting(key, value);
      setMessage(`Paramètre ${key} enregistré`);
      reload();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Enregistrement impossible");
    } finally {
      setBusyKey("");
    }
  }
  return (
    <div className="settings-layout">
      <aside className="settings-nav">
        <button className="active">Paramètres API</button>
      </aside>
      <div className="stack">
        {message && <div className="success-note">{message}</div>}
        <section className="card form-card">
          <div className="card-head">
            <div>
              <h3>Règles de paiement</h3>
              <p>Valeurs lues et écrites directement dans l’API.</p>
            </div>
          </div>
          <div className="field-grid">
            <label>
              Délai paiement en ligne
              <input
                type="number"
                defaultValue={map.onlinePaymentMinutes ?? 15}
                onBlur={(e) => save("onlinePaymentMinutes", Number(e.target.value))}
              />
              <span className="input-unit">min</span>
            </label>
            <label>
              Délai paiement agence
              <input
                type="number"
                defaultValue={map.agencyPaymentHours ?? 48}
                onBlur={(e) => save("agencyPaymentHours", Number(e.target.value))}
              />
              <span className="input-unit">h</span>
            </label>
            <label>
              Maximum de bons par commande
              <input
                type="number"
                defaultValue={map.maxVouchersPerOrder ?? 500}
                onBlur={(e) => save("maxVouchersPerOrder", Number(e.target.value))}
              />
            </label>
            <label>
              Droit de timbre (millimes)
              <input
                type="number"
                defaultValue={map.stampDutyMillimes ?? 0}
                onBlur={(e) => save("stampDutyMillimes", Number(e.target.value))}
              />
            </label>
          </div>
          <div className="card-foot">
            <span>{busyKey ? `Enregistrement de ${busyKey}…` : "Modifications enregistrées au blur"}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
