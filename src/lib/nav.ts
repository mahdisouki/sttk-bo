import type { View } from "../stores/uiStore";

export const nav: { id: View; label: string; icon: string; admin?: boolean }[] = [
  { id: "dashboard", label: "Tableau de bord", icon: "grid" },
  { id: "orders", label: "Commandes", icon: "receipt" },
  { id: "catalogue", label: "Catalogue (bons)", icon: "ticket" },
  { id: "treatments", label: "Nos soins", icon: "care" },
  { id: "availability", label: "Disponibilités", icon: "calendar" },
  { id: "pricing", label: "Tarifs & grilles", icon: "tag" },
  { id: "promos", label: "Codes promo", icon: "percent" },
  { id: "partners", label: "Partenaires", icon: "building" },
  { id: "users", label: "Utilisateurs", icon: "users", admin: true },
  { id: "offline", label: "Station / hors-ligne", icon: "cloud", admin: true },
  { id: "settings", label: "Paramètres", icon: "settings", admin: true },
  { id: "audit", label: "Journal d’audit", icon: "history", admin: true },
  { id: "notifications", label: "Notifications", icon: "bell" },
];

export const labels: Record<View, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Tableau de bord",
    subtitle: "Voici ce qui se passe chez STTK aujourd’hui.",
  },
  orders: {
    title: "Commandes",
    subtitle: "Suivez les paiements, remises et visites de chaque commande.",
  },
  catalogue: {
    title: "Catalogue des bons",
    subtitle: "Gérez les expériences thermales proposées à Korbous.",
  },
  treatments: {
    title: "Nos soins",
    subtitle: "Rédigez les fiches affichées sur la page Soins du site.",
  },
  availability: {
    title: "Disponibilités",
    subtitle: "Pilotez les quotas journaliers par type de bon.",
  },
  pricing: {
    title: "Tarifs & grilles",
    subtitle: "Définissez les tarifs négociés de vos partenaires.",
  },
  promos: { title: "Codes promo", subtitle: "Créez et suivez les offres commerciales." },
  partners: { title: "Partenaires", subtitle: "Gérez les agences, hôtels et revendeurs." },
  users: { title: "Utilisateurs", subtitle: "Administrez les accès et rôles de votre équipe." },
  offline: {
    title: "Station / hors-ligne",
    subtitle: "Marquez des bons utilisés lors d’une rupture réseau.",
  },
  settings: {
    title: "Paramètres",
    subtitle: "Configurez les règles commerciales et la facturation.",
  },
  audit: { title: "Journal d’audit", subtitle: "Consultez la chronologie des actions sensibles." },
  notifications: {
    title: "Notifications",
    subtitle: "Les événements qui nécessitent votre attention.",
  },
};
