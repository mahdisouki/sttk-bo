export function millimesToTnd(value: number | null | undefined): string {
  const amount = Number(value || 0) / 1000;
  return `${amount.toLocaleString("fr-TN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TND`;
}

/** Parse a TND input like "45,000" or "45.000" into millimes. */
export function tndToMillimes(raw: string): number {
  const cleaned = String(raw || "")
    .replace(/\s/g, "")
    .replace(/TND/gi, "")
    .replace(",", ".");
  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) throw new Error("Montant invalide");
  return Math.round(amount * 1000);
}

export function slugify(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function initials(text: string): string {
  const parts = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function formatDateTime(value?: string | Date | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("fr-TN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function todayTunisLabel(): string {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Africa/Tunis",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function statusUi(status: string): string {
  const map: Record<string, string> = {
    pending_payment: "pending",
    credit_approved: "paid",
    paid: "paid",
    fulfilled: "fulfilled",
    expired: "expired",
    failed: "expired",
    cancelled: "cancelled",
    refunded: "refunded",
    draft: "draft",
    published: "published",
    approved: "approved",
    pending: "pending",
    rejected: "rejected",
    suspended: "suspended",
    blocked_credit: "blocked_credit",
    active: "active",
    disabled: "suspended",
    issued: "available",
    used: "used",
  };
  return map[status] || status;
}

export function newIdempotencyKey(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
