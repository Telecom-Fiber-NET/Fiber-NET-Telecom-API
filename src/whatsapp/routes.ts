import { Router } from "express";
import { simpleRateLimit } from "../middleware/rateLimit";
import { getWhatsAppStatus, receiveWhatsAppWebhook, sendWhatsAppMessage } from "./webhook.controller";

export const whatsappRoutes = Router();

whatsappRoutes.use(simpleRateLimit({ windowMs: 60_000, max: 120 }));
whatsappRoutes.post("/webhook", receiveWhatsAppWebhook);
whatsappRoutes.get("/status", getWhatsAppStatus);
whatsappRoutes.post("/send", sendWhatsAppMessage);
