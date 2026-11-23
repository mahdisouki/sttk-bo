export function Status({ value }: { value: string }) {
  const map: Record<string, string> = {
    pending: "En attente",
    paid: "Payée",
    fulfilled: "Remise",
    expired: "Expirée",
    cancelled: "Annulée",
    refunded: "Remboursée",
    approved: "Approuvé",
    blocked: "Fermé",
    draft: "Brouillon",
    published: "Publié",
    active: "Actif",
    suspended: "Suspendu",
    disabled: "Désactivé",
    rejected: "Rejeté",
    blocked_credit: "Crédit bloqué",
    used: "Utilisé",
    available: "Disponible",
  };
  return <span className={`status status-${value}`}>{map[value] ?? value}</span>;
}
