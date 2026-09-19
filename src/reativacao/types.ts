export type ReactivationBucket = "LESS_THAN_7_DAYS" | "BETWEEN_7_AND_15_DAYS" | "MORE_THAN_15_DAYS" | "UNKNOWN";

export type RecoveryFunnelState =
  | "BLOCKED"
  | "CONTACT_PENDING"
  | "CONTACTED"
  | "WAITING_CUSTOMER"
  | "PAYMENT_PENDING"
  | "PAYMENT_CONFIRMED"
  | "REACTIVATION_PENDING"
  | "REACTIVATED"
  | "HUMAN_ATTENDANCE"
  | "NO_RESPONSE"
  | "CANCELLED";

export interface BlockedCustomerSummary {
  customerId: number;
  contractId: number;
  name: string;
  plan?: string;
  blockDate?: string | null;
  value?: number;
  blockedDays: number | null;
  bucket: ReactivationBucket;
  state: RecoveryFunnelState;
}

export interface ReactivationRegistrationInput {
  customerId: number;
  contractId?: number;
  phone?: string;
  state: RecoveryFunnelState;
  reason?: string;
  notes?: string;
}
