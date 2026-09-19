import { Request, Response } from "express";
import { z } from "zod";
import { chatbotConversationStore } from "./conversationStore";
import { chatbotService } from "./service";
import { normalizePhone } from "./utils";

const messageSchema = z.object({
  phone: z.string().min(8),
  message: z.string().min(1).max(4000),
});

export async function receiveChatbotMessage(req: Request, res: Response) {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Payload invalido", detalhes: parsed.error.issues });
  }

  try {
    const result = await chatbotService.handleMessage({ ...parsed.data, source: "api" });
    return res.status(result.success ? 200 : 503).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: "Erro ao processar mensagem do chatbot" });
  }
}

export async function listConversationsByPhone(req: Request, res: Response) {
  const phone = normalizePhone(req.params.phone || "");
  if (!phone) return res.status(400).json({ error: "Telefone invalido" });

  const messages = await chatbotConversationStore.listMessages(phone, Number(process.env.CHATBOT_MAX_HISTORY || 50));
  return res.json({ success: true, phone, messages });
}
