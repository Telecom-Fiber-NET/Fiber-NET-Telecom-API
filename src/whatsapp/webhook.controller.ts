import { Request, Response } from "express";
import { z } from "zod";
import { openWAService } from "./openwa.service";
import { whatsAppWebhookService } from "./webhook.service";

const sendSchema = z.object({
  phone: z.string().min(8),
  message: z.string().min(1).max(4000),
});

export async function receiveWhatsAppWebhook(req: Request, res: Response) {
  if (!whatsAppWebhookService.validateSecret(req)) {
    return res.status(401).json({ success: false, error: "Webhook nao autorizado" });
  }

  try {
    const result = await whatsAppWebhookService.handle(req.body);
    return res.json({ success: true, ...result });
  } catch {
    return res.status(400).json({ success: false, error: "Webhook invalido" });
  }
}

export async function getWhatsAppStatus(_: Request, res: Response) {
  const status = await openWAService.getSessionStatus();
  return res.json({ success: true, status });
}

export async function sendWhatsAppMessage(req: Request, res: Response) {
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: "Payload invalido" });

  await openWAService.sendText(parsed.data.phone, parsed.data.message);
  return res.json({ success: true });
}
