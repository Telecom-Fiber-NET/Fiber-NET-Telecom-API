import { Fatura, Login } from "../types/ixc.types";
import { ReactivationBucket, RecoveryFunnelState } from "./types";

export function calculateBlockedDays(blockDate?: string | Date | null, now = new Date()): number | null {
  if (!blockDate) return null;
  const parsed = blockDate instanceof Date ? blockDate : new Date(blockDate);
  if (Number.isNaN(parsed.getTime())) return null;

  const start = Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.floor((end - start) / 86400000));
}

export function classifyBlockedCustomer(blockedDays: number | null): ReactivationBucket {
  if (blockedDays === null) return "UNKNOWN";
  if (blockedDays < 7) return "LESS_THAN_7_DAYS";
  if (blockedDays <= 15) return "BETWEEN_7_AND_15_DAYS";
  return "MORE_THAN_15_DAYS";
}

export function isLoginBlocked(login: Pick<Login, "status">): boolean {
  const status = String(login.status || "").toUpperCase();
  return ["B", "BL", "BLOQUEADO", "CA", "CM", "FA"].includes(status);
}

export function hasOpenInvoice(faturas: Pick<Fatura, "status">[]): boolean {
  return faturas.some((fatura) => String(fatura.status || "").toUpperCase() === "A");
}

export function hasConfirmedPayment(faturas: Pick<Fatura, "status">[]): boolean {
  return faturas.some((fatura) => ["P", "R"].includes(String(fatura.status || "").toUpperCase()));
}

export function nextFunnelState(params: {
  blocked: boolean;
  openInvoice: boolean;
  paymentConfirmed: boolean;
  requiresHuman?: boolean;
}): RecoveryFunnelState {
  if (params.requiresHuman) return "HUMAN_ATTENDANCE";
  if (!params.blocked) return "REACTIVATED";
  if (params.paymentConfirmed && !params.openInvoice) return "PAYMENT_CONFIRMED";
  if (params.openInvoice) return "PAYMENT_PENDING";
  return "WAITING_CUSTOMER";
}
