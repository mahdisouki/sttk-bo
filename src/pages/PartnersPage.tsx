import { useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { createAdminApi } from "../lib/adminApi";
import { useQuery } from "../hooks/useQuery";
import { ApiError } from "../lib/api";
import { initials, millimesToTnd, statusUi } from "../lib/format";
import { useUiStore } from "../stores/uiStore";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { Info } from "../components/Info";
import { ListScreen } from "../components/ListScreen";
import { PageSkeleton } from "../components/PageSkeleton";
import { Status } from "../components/Status";

export default function PartnersPage({ role }: { role: "admin" | "agent" }) {
  const { authFetch } = useAuth();
  const api = useMemo(() => createAdminApi(authFetch), [authFetch]);
  const [selected, setSelected] = useState<any | null>(null);
  const { data, loading, error, reload } = useQuery(async () => {
    const result = await api.partners();
    return result.data || [];
  }, [api]);
  if (selected) {
    return (
      <PartnerDetail
        partner={selected}
        back={() => setSelected(null)}
        role={role}
        onChanged={reload}
      />
    );
  }
  if (loading) return <PageSkeleton />;
  if (error) return <div className="error-note">{error}</div>;
  const rows = data || [];
  return (
    <ListScreen
      tabs
      columns={["PARTENAIRE", "TYPE", "CONTACT", "LIMITE DE CRÉDIT", "SOLDE DÛ", "STATUT", ""]}
      rows={rows.map((r: any) => [
        <div className="buyer" onClick={() => setSelected(r)}>
          <span>{initials(r.businessName)}</span>
          <b>{r.businessName}</b>
        </div>,
        r.partnerType,
        r.contactName || "—",
        millimesToTnd(r.creditLimit),
        <b>{millimesToTnd(r.balance)}</b>,
        <Status value={statusUi(r.approvalStatus)} />,
        <button className="icon-btn" onClick={() => setSelected(r)}>
          <Icon name="chevron" size={15} />
        </button>,
      ])}
    />
  );
}

function PartnerDetail({
  partner,
  back,
  role,
  onChanged,
}: {
  partner: any;
  back: () => void;
  role: "admin" | "agent";
  onChanged: () => void;
}) {
  const openModal = useUiStore((s) => s.openModal);
  const { authFetch } = useAuth();
  const api = useMemo(() => createAdminApi(authFetch), [authFetch]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function approve() {
    const creditLimit = Number(window.prompt("Limite de crédit en millimes", "20000000"));
    const paymentDays = Number(window.prompt("Délai de paiement (jours)", "30"));
    if (!Number.isInteger(creditLimit) || !Number.isInteger(paymentDays)) return;
    setBusy(true);
    setError("");
    try {
      await api.approvePartner(String(partner._id || partner.id), {
        approvalStatus: "approved",
        creditLimit,
        paymentDays,
      });
      onChanged();
      openModal("approve");
      back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Approbation impossible");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="stack">
      <button className="back" onClick={back}>
        ← Retour aux partenaires
      </button>
      {error && <div className="error-note">{error}</div>}
      <div className="detail-head">
        <div>
          <div className="inline">
            <h2>{partner.businessName}</h2>
            <Status value={statusUi(partner.approvalStatus)} />
          </div>
          <p>
            {partner.partnerType} · {partner.taxId}
          </p>
        </div>
        {role === "admin" ? (
          <div className="actions">
            {partner.approvalStatus === "pending" && (
              <Button disabled={busy} onClick={approve}>
                Approuver le partenaire
              </Button>
            )}
          </div>
        ) : (
          <span className="role-note">Consultation seule · approbation réservée aux admins</span>
        )}
      </div>
      <div className="detail-grid">
        <div className="stack">
          <section className="card section-card">
            <h3>Informations légales</h3>
            <div className="info-grid">
              <Info label="Raison sociale" value={partner.businessName} />
              <Info label="Matricule fiscal" value={partner.taxId} />
              <Info label="Type" value={partner.partnerType} />
            </div>
          </section>
        </div>
        <aside className="stack">
          <section className="card form-card">
            <h3>Contact principal</h3>
            <Info label="Nom" value={partner.contactName || "—"} />
            <Info label="Téléphone" value={partner.phone || "—"} />
          </section>
          <section className="card form-card">
            <h3>Situation financière</h3>
            <Info label="Solde dû" value={millimesToTnd(partner.balance)} />
            <Info label="Plafond" value={millimesToTnd(partner.creditLimit)} />
            <Info label="Délai" value={`${partner.paymentDays ?? "—"} jours`} />
          </section>
        </aside>
      </div>
    </div>
  );
}
