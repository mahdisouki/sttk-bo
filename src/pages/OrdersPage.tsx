import { useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { createAdminApi } from "../lib/adminApi";
import { useQuery } from "../hooks/useQuery";
import { ApiError } from "../lib/api";
import {
  formatDateTime,
  initials,
  millimesToTnd,
  statusUi,
} from "../lib/format";
import { mapOrderRow } from "../lib/orderMap";
import { useUiStore } from "../stores/uiStore";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { Info } from "../components/Info";
import { OrdersTable } from "../components/OrdersTable";
import { PageSkeleton } from "../components/PageSkeleton";
import { Status } from "../components/Status";

export default function OrdersPage() {
  const { authFetch } = useAuth();
  const api = useMemo(() => createAdminApi(authFetch), [authFetch]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, loading, error, reload } = useQuery(async () => {
    const result = await api.orders("?limit=50");
    return { rows: (result.data || []).map(mapOrderRow), total: result.total };
  }, [api]);
  if (selectedId) {
    return (
      <OrderDetail
        id={selectedId}
        back={() => setSelectedId(null)}
        onChanged={reload}
      />
    );
  }
  if (loading) return <PageSkeleton />;
  if (error) return <div className="error-note">{error}</div>;
  return (
    <div className="stack">
      <div className="toolbar">
        <div className="search-box">
          <Icon name="search" />
          <input placeholder="Filtrer localement bientôt…" disabled />
        </div>
        <span className="spacer" />
        <Button variant="secondary" onClick={reload}>
          Actualiser
        </Button>
      </div>
      <section className="card table-card">
        <div className="table-title">
          <div>
            <h3>Toutes les commandes</h3>
            <p>{data?.total || 0} commandes au total</p>
          </div>
        </div>
        <OrdersTable rows={data?.rows || []} onOpen={setSelectedId} />
      </section>
    </div>
  );
}

function OrderDetail({
  id,
  back,
  onChanged,
}: {
  id: string;
  back: () => void;
  onChanged: () => void;
}) {
  const closeModal = useUiStore((s) => s.closeModal);
  const { authFetch } = useAuth();
  const api = useMemo(() => createAdminApi(authFetch), [authFetch]);
  const { data, loading, error, reload } = useQuery(async () => {
    const result = await api.order(id);
    return result.data;
  }, [api, id]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  async function payAgency() {
    if (!data) return;
    setBusy(true);
    setActionError("");
    try {
      await api.agencyPayment(id, { method: "cash", amount: data.total });
      reload();
      onChanged();
      closeModal();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Paiement impossible");
    } finally {
      setBusy(false);
    }
  }

  async function cancelOrder() {
    if (!data) return;
    const reason = window.prompt("Motif de l’annulation");
    if (!reason) return;
    const paidLike = ["paid", "credit_approved", "fulfilled"].includes(data.status);
    let refundAmount: number | undefined;
    if (paidLike) {
      const raw = window.prompt(
        `Montant à rembourser en millimes (total ${data.total})`,
        String(data.total - (data.refundedAmount || 0)),
      );
      if (raw == null) return;
      refundAmount = Number(raw);
    }
    setBusy(true);
    setActionError("");
    try {
      await api.cancelOrder(id, { reason, refundAmount });
      reload();
      onChanged();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Annulation impossible");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageSkeleton />;
  if (error || !data) return <div className="error-note">{error || "Commande introuvable"}</div>;
  const buyer = data.guestEmail || (data.partnerId ? "Partenaire B2B" : "Client");
  return (
    <div className="stack">
      <button className="back" onClick={back}>
        ← Retour aux commandes
      </button>
      {actionError && <div className="error-note">{actionError}</div>}
      <div className="detail-head">
        <div>
          <div className="inline">
            <h2>{data.orderCode}</h2>
            <Status value={statusUi(data.status)} />
          </div>
          <p>
            Créée le {formatDateTime(data.createdAt)}
            {data.paymentCode ? (
              <>
                {" "}
                · Code paiement <b>{data.paymentCode}</b>
              </>
            ) : null}
          </p>
        </div>
        <div className="actions">
          {data.paymentMode === "agency" && data.status === "pending_payment" && (
            <Button variant="secondary" disabled={busy} onClick={payAgency}>
              Enregistrer paiement
            </Button>
          )}
          {!["cancelled", "refunded", "expired", "failed"].includes(data.status) && (
            <Button variant="danger" disabled={busy} onClick={cancelOrder}>
              Annuler / rembourser
            </Button>
          )}
        </div>
      </div>
      <div className="detail-grid">
        <div className="stack">
          <section className="card section-card">
            <div className="card-head">
              <h3>Détails de la commande</h3>
              <span className="mode">{data.paymentMode}</span>
            </div>
            {(data.lines || []).map((line: any) => (
              <div className="line-item" key={line.id}>
                <div className="voucher-thumb">
                  <Icon name="ticket" />
                </div>
                <div>
                  <b>Type {String(line.voucherTypeId).slice(-6)}</b>
                  <p>
                    {line.visitDate} · {line.quantity} bénéficiaires
                  </p>
                </div>
                <span>
                  {line.quantity} × {millimesToTnd(line.unitPrice)}
                </span>
                <b>{millimesToTnd(line.total)}</b>
              </div>
            ))}
            <div className="beneficiaries">
              {(data.vouchers || []).map((voucher: any, i: number) => (
                <div key={voucher.id}>
                  <span>{i + 1}</span>
                  {voucher.beneficiary}
                  <Status value={statusUi(voucher.status)} />
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="stack">
          <section className="card section-card">
            <h3>Acheteur</h3>
            <div className="profile-row">
              <span className="avatar">{initials(buyer)}</span>
              <div>
                <b>{buyer}</b>
                <p>{data.partnerId ? "Commande partenaire" : "Commande client / invité"}</p>
              </div>
            </div>
          </section>
          <section className="card total-card">
            <Info label="Sous-total" value={millimesToTnd(data.subtotal)} />
            <Info label="TVA" value={millimesToTnd(data.vatTotal)} />
            <Info label="Remise" value={millimesToTnd(data.discountTotal)} />
            <hr />
            <Info label="Total" value={millimesToTnd(data.total)} strong />
          </section>
        </aside>
      </div>
    </div>
  );
}
