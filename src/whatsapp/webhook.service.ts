import { Request } from "express";
import { z } from "zod";
import crypto from "crypto";
import { chatbotService } from "../chatbot/service";
import { normalizePhone } from "../chatbot/utils";
import { ixcLogger } from "../utils/logger";
import { OpenWAService, openWAService } from "./openwa.service";

const processedMessages = new Map<string, number>();

const openWaMessageSchema = z.object({
  id: z.string().optional(),
  messageId: z.string().optional(),
  eventId: z.string().optional(),
  sender: z.string().optional(),
  recipient: z.string().optional(),
  chatId: z.string().optional(),
  from: z.string().optional(),
  phone: z.string().optional(),
  body: z.string().optional(),
  text: z.string().optional(),
  type: z.string().optional(),
  kind: z.string().optional(),
  isGroupMsg: z.boolean().optional(),
  isGroup: z.boolean().optional(),
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

    const signature = req.header("x-openwa-signature");
    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (signature && rawBody) {
      const expected = `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`;
      if (signature.length !== expected.length) return false;
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    }

    return req.header("x-openwa-secret") === secret || req.header("x-webhook-secret") === secret;
  }

  async handle(payload: unknown): Promise<{ ignored?: true; duplicate?: true; reply?: string }> {
    pruneProcessedMessages();
    const envelope = payload && typeof payload === "object" ? payload as Record<string, any> : {};
    const candidate = envelope.data && typeof envelope.data === "object" ? envelope.data : envelope;
    const parsed = openWaMessageSchema.safeParse(candidate);
    if (!parsed.success) throw new Error("Payload do webhook invalido");

    const event = parsed.data;
    const messageId = event.id || event.messageId || event.eventId || envelope.id || envelope.eventId;
    if (messageId && processedMessages.has(messageId)) return { duplicate: true };
    if (messageId) processedMessages.set(messageId, Date.now());

    const chatId = event.chatId || event.sender || event.from || event.phone || "";
    if (event.isGroupMsg || event.isGroup || chatId.endsWith("@g.us") || event.fromMe) return { ignored: true };
    const message = event.body || event.text || "";
    const phone = normalizePhone(event.sender || event.phone || event.from || chatId);
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
