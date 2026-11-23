import { useMemo } from "react";
import { useAuth } from "../lib/auth";
import { createAdminApi } from "../lib/adminApi";
import { useQuery } from "../hooks/useQuery";
import { formatDateTime } from "../lib/format";
import { Icon } from "../components/Icon";
import { ListScreen } from "../components/ListScreen";
import { PageSkeleton } from "../components/PageSkeleton";

export default function AuditPage() {
  const { authFetch } = useAuth();
  const api = useMemo(() => createAdminApi(authFetch), [authFetch]);
  const { data, loading, error } = useQuery(async () => {
    const result = await api.audit(1);
    return result.data || [];
  }, [api]);
  if (loading) return <PageSkeleton />;
  if (error) return <div className="error-note">{error}</div>;
  const rows = data || [];
  return (
    <ListScreen
      columns={["UTILISATEUR", "ACTION", "ENTITÉ", "DATE ET HEURE", ""]}
      rows={rows.map((r: any) => [
        <b>{r.userId ? String(r.userId).slice(-6) : "Système"}</b>,
        <code className="action-code">{r.action}</code>,
        `${r.entity}${r.entityId ? ` · ${r.entityId}` : ""}`,
        formatDateTime(r.at),
        <button className="icon-btn">
          <Icon name="eye" />
        </button>,
      ])}
    />
  );
}
