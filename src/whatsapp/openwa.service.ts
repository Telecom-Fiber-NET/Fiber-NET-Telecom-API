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
            ...(process.env.OPENWA_API_KEY ? { Authorization: `Bearer ${process.env.OPENWA_API_KEY}` } : {}),
          },
        })
      : null;
  }

  async sendText(phone: string, message: string): Promise<void> {
    if (!this.client) {
      ixcLogger.warn("OpenWA nao configurado; mensagem nao enviada", { phone: normalizePhone(phone) });
      return;
    }

    await this.client.post("/sendText", {
      session: this.session,
      phone: normalizePhone(phone),
      message,
    });
  }

  async sendMedia(phone: string, media: { url?: string; base64?: string; caption?: string }): Promise<void> {
    if (!this.client) return;
    await this.client.post("/sendMedia", {
      session: this.session,
      phone: normalizePhone(phone),
      ...media,
    });
  }

  async getSessionStatus(): Promise<any> {
    if (!this.client) return { configured: false, status: "not_configured" };
    const { data } = await this.client.get(`/session/${this.session}/status`);
    return data;
  }

  async createSession(): Promise<any> {
    if (!this.client) return { configured: false };
    const { data } = await this.client.post("/session", { session: this.session });
    return data;
  }

  async disconnectSession(): Promise<any> {
    if (!this.client) return { configured: false };
    const { data } = await this.client.post(`/session/${this.session}/disconnect`);
    return data;
  }
}

export const openWAService = new OpenWAService();
