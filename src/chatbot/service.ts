import { ixcLogger } from "../utils/logger";
import {
  calculateBlockedDays,
  classifyBlockedCustomer,
  hasConfirmedPayment,
  hasOpenInvoice,
  isLoginBlocked,
  nextFunnelState,
} from "../reativacao/rules";
import { ChatbotAIService, chatbotAIService } from "./ai.service";
import { ChatbotConversationStore, chatbotConversationStore } from "./conversationStore";
import { ChatbotCustomerService, chatbotCustomerService } from "./customer.service";
import { ChatbotMessageRequest, ChatbotResponse, ChatbotCustomer } from "./types";
import { firstName, maskPhone, normalizePhone } from "./utils";

function extractBlockDate(customer: ChatbotCustomer): string | null {
  const candidates = [...customer.logins, customer.activeContract].filter(Boolean) as any[];
  for (const item of candidates) {
    const value = item.data_bloqueio || item.data_bloqueio_confianca || item.data_suspensao || item.updated_at;
    if (value) return value;
  }
  return null;
}

export class ChatbotService {
  constructor(
    private readonly customers: ChatbotCustomerService = chatbotCustomerService,
    private readonly ai: ChatbotAIService = chatbotAIService,
    private readonly store: ChatbotConversationStore = chatbotConversationStore
  ) {}

  async handleMessage(input: ChatbotMessageRequest): Promise<ChatbotResponse> {
    if (process.env.CHATBOT_ENABLED === "false") {
      return { success: false, status: "erro", reply: "Atendimento automatico indisponivel no momento." };
    }

    const phone = normalizePhone(input.phone);
    if (!phone || !input.message?.trim()) {
      return { success: false, status: "erro", reply: "Mensagem invalida." };
    }

    ixcLogger.info("Mensagem recebida pelo chatbot", { phone: maskPhone(phone), source: input.source });

    const customer = await this.customers.findCustomerByPhone(phone);
    const conversation = await this.store.getOrCreate(phone, customer?.id, customer?.activeContract?.id);
    await this.store.addMessage({
      conversationId: conversation.id,
      direction: "IN",
      content: input.message,
      origin: input.source || "api",
      externalMessageId: input.externalMessageId,
      createdAt: new Date().toISOString(),
    });

    if (!customer) {
      const reply = "Nao encontrei seu cadastro por esse numero. Pode me informar CPF ou CNPJ para localizar seu atendimento?";
      await this.persistReply(conversation.id, reply, "WAITING_CUSTOMER");
      return { success: true, reply, status: "identificacao", conversationId: conversation.id };
    }

    const history = await this.store.listMessages(phone, Number(process.env.CHATBOT_MAX_HISTORY || 12));
    const intent = await this.ai.interpret(
      input.message,
      history.map((item) => ({
        role: item.direction === "IN" ? "user" : "assistant",
        content: item.content,
      }))
    );

    const blocked = customer.logins.some(isLoginBlocked);
    const openInvoice = hasOpenInvoice(customer.invoices);
    const paymentConfirmed = hasConfirmedPayment(customer.invoices);
    const blockDate = extractBlockDate(customer);
    const blockedDays = calculateBlockedDays(blockDate);
    const bucket = classifyBlockedCustomer(blockedDays);
    const funnelState = nextFunnelState({ blocked, openInvoice, paymentConfirmed, requiresHuman: intent.requiresHuman });

    let deterministicReply = this.buildReply({
      customer,
      blocked,
      openInvoice,
      paymentConfirmed,
      blockedDays,
      bucket,
      intent: intent.intent,
      requiresHuman: intent.requiresHuman,
    });

    const reply = await this.ai.generateReply({ message: input.message, intent, deterministicReply });
    const status = intent.requiresHuman ? "humano" : blocked ? "reativacao" : openInvoice ? "financeiro" : "suporte";
    await this.persistReply(conversation.id, reply, intent.requiresHuman ? "WAITING_HUMAN" : "BOT", funnelState);
    await this.store.addEvent({
      type: intent.requiresHuman ? "handoff_humano" : "chatbot_reply",
      conversationId: conversation.id,
      customerId: customer.id,
      intent: intent.intent,
      funnelState,
    });

    ixcLogger.info("Resposta gerada pelo chatbot", {
      phone: maskPhone(phone),
      customerId: customer.id,
      intent: intent.intent,
      status,
    });

    return {
      success: true,
      reply,
      customer: { id: customer.id, name: customer.name },
      status,
      conversationId: conversation.id,
      intent: intent.intent,
    };
  }

  private buildReply(params: {
    customer: ChatbotCustomer;
    blocked: boolean;
    openInvoice: boolean;
    paymentConfirmed: boolean;
    blockedDays: number | null;
    bucket: string;
    intent: string;
    requiresHuman: boolean;
  }): string {
    const name = firstName(params.customer.name);

    if (params.requiresHuman) {
      return "Claro. Vou encaminhar seu atendimento para nossa equipe. So um momento.";
    }

    if (params.intent === "PAGAMENTO_REALIZADO") {
      if (params.paymentConfirmed && !params.openInvoice) {
        return `${name}, vou verificar a confirmacao no sistema e encaminhar o fluxo permitido de reativacao.`;
      }
      return `${name}, ainda nao posso confirmar o pagamento por aqui. Se voce ja pagou, envie o comprovante para nossa equipe analisar.`;
    }

    if (params.blocked) {
      if (params.bucket === "MORE_THAN_15_DAYS") {
        return `${name}, encontrei seu contrato e ele parece bloqueado ha mais de 15 dias. Posso encaminhar para nossa equipe verificar possibilidades de regularizacao.`;
      }
      return `${name}, encontrei seu contrato. Posso te ajudar com a regularizacao. Voce ja realizou o pagamento ou precisa da segunda via?`;
    }

    if (params.openInvoice && ["SEGUNDA_VIA", "PIX", "VALOR_FATURA", "VENCIMENTO", "PAGAMENTO"].includes(params.intent)) {
      return `${name}, encontrei fatura em aberto no seu cadastro. Posso orientar com segunda via ou PIX sem confirmar pagamento antes da baixa no sistema.`;
    }

    return `Ola, ${name}. Encontrei seu cadastro. Como posso te ajudar agora?`;
  }

  private async persistReply(conversationId: string, reply: string, status: any, funnelState?: any): Promise<void> {
    await this.store.addMessage({
      conversationId,
      direction: "OUT",
      content: reply,
      origin: "bot",
      createdAt: new Date().toISOString(),
    });
    await this.store.updateConversation(conversationId, { status, funnelState });
  }
}

export const chatbotService = new ChatbotService();
