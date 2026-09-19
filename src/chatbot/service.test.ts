import { ChatbotService } from "./service";

describe("ChatbotService", () => {
  const customer = {
    id: 2984,
    name: "JOAO PEDRO",
    contracts: [{ id: 10, id_cliente: 2984, id_plano: 1, valor: "89.90", data_ativacao: "2026-01-01", status: "A", tipo_contrato: "I", dia_vencimento: 10 }],
    activeContract: { id: 10, id_cliente: 2984, id_plano: 1, valor: "89.90", data_ativacao: "2026-01-01", status: "A", tipo_contrato: "I", dia_vencimento: 10 },
    invoices: [{ id: 1, id_cliente: 2984, documento: "1", data_vencimento: "2026-09-01", valor: "89.90", status: "A" }],
    logins: [{ id: 1, id_cliente: 2984, login: "joao", status: "B" }],
  } as any;

  const makeStore = () => ({
    getOrCreate: jest.fn().mockResolvedValue({ id: "conv1", phone: "5524999999999", status: "OPEN" }),
    addMessage: jest.fn().mockResolvedValue(undefined),
    listMessages: jest.fn().mockResolvedValue([]),
    updateConversation: jest.fn().mockResolvedValue({ id: "conv1" }),
    addEvent: jest.fn().mockResolvedValue(undefined),
  });

  it("solicita CPF/CNPJ quando cliente nao e encontrado", async () => {
    const store = makeStore();
    const service = new ChatbotService(
      { findCustomerByPhone: jest.fn().mockResolvedValue(null) } as any,
      { interpret: jest.fn(), generateReply: jest.fn() } as any,
      store as any
    );

    const response = await service.handleMessage({ phone: "24999999999", message: "oi" });
    expect(response.status).toBe("identificacao");
    expect(response.reply).toContain("CPF ou CNPJ");
  });

  it("encaminha para reativacao quando login esta bloqueado", async () => {
    const store = makeStore();
    const service = new ChatbotService(
      { findCustomerByPhone: jest.fn().mockResolvedValue(customer) } as any,
      {
        interpret: jest.fn().mockResolvedValue({ intent: "INTERNET_BLOQUEADA", confidence: 0.9, entities: {}, requiresHuman: false }),
        generateReply: jest.fn(({ deterministicReply }) => deterministicReply),
      } as any,
      store as any
    );

    const response = await service.handleMessage({ phone: "24999999999", message: "Minha internet esta bloqueada" });
    expect(response.status).toBe("reativacao");
    expect(response.customer?.id).toBe(2984);
  });

  it("encaminha para humano quando a intencao exige", async () => {
    const store = makeStore();
    const service = new ChatbotService(
      { findCustomerByPhone: jest.fn().mockResolvedValue(customer) } as any,
      {
        interpret: jest.fn().mockResolvedValue({ intent: "ATENDENTE", confidence: 0.9, entities: {}, requiresHuman: true }),
        generateReply: jest.fn(({ deterministicReply }) => deterministicReply),
      } as any,
      store as any
    );

    const response = await service.handleMessage({ phone: "24999999999", message: "quero atendente" });
    expect(response.status).toBe("humano");
  });
});
