import { Request } from "express";
import { z } from "zod";
import { chatbotService } from "../chatbot/service";
import { normalizePhone } from "../chatbot/utils";
import { ixcLogger } from "../utils/logger";
import { OpenWAService, openWAService } from "./openwa.service";

const processedMessages = new Map<string, number>();

const webhookSchema = z.object({
  id: z.string().optional(),
  messageId: z.string().optional(),
  from: z.string().optional(),
  phone: z.string().optional(),
  body: z.string().optional(),
  text: z.string().optional(),
  type: z.string().optional(),
  isGroupMsg: z.boolean().optional(),
  fromMe: z.boolean().optional(),
});

function pruneProcessedMessages(): void {
  const cutoff = Date.now() - 1000 * 60 * 60 * 6;
  for (const [key, timestamp] of processedMessages.entries()) {
    if (timestamp < cutoff) processedMessages.delete(key);
  }
}

export class WhatsAppWebhookService {
  constructor(private readonly openwa: OpenWAService = openWAService) {}

  validateSecret(req: Request): boolean {
    const secret = process.env.OPENWA_WEBHOOK_SECRET;
    if (!secret) return true;
    return req.header("x-openwa-secret") === secret || req.header("x-webhook-secret") === secret;
  }

  async handle(payload: unknown): Promise<{ ignored?: true; duplicate?: true; reply?: string }> {
    pruneProcessedMessages();
    const parsed = webhookSchema.safeParse(payload);
    if (!parsed.success) throw new Error("Payload do webhook invalido");

    const event = parsed.data;
    const messageId = event.id || event.messageId;
    if (messageId && processedMessages.has(messageId)) return { duplicate: true };
    if (messageId) processedMessages.set(messageId, Date.now());

    if (event.isGroupMsg || event.fromMe) return { ignored: true };
    const message = event.body || event.text || "";
    const phone = normalizePhone(event.phone || event.from || "");
    if (!phone || !message.trim()) return { ignored: true };

    ixcLogger.info("Webhook WhatsApp recebido", { messageId, phone });
    const result = await chatbotService.handleMessage({
      phone,
      message,
      source: "whatsapp",
      externalMessageId: messageId,
    });

    if (result.reply) await this.openwa.sendText(phone, result.reply);
    return { reply: result.reply };
  }
}

export const whatsAppWebhookService = new WhatsAppWebhookService();
