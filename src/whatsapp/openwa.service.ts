import axios, { AxiosInstance } from "axios";
import { ixcLogger } from "../utils/logger";
import { normalizePhone } from "../chatbot/utils";

export class OpenWAService {
  private readonly client: AxiosInstance | null;
  private readonly session: string;

  constructor() {
    const baseURL = process.env.OPENWA_URL;
    this.session = process.env.OPENWA_SESSION || "default";
    this.client = baseURL
      ? axios.create({
          baseURL,
          timeout: Number(process.env.CHATBOT_TIMEOUT || 30000),
          headers: {
            "Content-Type": "application/json",
            ...(process.env.OPENWA_API_KEY ? { "X-API-Key": process.env.OPENWA_API_KEY } : {}),
          },
        })
      : null;
  }

  toChatId(phone: string): string {
    const normalized = normalizePhone(phone);
    if (phone.includes("@c.us") || phone.includes("@g.us")) return phone;
    return `${normalized}@c.us`;
  }

  async sendText(phone: string, message: string): Promise<void> {
    if (!this.client) {
      ixcLogger.warn("OpenWA nao configurado; mensagem nao enviada", { phone: normalizePhone(phone) });
      return;
    }

    await this.client.post(`/api/sessions/${this.session}/messages/send-text`, {
      chatId: this.toChatId(phone),
      text: message,
    });
  }

  async sendMedia(phone: string, media: { url?: string; base64?: string; caption?: string }): Promise<void> {
    if (!this.client) return;
    await this.client.post(`/api/sessions/${this.session}/messages/send-image`, {
      chatId: this.toChatId(phone),
      ...media,
    });
  }

  async getSessionStatus(): Promise<any> {
    if (!this.client) return { configured: false, status: "not_configured" };
    const { data } = await this.client.get(`/api/sessions/${this.session}`);
    return data;
  }

  async createSession(): Promise<any> {
    if (!this.client) return { configured: false };
    const { data } = await this.client.post("/api/sessions", { name: this.session });
    return data;
  }

  async disconnectSession(): Promise<any> {
    if (!this.client) return { configured: false };
    const { data } = await this.client.post(`/api/sessions/${this.session}/stop`);
    return data;
  }
}

export const openWAService = new OpenWAService();
