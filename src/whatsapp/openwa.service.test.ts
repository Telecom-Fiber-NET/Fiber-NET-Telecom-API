import axios from "axios";
import { OpenWAService } from "./openwa.service";

jest.mock("axios");

describe("OpenWAService", () => {
  const post = jest.fn();
  const get = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.OPENWA_URL = "http://openwa.test:2785";
    process.env.OPENWA_API_KEY = "test-key";
    process.env.OPENWA_SESSION = "session-123";
    (axios.create as jest.Mock).mockReturnValue({ post, get });
  });

  it("envia texto usando a API do rmyndharis/OpenWA", async () => {
    post.mockResolvedValue({ data: { ok: true } });
    const service = new OpenWAService();

    await service.sendText("5524999999999", "Ola");

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: "http://openwa.test:2785",
        headers: expect.objectContaining({ "X-API-Key": "test-key" }),
      })
    );
    expect(post).toHaveBeenCalledWith("/api/sessions/session-123/messages/send-text", {
      chatId: "5524999999999@c.us",
      text: "Ola",
    });
  });
});
