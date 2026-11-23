import { newIdempotencyKey } from "./format";
import type { useAuth } from "./auth";

type AuthFetch = ReturnType<typeof useAuth>["authFetch"];

export function createAdminApi(authFetch: AuthFetch) {
  return {
    stats: () => authFetch<{ success: true; data: any }>("/admin/stats"),
    orders: (query = "") =>
      authFetch<{ success: true; data: any[]; total: number; page: number; limit: number }>(
        `/admin/orders${query}`,
      ),
    order: (id: string) => authFetch<{ success: true; data: any }>(`/admin/orders/${id}`),
    cancelOrder: (id: string, body: { reason: string; refundAmount?: number }) =>
      authFetch(`/admin/orders/${id}/cancel`, {
        method: "POST",
        headers: { "Idempotency-Key": newIdempotencyKey("cancel") },
        body,
      }),
    agencyPayment: (id: string, body: { method: "cash" | "card"; amount: number }) =>
      authFetch(`/admin/orders/${id}/agency-payment`, {
        method: "POST",
        headers: { "Idempotency-Key": newIdempotencyKey("agency") },
        body,
      }),
    handover: (id: string, voucherId: string) =>
      authFetch(`/admin/orders/${id}/handover`, {
        method: "POST",
        body: { voucherId },
      }),
    markOffline: (publicIds: string[]) =>
      authFetch("/admin/vouchers/mark-used-offline", {
        method: "POST",
        body: { publicIds },
      }),
    voucherTypes: () => authFetch<{ success: true; data: any[] }>("/admin/voucher-types"),
    treatments: () => authFetch<{ success: true; data: any[] }>("/admin/treatments"),
    createTreatment: (body: Record<string, unknown>) =>
      authFetch("/admin/treatments", { method: "POST", body }),
    updateTreatment: (id: string, body: Record<string, unknown>) =>
      authFetch(`/admin/treatments/${id}`, { method: "PATCH", body }),
    publishTreatment: (id: string) =>
      authFetch(`/admin/treatments/${id}/publish`, { method: "POST" }),
    deleteTreatment: (id: string) =>
      authFetch(`/admin/treatments/${id}`, { method: "DELETE" }),
    uploadTreatmentPhoto: (id: string, file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      return authFetch(`/admin/treatments/${id}/photos`, { method: "POST", formData });
    },
    createVoucherType: (body: Record<string, unknown>) =>
      authFetch("/admin/voucher-types", { method: "POST", body }),
    updateVoucherType: (id: string, body: Record<string, unknown>) =>
      authFetch(`/admin/voucher-types/${id}`, { method: "PATCH", body }),
    publishVoucher: (id: string) =>
      authFetch(`/admin/voucher-types/${id}/publish`, { method: "POST" }),
    deleteVoucherType: (id: string) =>
      authFetch(`/admin/voucher-types/${id}`, { method: "DELETE" }),
    uploadVoucherPhoto: (id: string, file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      return authFetch(`/admin/voucher-types/${id}/photos`, {
        method: "POST",
        formData,
      });
    },
    deleteVoucherPhoto: (id: string, photo: string) =>
      authFetch(`/admin/voucher-types/${id}/photos`, {
        method: "DELETE",
        body: { photo },
      }),
    priceGrids: () => authFetch<{ success: true; data: any[] }>("/admin/price-grids"),
    promos: () => authFetch<{ success: true; data: any[] }>("/admin/promo-codes"),
    partners: () => authFetch<{ success: true; data: any[] }>("/admin/partners"),
    approvePartner: (
      id: string,
      body: {
        approvalStatus: string;
        creditLimit?: number;
        paymentDays?: number;
        priceGridId?: string;
      },
    ) => authFetch(`/admin/partners/${id}/approval`, { method: "POST", body }),
    setCredit: (id: string, body: { creditLimit: number; paymentDays?: number }) =>
      authFetch(`/admin/partners/${id}/credit`, { method: "POST", body }),
    partnerPayment: (id: string, amount: number) =>
      authFetch(`/admin/partners/${id}/payments`, { method: "POST", body: { amount } }),
    users: () => authFetch<{ success: true; data: any[] }>("/admin/users"),
    createUser: (body: Record<string, unknown>) =>
      authFetch("/admin/users", { method: "POST", body }),
    updateUser: (id: string, body: Record<string, unknown>) =>
      authFetch(`/admin/users/${id}`, { method: "PATCH", body }),
    settings: () => authFetch<{ success: true; data: any[] }>("/admin/settings"),
    updateSetting: (key: string, value: unknown) =>
      authFetch("/admin/settings", { method: "PUT", body: { key, value } }),
    audit: (page = 1) =>
      authFetch<{ success: true; data: any[]; total: number }>(`/admin/audit?page=${page}&limit=50`),
    notifications: () => authFetch<{ success: true; data: any[] }>("/admin/notifications"),
    availability: (voucherTypeId: string, month: string) =>
      authFetch<{ success: true; data: any[] }>(
        `/admin/availability?voucherTypeId=${encodeURIComponent(voucherTypeId)}&month=${encodeURIComponent(month)}`,
      ),
    setAvailability: (body: { voucherTypeId: string; day: string; quota: number | null }) =>
      authFetch("/admin/availability", { method: "PUT", body }),
    blockDay: (body: { voucherTypeId: string; day: string; blocked: boolean }) =>
      authFetch("/admin/availability/block", { method: "PUT", body }),
    setMonthQuota: (body: { voucherTypeId: string; month: string; quota: number | null }) =>
      authFetch("/admin/availability/month", { method: "PUT", body }),
  };
}
