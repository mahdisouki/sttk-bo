import { useMemo } from "react";
import { useAuth } from "../lib/auth";
import { createAdminApi } from "../lib/adminApi";
import { useQuery } from "../hooks/useQuery";
import { formatDateTime } from "../lib/format";
import { useUiStore } from "../stores/uiStore";
import { Icon } from "../components/Icon";
import { PageSkeleton } from "../components/PageSkeleton";

export default function NotificationsPage() {
  const notify = useUiStore((s) => s.notify);
  const { authFetch } = useAuth();
  const api = useMemo(() => createAdminApi(authFetch), [authFetch]);
  const { data, loading, error } = useQuery(async () => {
    const result = await api.notifications();
    return result.data || [];
  }, [api]);
  if (loading) return <PageSkeleton />;
  if (error) return <div className="error-note">{error}</div>;
  const items = data || [];
  return (
    <section className="card notifications">
      <div className="table-title">
        <div>
          <h3>Boîte de réception</h3>
          <p>{items.length} notifications</p>
        </div>
      </div>
      {!items.length && <div className="empty-note muted">Aucune notification.</div>}
      {items.map((n: any) => (
        <button
          className="notification"
          key={String(n._id || n.id)}
          onClick={() => notify(n.title)}
        >
          <span className="todo-icon blue">
            <Icon name="bell" />
          </span>
          <span>
            <b>{n.title}</b>
            <p>{n.body || n.type}</p>
            <small>{formatDateTime(n.createdAt)}</small>
          </span>
          <i />
        </button>
      ))}
    </section>
  );
}
