import { Icon } from "./Icon";
import { Status } from "./Status";
import { mapOrderRow } from "../lib/orderMap";

export function OrdersTable({
  compact = false,
  rows,
  onOpen,
}: {
  compact?: boolean;
  rows: ReturnType<typeof mapOrderRow>[];
  onOpen: (id: string) => void;
}) {
  if (!rows.length) {
    return <div className="empty-note muted">Aucune commande pour le moment.</div>;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>COMMANDE</th>
            <th>ACHETEUR</th>
            <th>TOTAL</th>
            <th>PAIEMENT</th>
            <th>STATUT</th>
            <th>DATE DE VISITE</th>
            {!compact && <th>CRÉÉE LE</th>}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id} onClick={() => onOpen(o.id)}>
              <td>
                <b className="code">{o.code}</b>
              </td>
              <td>
                <div className="buyer">
                  <span>{o.initials}</span>
                  <b>{o.buyer}</b>
                </div>
              </td>
              <td>
                <b>{o.total}</b>
              </td>
              <td>
                <span className="mode">{o.mode}</span>
              </td>
              <td>
                <Status value={o.status} />
              </td>
              <td>{o.visit}</td>
              {!compact && <td className="muted">{o.created}</td>}
              <td>
                <button className="icon-btn">
                  <Icon name="chevron" size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
