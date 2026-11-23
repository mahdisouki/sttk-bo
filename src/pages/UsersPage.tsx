import { useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { createAdminApi } from "../lib/adminApi";
import { useQuery } from "../hooks/useQuery";
import { ApiError } from "../lib/api";
import { initials } from "../lib/format";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { PageSkeleton } from "../components/PageSkeleton";
import { Status } from "../components/Status";

const MANAGED_ROLES: { id: string; label: string }[] = [
  { id: "admin", label: "Administrateur" },
  { id: "agent", label: "Agent" },
  { id: "customer", label: "Utilisateur" },
  { id: "station_operator", label: "Opérateur station" },
];

function roleLabel(role: string) {
  if (role === "partner") return "Partenaire";
  return MANAGED_ROLES.find((item) => item.id === role)?.label || role;
}

export default function UsersPage() {
  const { authFetch, user: me } = useAuth();
  const api = useMemo(() => createAdminApi(authFetch), [authFetch]);
  const { data, loading, error, reload } = useQuery(async () => {
    const result = await api.users();
    return result.data || [];
  }, [api]);
  const [editing, setEditing] = useState<any | "new" | null>(null);

  if (editing !== null) {
    return (
      <UserForm
        user={editing === "new" ? null : editing}
        selfId={me?.id}
        back={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          reload();
        }}
      />
    );
  }
  if (loading) return <PageSkeleton />;
  if (error) return <div className="error-note">{error}</div>;
  const rows = data || [];
  return (
    <div className="stack">
      <div className="toolbar">
        <span className="spacer" />
        <Button icon="plus" onClick={() => setEditing("new")}>
          Nouvel utilisateur
        </Button>
      </div>
      <section className="card table-card">
        <div className="table-title">
          <div>
            <h3>Comptes</h3>
            <p>{rows.length} utilisateurs</p>
          </div>
        </div>
        {!rows.length && <div className="empty-note muted">Aucun utilisateur.</div>}
        {!!rows.length && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>UTILISATEUR</th>
                  <th>E-MAIL</th>
                  <th>RÔLE</th>
                  <th>LANGUE</th>
                  <th>STATUT</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any) => {
                  const name = [row.firstName, row.lastName].filter(Boolean).join(" ") || row.email;
                  return (
                    <tr key={String(row.id)} onClick={() => setEditing(row)}>
                      <td>
                        <div className="buyer">
                          <span>{initials(name)}</span>
                          <b>{name}</b>
                        </div>
                      </td>
                      <td>{row.email}</td>
                      <td>
                        <span className="mode">{roleLabel(row.role)}</span>
                      </td>
                      <td>{row.language || "fr"}</td>
                      <td>
                        <Status value={row.status === "disabled" ? "disabled" : "active"} />
                      </td>
                      <td>
                        <button className="icon-btn" onClick={() => setEditing(row)}>
                          <Icon name="chevron" size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function UserForm({
  user,
  selfId,
  back,
  onSaved,
}: {
  user: any | null;
  selfId?: string;
  back: () => void;
  onSaved: () => void;
}) {
  const { authFetch } = useAuth();
  const api = useMemo(() => createAdminApi(authFetch), [authFetch]);
  const isNew = !user;
  const isPartner = user?.role === "partner";
  const isSelf = !isNew && String(user.id) === String(selfId);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(
    MANAGED_ROLES.some((item) => item.id === user?.role) ? user.role : "customer",
  );
  const [language, setLanguage] = useState(user?.language || "fr");
  const [status, setStatus] = useState(user?.status === "disabled" ? "disabled" : "active");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      if (isNew) {
        await api.createUser({
          email: email.trim(),
          password,
          role,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          language,
        });
      } else if (isPartner) {
        await api.updateUser(String(user.id), { status });
      } else {
        await api.updateUser(String(user.id), { role, status });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <button className="back" onClick={back}>
        ← Retour aux utilisateurs
      </button>
      <div className="detail-head">
        <div>
          <h2>{isNew ? "Nouvel utilisateur" : "Modifier l’utilisateur"}</h2>
          <p>
            {isNew
              ? "Réservé à l’administrateur. Le mot de passe doit contenir au moins 8 caractères."
              : user.email}
          </p>
        </div>
        <div className="actions">
          <Button disabled={busy} onClick={save}>
            {isNew ? "Créer le compte" : "Enregistrer"}
          </Button>
        </div>
      </div>
      {error && <div className="error-note">{error}</div>}
      <section className="card form-card">
        <div className="field-grid">
          {isNew && (
            <>
              <label>
                Prénom
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </label>
              <label>
                Nom
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </label>
              <label>
                E-mail *
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              <label>
                Mot de passe *
                <input
                  type="password"
                  value={password}
                  minLength={8}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            </>
          )}
          <label>
            Rôle
            {isPartner ? (
              <input value="Partenaire" disabled />
            ) : (
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                {MANAGED_ROLES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            )}
          </label>
          {isNew && (
            <label>
              Langue
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="fr">Français</option>
                <option value="ar">Arabe</option>
                <option value="en">Anglais</option>
              </select>
            </label>
          )}
          {!isNew && (
            <label>
              Statut
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">Actif</option>
                <option value="disabled" disabled={isSelf}>
                  Désactivé
                </option>
              </select>
            </label>
          )}
        </div>
        {isPartner && (
          <p className="muted">Le rôle partenaire se gère depuis l’écran Partenaires. Seul le statut du compte peut changer ici.</p>
        )}
        {isSelf && <p className="muted">Vous ne pouvez pas désactiver votre propre compte.</p>}
      </section>
    </div>
  );
}
