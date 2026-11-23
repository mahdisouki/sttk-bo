import { useMemo, type ReactNode } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import OrdersPage from "./pages/OrdersPage";
import CataloguePage from "./pages/CataloguePage";
import TreatmentsPage from "./pages/TreatmentsPage";
import AvailabilityPage from "./pages/AvailabilityPage";
// import PricingPage from "./pages/PricingPage";
// import PromosPage from "./pages/PromosPage";
import PartnersPage from "./pages/PartnersPage";
import UsersPage from "./pages/UsersPage";
import OfflinePage from "./pages/OfflinePage";
import SettingsPage from "./pages/SettingsPage";
import AuditPage from "./pages/AuditPage";
import NotificationsPage from "./pages/NotificationsPage";
import { useAuth } from "./lib/auth";
import { initials, todayTunisLabel } from "./lib/format";
import { labels, nav } from "./lib/nav";
import { useUiStore, type View } from "./stores/uiStore";
import { Button } from "./components/Button";
import { Icon } from "./components/Icon";
import { ModalView } from "./components/ModalView";
import { PageSkeleton } from "./components/PageSkeleton";

export default function App() {
  const auth = useAuth();
  const view = useUiStore((s) => s.view);
  const modal = useUiStore((s) => s.modal);
  const toast = useUiStore((s) => s.toast);
  const profileOpen = useUiStore((s) => s.profileOpen);
  const pageLoading = useUiStore((s) => s.pageLoading);
  const navigate = useUiStore((s) => s.navigate);
  const toggleProfile = useUiStore((s) => s.toggleProfile);
  const setProfileOpen = useUiStore((s) => s.setProfileOpen);
  const clearToast = useUiStore((s) => s.clearToast);
  const role = auth.user?.role === "agent" ? "agent" : "admin";
  const visibleNav = useMemo(() => nav.filter((n) => role === "admin" || !n.admin), [role]);
  if (!auth.ready) return <PageSkeleton />;
  if (!auth.accessToken) return <LoginPage />;
  if (!["admin", "agent"].includes(auth.user?.role || "")) {
    return (
      <div className="auth-page">
        <div className="auth-form">
          <h2>Accès refusé</h2>
          <p className="muted">Ce back-office est réservé aux comptes admin et agent.</p>
          <Button onClick={() => auth.logout()}>Se déconnecter</Button>
        </div>
      </div>
    );
  }
  const body: Record<View, ReactNode> = {
    dashboard: <DashboardPage />,
    orders: <OrdersPage />,
    catalogue: <CataloguePage role={role} />,
    treatments: <TreatmentsPage role={role} />,
    availability: <AvailabilityPage role={role} />,
    // Hidden for now with the sidebar entries
    pricing: <div className="empty-note muted">Tarifs & grilles — bientôt disponible.</div>,
    promos: <div className="empty-note muted">Codes promo — bientôt disponible.</div>,
    partners: <PartnersPage role={role} />,
    users: role === "admin" ? <UsersPage /> : <div className="error-note">Accès réservé aux administrateurs.</div>,
    offline: <OfflinePage />,
    settings: <SettingsPage />,
    audit: <AuditPage />,
    notifications: <NotificationsPage />,
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-logo" src="/logo-sttk.png" alt="STTK Korbous" />
        </div>
        <nav>
          {visibleNav.map((n, i) => (
            <button
              key={n.id}
              className={view === n.id ? "active" : ""}
              onClick={() => navigate(n.id)}
            >
              {i === 1 && <span className="nav-divider" />}
              <Icon name={n.icon} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="station-status">
            <i />
            <span>
              <b>API connectée</b>
              <small>{import.meta.env.VITE_API_URL || "/api/v1"}</small>
            </span>
          </div>
          <p>STTK · back-office</p>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div className="mobile-brand">
            <img className="brand-logo" src="/logo-sttk.png" alt="STTK" />
          </div>
          <div className="top-search">
            <Icon name="search" />
            <input placeholder="Rechercher une commande, un partenaire…" />
          </div>
          <div className="top-actions">
            <button className="lang">
              FR <Icon name="down" size={13} />
            </button>
            <button className="bell" onClick={() => navigate("notifications")}>
              <Icon name="bell" />
            </button>
            <div className="profile-wrap">
              <button className="profile" onClick={toggleProfile}>
                <span className="avatar">{initials(auth.displayName)}</span>
                <span>
                  <b>{auth.displayName}</b>
                  <small>{role === "admin" ? "Administrateur" : "Agent"}</small>
                </span>
                <Icon name="down" size={14} />
              </button>
              {profileOpen && (
                <div className="profile-menu">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      auth.logout();
                    }}
                  >
                    <Icon name="logout" /> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="page">
          <div className="page-title">
            <div>
              <h1>
                {view === "dashboard" ? `Bonjour, ${auth.displayName.split(" ")[0]}` : labels[view].title}
              </h1>
              <p>{labels[view].subtitle}</p>
            </div>
            <span className="date-chip">
              <Icon name="calendar" size={16} /> {todayTunisLabel()} · Tunis
            </span>
          </div>
          {pageLoading ? <PageSkeleton /> : body[view]}
        </div>
      </main>
      {modal && <ModalView type={modal} />}
      {toast && (
        <div className="toast">
          <span>
            <Icon name="check" />
          </span>
          <div>
            <b>{toast}</b>
            <small>Les données ont été mises à jour.</small>
          </div>
          <button onClick={clearToast}>
            <Icon name="x" size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
