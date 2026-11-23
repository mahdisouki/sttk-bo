import { useMemo } from "react";
import { useAuth } from "../lib/auth";
import { createAdminApi } from "../lib/adminApi";
import { useQuery } from "../hooks/useQuery";
import { PageSkeleton } from "../components/PageSkeleton";
import { Status } from "../components/Status";

export default function PricingPage() {
  const { authFetch } = useAuth();
  const api = useMemo(() => createAdminApi(authFetch), [authFetch]);
  const { data, loading, error } = useQuery(async () => {
    const result = await api.priceGrids();
    return result.data || [];
  }, [api]);
  if (loading) return <PageSkeleton />;
  if (error) return <div className="error-note">{error}</div>;
  const grids = data || [];
  return (
    <div className="stack">
      <div className="toolbar">
        <div className="tabs">
          <button className="active">Toutes</button>
        </div>
        <span className="spacer" />
      </div>
      {!grids.length && <div className="empty-note muted">Aucune grille tarifaire.</div>}
      {grids.map((grid: any) => (
        <section className="card section-card" key={String(grid._id || grid.id)}>
          <div className="detail-head">
            <div>
              <div className="inline">
                <h3>{grid.name}</h3>
                <Status value="active" />
              </div>
              <p>Type partenaire · {grid.partnerType}</p>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
