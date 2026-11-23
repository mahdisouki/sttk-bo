import { useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { createAdminApi } from "../lib/adminApi";
import { useQuery } from "../hooks/useQuery";
import { ApiError } from "../lib/api";
import { todayTunisLabel } from "../lib/format";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { PageSkeleton } from "../components/PageSkeleton";
import { Status } from "../components/Status";

function currentMonth() {
  return todayTunisLabel().slice(0, 7);
}

function shiftMonth(month: string, delta: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const next = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthTitle(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-TN", { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(year, monthNumber - 1, 1)),
  );
}

function weekdayLabel(iso: string) {
  return new Intl.DateTimeFormat("fr-TN", { weekday: "long", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

export default function AvailabilityPage({ role }: { role: "admin" | "agent" }) {
  const { authFetch } = useAuth();
  const api = useMemo(() => createAdminApi(authFetch), [authFetch]);
  const typesQuery = useQuery(async () => {
    const result = await api.voucherTypes();
    return result.data || [];
  }, [api]);
  const [voucherId, setVoucherId] = useState("");
  const [month, setMonth] = useState(currentMonth);
  const [busyDay, setBusyDay] = useState("");
  const [monthQuantity, setMonthQuantity] = useState("");
  const [filling, setFilling] = useState(false);
  const [notice, setNotice] = useState("");
  const selectedId = voucherId || String(typesQuery.data?.[0]?._id || typesQuery.data?.[0]?.id || "");
  const daysQuery = useQuery(async () => {
    if (!selectedId) return [];
    const result = await api.availability(selectedId, month);
    return result.data || [];
  }, [api, selectedId, month]);

  async function saveQuota(day: string, current: number | null, raw: string) {
    if (role !== "admin") return;
    const text = raw.trim();
    const quota = text === "" ? null : Number(text);
    if (quota !== null && (!Number.isInteger(quota) || quota < 0)) {
      setNotice("La quantité doit être un entier positif, ou vide pour illimité.");
      return;
    }
    if (quota === current) return;
    setBusyDay(day);
    setNotice("");
    try {
      await api.setAvailability({ voucherTypeId: selectedId, day, quota });
      daysQuery.reload();
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "Quota impossible à enregistrer");
    } finally {
      setBusyDay("");
    }
  }

  async function applyMonth() {
    if (role !== "admin" || !selectedId) return;
    const text = monthQuantity.trim();
    const quota = text === "" ? null : Number(text);
    if (quota !== null && (!Number.isInteger(quota) || quota < 0)) {
      setNotice("La quantité doit être un entier positif, ou vide pour illimité.");
      return;
    }
    setFilling(true);
    setNotice("");
    try {
      await api.setMonthQuota({ voucherTypeId: selectedId, month, quota });
      daysQuery.reload();
    } catch (err) {
      const day = err instanceof ApiError && Array.isArray(err.fields) ? err.fields[0]?.day : "";
      const message = err instanceof ApiError ? err.message : "Application impossible";
      setNotice(day ? `${message} (${day}).` : message);
    } finally {
      setFilling(false);
    }
  }

  async function toggleBlock(day: string, blocked: boolean) {
    setBusyDay(day);
    setNotice("");
    try {
      await api.blockDay({ voucherTypeId: selectedId, day, blocked });
      daysQuery.reload();
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "Fermeture impossible");
    } finally {
      setBusyDay("");
    }
  }

  if (typesQuery.loading) return <PageSkeleton />;
  if (typesQuery.error) return <div className="error-note">{typesQuery.error}</div>;
  const types = typesQuery.data || [];
  return (
    <div className="stack">
      <div className="toolbar">
        <select
          className="filter wide"
          value={selectedId}
          onChange={(e) => setVoucherId(e.target.value)}
          disabled={!types.length}
        >
          {!types.length && <option value="">Aucun bon</option>}
          {types.map((item: any) => (
            <option key={String(item._id || item.id)} value={String(item._id || item.id)}>
              {item.name || item.slug}
            </option>
          ))}
        </select>
        <div className="month">
          <button type="button" onClick={() => setMonth((value) => shiftMonth(value, -1))} aria-label="Mois précédent">
            ‹
          </button>
          <b>{monthTitle(month)}</b>
          <button type="button" onClick={() => setMonth((value) => shiftMonth(value, 1))} aria-label="Mois suivant">
            ›
          </button>
        </div>
        {role === "admin" && (
          <div className="month-fill">
            <span className="muted">Mois entier</span>
            <input
              className="quota"
              value={monthQuantity}
              placeholder="Illimité"
              disabled={!selectedId || filling}
              onChange={(e) => setMonthQuantity(e.target.value)}
            />
            <Button disabled={!selectedId || filling} onClick={applyMonth}>
              Appliquer
            </Button>
          </div>
        )}
        <span className="spacer" />
        <Button variant="secondary" icon="calendar" onClick={() => setMonth(currentMonth())}>
          Aujourd’hui
        </Button>
      </div>
      {!types.length && (
        <div className="empty-note muted">Créez un bon dans le catalogue, puis définissez ici la quantité de chaque jour.</div>
      )}
      {!!types.length && daysQuery.loading && <PageSkeleton />}
      {!!types.length && daysQuery.error && <div className="error-note">{daysQuery.error}</div>}
      {!!types.length && !daysQuery.loading && !daysQuery.error && (
        <section className="card table-card">
          <div className="table-title">
            <div>
              <h3>Quotas journaliers</h3>
              <p>Une case vide signifie illimité. Bloquer un jour refuse toute nouvelle commande, même s’il reste des places.</p>
            </div>
            <span className="legend">
              <i /> Quota presque atteint
            </span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>JOUR</th>
                  <th>QUANTITÉ</th>
                  <th>VENDUS</th>
                  <th>RÉSERVÉS</th>
                  <th>RESTANTS</th>
                  <th>REMPLISSAGE</th>
                  <th>JOURNÉE</th>
                </tr>
              </thead>
              <tbody>
                {(daysQuery.data || []).map((row: any) => {
                  const used = Number(row.sold || 0) + Number(row.reserved || 0);
                  const quota = row.quota == null ? null : Number(row.quota);
                  const fill = quota == null || quota === 0 ? 0 : Math.min(100, (used / quota) * 100);
                  return (
                    <tr key={row.day}>
                      <td>
                        <b>{row.day}</b>
                      </td>
                      <td>{weekdayLabel(row.day)}</td>
                      <td>
                        <input
                          className="quota"
                          key={`${row.day}-${quota ?? "unlimited"}`}
                          defaultValue={quota == null ? "" : String(quota)}
                          placeholder="Illimité"
                          disabled={role !== "admin" || busyDay === row.day}
                          onBlur={(e) => saveQuota(row.day, quota, e.target.value)}
                        />
                      </td>
                      <td>{row.sold || 0}</td>
                      <td>{row.reserved || 0}</td>
                      <td>
                        <b>{quota == null ? "—" : row.remaining}</b>
                      </td>
                      <td>
                        <div className="progress">
                          <i style={{ width: `${fill}%` }} />
                        </div>
                      </td>
                      <td>
                        <div className="inline">
                          {row.blocked && <Status value="blocked" />}
                          <button
                            type="button"
                            disabled={!selectedId || busyDay === row.day}
                            onClick={() => toggleBlock(row.day, !row.blocked)}
                          >
                            {row.blocked ? "Débloquer" : "Bloquer"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <div className="notice">
        <Icon name="alert" />
        <div>
          <b>{notice ? "Quota refusé" : "Où saisir la date et la quantité"}</b>
          <p>
            {notice ||
              "Le bon décrit le produit. La date est choisie par le client, et la quantité maximale de ce jour se règle dans ce tableau."}
          </p>
        </div>
      </div>
    </div>
  );
}
