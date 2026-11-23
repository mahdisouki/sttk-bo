import { formatDateTime, initials, millimesToTnd, statusUi } from "./format";

export function mapOrderRow(order: any) {
  const buyer = order.guestEmail || (order.partnerId ? "Partenaire B2B" : "Client");
  const visit = order.lines?.[0]?.visitDate || order.vouchers?.[0]?.visitDate || "—";
  return {
    id: String(order.id),
    code: order.orderCode,
    buyer,
    initials: initials(buyer),
    total: millimesToTnd(order.total),
    mode: order.paymentMode,
    status: statusUi(order.status),
    rawStatus: order.status,
    visit,
    created: formatDateTime(order.createdAt),
    raw: order,
  };
}
