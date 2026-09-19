import { Router } from "express";
import { simpleRateLimit } from "../middleware/rateLimit";
import { listConversationsByPhone, receiveChatbotMessage } from "./controller";

export const chatbotRoutes = Router();

chatbotRoutes.use(simpleRateLimit({ windowMs: 60_000, max: 60 }));
chatbotRoutes.post("/message", receiveChatbotMessage);
chatbotRoutes.get("/conversations/:phone", listConversationsByPhone);
