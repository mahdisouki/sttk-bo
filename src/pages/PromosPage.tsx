import { useMemo } from "react";
import { useAuth } from "../lib/auth";
import { createAdminApi } from "../lib/adminApi";
import { useQuery } from "../hooks/useQuery";
import { millimesToTnd } from "../lib/format";
import { Icon } from "../components/Icon";
import { ListScreen } from "../components/ListScreen";
import { PageSkeleton } from "../components/PageSkeleton";
import { Status } from "../components/Status";

export default function PromosPage() {
  const { authFetch } = useAuth();
  const api = useMemo(() => createAdminApi(authFetch), [authFetch]);
  const { data, loading, error } = useQuery(async () => {
    const result = await api.promos();
    return result.data || [];
  }, [api]);
  if (loading) return <PageSkeleton />;
  if (error) return <div className="error-note">{error}</div>;
  const rows = data || [];
  return (
    <ListScreen
      columns={["CODE", "REMISE", "PÉRIMÈTRE", "UTILISATIONS", "STATUT", ""]}
      rows={rows.map((r: any) => [
        <b className="promo-code">{r.code}</b>,
        r.type === "percent" ? `${(r.amountBps || 0) / 100} %` : millimesToTnd(r.amountMillimes),
        r.allowWholesale ? "Inclut grossistes" : "Public",
        `${r.reservedUses || 0}${r.maxUses != null ? ` / ${r.maxUses}` : " / ∞"}`,
        <Status value={r.active ? "active" : "expired"} />,
        <button className="icon-btn">
          <Icon name="more" />
        </button>,
      ])}
    />
  );
}
