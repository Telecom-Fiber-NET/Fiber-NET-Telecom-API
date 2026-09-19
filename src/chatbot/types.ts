import { Contrato, Fatura, Login } from "../types/ixc.types";
import { RecoveryFunnelState } from "../reativacao/types";

export type ChatbotIntent =
  | "SAUDACAO"
  | "SEGUNDA_VIA"
  | "PIX"
  | "PAGAMENTO"
  | "PAGAMENTO_REALIZADO"
  | "COMPROVANTE"
  | "INTERNET_BLOQUEADA"
  | "REATIVACAO"
  | "NEGOCIACAO"
  | "VALOR_FATURA"
  | "VENCIMENTO"
  | "SUPORTE"
  | "SEM_CONEXAO"
  | "CANCELAMENTO"
  | "MUDANCA_PLANO"
  | "ATENDENTE"
  | "OUTROS";

export type ConversationStatus =
  | "OPEN"
  | "BOT"
  | "WAITING_CUSTOMER"
  | "WAITING_PAYMENT"
  | "WAITING_HUMAN"
  | "RESOLVED"
  | "CLOSED";

export interface ChatbotMessageRequest {
  phone: string;
  message: string;
  source?: "api" | "whatsapp";
  externalMessageId?: string;
}

export interface ChatbotCustomer {
  id: number;
  name: string;
  phone?: string;
  contracts: Contrato[];
  activeContract?: Contrato;
  plan?: string;
  status?: string;
  invoices: Fatura[];
  logins: Login[];
}

export interface ChatbotAIResult {
  intent: ChatbotIntent;
  confidence: number;
  entities: Record<string, unknown>;
  requiresHuman: boolean;
}

export interface ChatbotResponse {
  success: boolean;
  reply: string;
  customer?: {
    id: number;
    name: string;
  };
  status: "identificacao" | "reativacao" | "financeiro" | "suporte" | "humano" | "erro";
  conversationId?: string;
  intent?: ChatbotIntent;
}

export interface ConversationRecord {
  id: string;
  phone: string;
  customerId?: number;
  contractId?: number;
  status: ConversationStatus;
  funnelState?: RecoveryFunnelState;
  createdAt: string;
  updatedAt: string;
}
