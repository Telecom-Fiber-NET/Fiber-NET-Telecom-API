import { z } from "zod";
import { activeAIProvider } from "../services/ai";
import { AIMessage, IAIProvider } from "../services/ai/providers/IAIProvider";
import { ixcLogger } from "../utils/logger";
import { CHATBOT_SYSTEM_PROMPT, INTENT_PROMPT } from "./prompts";
import { ChatbotAIResult, ChatbotIntent } from "./types";
import { parseJsonObject } from "./utils";

const intentSchema = z.object({
  intent: z.enum([
    "SAUDACAO",
    "SEGUNDA_VIA",
    "PIX",
    "PAGAMENTO",
    "PAGAMENTO_REALIZADO",
    "COMPROVANTE",
    "INTERNET_BLOQUEADA",
    "REATIVACAO",
    "NEGOCIACAO",
    "VALOR_FATURA",
    "VENCIMENTO",
    "SUPORTE",
    "SEM_CONEXAO",
    "CANCELAMENTO",
    "MUDANCA_PLANO",
    "ATENDENTE",
    "OUTROS",
  ]),
  confidence: z.number().min(0).max(1).default(0.5),
  entities: z.record(z.string(), z.unknown()).default({}),
  requiresHuman: z.boolean().default(false),
});

const humanKeywords = ["atendente", "humano", "pessoa", "cancelar", "cancelamento", "reclamacao", "reclamação", "procon"];
const paidKeywords = ["ja paguei", "já paguei", "paguei", "pagamento feito", "comprovante"];
const blockedKeywords = ["bloqueada", "bloqueado", "sem internet", "reativar", "reativacao", "reativação"];

function fallbackIntent(message: string): ChatbotAIResult {
  const text = message.toLowerCase();
  const requiresHuman = humanKeywords.some((keyword) => text.includes(keyword));

  let intent: ChatbotIntent = "OUTROS";
  if (/^(oi|ola|olá|bom dia|boa tarde|boa noite)\b/.test(text)) intent = "SAUDACAO";
  if (blockedKeywords.some((keyword) => text.includes(keyword))) intent = "INTERNET_BLOQUEADA";
  if (paidKeywords.some((keyword) => text.includes(keyword))) intent = "PAGAMENTO_REALIZADO";
  if (text.includes("pix")) intent = "PIX";
  if (text.includes("segunda via") || text.includes("boleto")) intent = "SEGUNDA_VIA";
  if (requiresHuman) intent = text.includes("cancel") ? "CANCELAMENTO" : "ATENDENTE";

  return { intent, confidence: 0.7, entities: {}, requiresHuman };
}

export class ChatbotAIService {
  constructor(private readonly provider: IAIProvider = activeAIProvider) {}

  async interpret(message: string, history: { role: "user" | "assistant"; content: string }[] = []): Promise<ChatbotAIResult> {
    if (!this.provider.config.apiKey) return fallbackIntent(message);

    const messages: AIMessage[] = [
      { role: "system", content: CHATBOT_SYSTEM_PROMPT },
      { role: "system", content: INTENT_PROMPT },
      ...history.slice(-6),
      { role: "user", content: message },
    ];

    try {
      const response = await this.provider.chat(messages, { temperature: 0.1, maxTokens: 300 });
      const parsed = parseJsonObject<unknown>(response.content);
      const validation = intentSchema.safeParse(parsed);
      if (validation.success) return validation.data;
      ixcLogger.warn("IA retornou JSON de intencao invalido", { content: response.content });
    } catch (error) {
      ixcLogger.warn("Falha ao interpretar mensagem com IA; usando fallback", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return fallbackIntent(message);
  }

  async generateReply(params: {
    message: string;
    intent: ChatbotAIResult;
    deterministicReply: string;
  }): Promise<string> {
    if (!this.provider.config.apiKey) return params.deterministicReply;

    try {
      const response = await this.provider.chat(
        [
          { role: "system", content: CHATBOT_SYSTEM_PROMPT },
          {
            role: "system",
            content: "Reescreva a resposta aprovada abaixo em tom natural, sem adicionar fatos, valores ou promessas.",
          },
          { role: "user", content: `Mensagem do cliente: ${params.message}\nResposta aprovada: ${params.deterministicReply}` },
        ],
        { temperature: 0.3, maxTokens: 500 }
      );
      return response.content.trim() || params.deterministicReply;
    } catch {
      return params.deterministicReply;
    }
  }
}

export const chatbotAIService = new ChatbotAIService();
