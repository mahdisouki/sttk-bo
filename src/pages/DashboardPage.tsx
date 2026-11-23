import { useMemo } from "react";
import { useAuth } from "../lib/auth";
import { createAdminApi } from "../lib/adminApi";
import { useQuery } from "../hooks/useQuery";
import { millimesToTnd } from "../lib/format";
import { mapOrderRow } from "../lib/orderMap";
import { useUiStore } from "../stores/uiStore";
import { Icon } from "../components/Icon";
import { OrdersTable } from "../components/OrdersTable";
import { PageSkeleton } from "../components/PageSkeleton";

export default function DashboardPage() {
  const navigate = useUiStore((s) => s.navigate);
  const { authFetch } = useAuth();
  const api = useMemo(() => createAdminApi(authFetch), [authFetch]);
  const { data, loading, error } = useQuery(async () => {
    const [stats, orders] = await Promise.all([api.stats(), api.orders("?limit=5")]);
    return { stats: stats.data, orders: (orders.data || []).map(mapOrderRow), total: orders.total };
  }, [api]);
  const stats = data?.stats;
  const issued = stats?.vouchersIssued || 0;
  const used = stats?.vouchersUsed || 0;
  const rate = issued ? `${((used / issued) * 100).toFixed(1)} %` : "0 %";
  const orderCount = (stats?.ordersByStatus || []).reduce((sum: number, row: any) => sum + row.count, 0);
  if (loading) return <PageSkeleton />;
  if (error) return <div className="error-note">{error}</div>;
  return (
    <div className="stack">
      <div className="metrics">
        <Metric label="Commandes" value={String(orderCount)} icon="receipt" />
        <Metric label="Chiffre d’affaires" value={millimesToTnd(stats?.revenueMillimes)} icon="card" />
        <Metric label="Bons émis" value={String(issued)} note={`${used} utilisés`} icon="ticket" />
        <Metric label="Taux d’utilisation" value={rate} icon="grid" />
      </div>
      <div className="dashboard-grid">
        <section className="card revenue-card">
          <div className="card-head">
            <div>
              <span className="eyebrow">ACTIVITÉ</span>
              <h3>Revenus des 7 derniers jours</h3>
            </div>
            <button className="select-like">
              7 derniers jours <Icon name="down" size={14} />
            </button>
          </div>
          <div className="chart">
            <div className="y-labels">
              <span>4k</span>
              <span>3k</span>
              <span>2k</span>
              <span>1k</span>
              <span>0</span>
            </div>
            <div className="bars">
              {[42, 58, 47, 76, 60, 88, 70].map((h, i) => (
                <div className="bar-col" key={i}>
                  <div className="bar" style={{ height: `${h}%` }}>
                    <i />
                  </div>
                  <span>{["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"][i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-total">
            <b>18 420,000 TND</b>
            <span>Revenu brut sur la période</span>
          </div>
        </section>
        <section className="card todo-card">
          <div className="card-head">
            <div>
              <span className="eyebrow">PRIORITÉS</span>
              <h3>À traiter</h3>
            </div>
            <span className="count">7</span>
          </div>
          <Todo
            icon="receipt"
            title="Commandes à suivre"
            meta={`${data?.total || 0} commandes au total`}
            color="amber"
            onClick={() => navigate("orders")}
          />
          <Todo
            icon="building"
            title="Partenaires"
            meta="Ouvrir la liste des partenaires"
            color="blue"
            onClick={() => navigate("partners")}
          />
          <Todo
            icon="bell"
            title="Notifications"
            meta="Événements système et alertes"
            color="red"
            onClick={() => navigate("notifications")}
          />
          <button className="all-link" onClick={() => navigate("notifications")}>
            Voir toutes les notifications <Icon name="arrow" size={15} />
          </button>
        </section>
      </div>
      <section className="card">
        <div className="card-head">
          <div>
            <span className="eyebrow">TEMPS RÉEL</span>
            <h3>Commandes récentes</h3>
          </div>
          <button className="all-link" onClick={() => navigate("orders")}>
            Voir toutes <Icon name="arrow" size={15} />
          </button>
        </div>
        <OrdersTable compact rows={data?.orders || []} onOpen={() => navigate("orders")} />
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  delta,
  note,
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  note?: string;
  icon: string;
}) {
  return (
    <div className="metric card">
      <div className="metric-icon">
        <Icon name={icon} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small className={delta ? "positive" : ""}>
        {delta && "↗ "}
        {delta || note}
      </small>
    </div>
  );
}

function Todo({
  icon,
  title,
  meta,
  color,
  onClick,
}: {
  icon: string;
  title: string;
  meta: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button className="todo" onClick={onClick}>
      <span className={`todo-icon ${color}`}>
        <Icon name={icon} />
      </span>
      <span>
        <b>{title}</b>
        <small>{meta}</small>
      </span>
      <Icon name="chevron" size={16} />
    </button>
  );
}
