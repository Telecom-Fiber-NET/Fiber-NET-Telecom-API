import { WhatsAppWebhookService } from "./webhook.service";
import { chatbotService } from "../chatbot/service";

jest.mock("../chatbot/service", () => ({
  chatbotService: {
    handleMessage: jest.fn(),
  },
}));

describe("WhatsAppWebhookService", () => {
  it("ignora mensagem duplicada", async () => {
    (chatbotService.handleMessage as jest.Mock).mockResolvedValue({ reply: "ok" });
    const openwa = { sendText: jest.fn().mockResolvedValue(undefined) };
    const service = new WhatsAppWebhookService(openwa as any);

    await service.handle({ id: "msg1", from: "5524999999999", body: "oi" });
    const second = await service.handle({ id: "msg1", from: "5524999999999", body: "oi" });

    expect(second.duplicate).toBe(true);
    expect(chatbotService.handleMessage).toHaveBeenCalledTimes(1);
  });

  it("ignora grupos e mensagens do proprio bot", async () => {
    const service = new WhatsAppWebhookService({ sendText: jest.fn() } as any);
    await expect(service.handle({ id: "group1", isGroupMsg: true, from: "5524", body: "oi" })).resolves.toEqual({ ignored: true });
    await expect(service.handle({ id: "bot1", fromMe: true, from: "5524", body: "oi" })).resolves.toEqual({ ignored: true });
  });

  it("aceita envelope de webhook do OpenWA", async () => {
    (chatbotService.handleMessage as jest.Mock).mockResolvedValue({ reply: "resposta" });
    const openwa = { sendText: jest.fn().mockResolvedValue(undefined) };
    const service = new WhatsAppWebhookService(openwa as any);

    const result = await service.handle({
      event: "message.received",
      data: {
        id: "msg-openwa",
        sender: "5524999999999@c.us",
        chatId: "5524999999999@c.us",
        body: "oi",
        isGroup: false,
        fromMe: false,
      },
    });

    expect(result.reply).toBe("resposta");
    expect(chatbotService.handleMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: "5524999999999",
        message: "oi",
        externalMessageId: "msg-openwa",
      })
    );
  });
});
