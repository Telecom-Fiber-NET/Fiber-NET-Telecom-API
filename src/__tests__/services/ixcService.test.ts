import { IxcService } from "../../services/ixcServiceClass";
import { cacheManager } from "../../utils/cache";
import axios from "axios";

// Mock do axios
jest.mock("axios", () => {
  const mockAxiosInstance = {
    post: jest.fn(),
    put: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
    defaults: { headers: { common: {} } },
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };

  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockAxiosInstance),
      isAxiosError: jest.fn((payload: any) => payload && payload.isAxiosError),
    },
    // Export other named exports from axios if needed, e.g., AxiosError, AxiosInstance
    AxiosError: jest.fn(), // Mock AxiosError
    AxiosInstance: jest.fn(), // Mock AxiosInstance
  };
});
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock do logger
jest.mock("../../utils/logger", () => ({
  ixcLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    operation: jest.fn(),
  },
}));

describe("IxcService", () => {
  let ixcService: IxcService;

  beforeEach(() => {
    // Limpar mocks antes de cada teste
    jest.clearAllMocks();
    
    // Limpar cache
    cacheManager.flush();

    // Configurar variáveis de ambiente para testes
    process.env.IXC_API_URL = "https://api.test.com";
    process.env.IXC_ADMIN_TOKEN = "test_token";
    
    // Criar instância do serviço
    ixcService = new IxcService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // TESTES DE CLIENTES
  // ==========================================================================

  describe("buscarClientesPorCpf", () => {
    const mockCliente = {
      id: 123,
      razao: "João da Silva",
      fantasia: "João",
      cnpj_cpf: "12345678901",
      tipo_cliente: "F" as const,
      status: "A" as const,
      data_cadastro: "2024-01-01",
    };

    it("deve buscar clientes por CPF com sucesso", async () => {
      const axiosInstance = mockedAxios.create({});
      (axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: {
          registros: [mockCliente],
        },
      });

      const resultado = await ixcService.buscarClientesPorCpf("12345678901");

      expect(resultado).toHaveLength(1);
      expect(resultado[0]).toMatchObject(mockCliente);
      expect(axiosInstance.post).toHaveBeenCalledWith(
        expect.stringContaining("/cliente"),
        expect.objectContaining({
          qtype: "cliente.cnpj_cpf",
          query: "12345678901",
        })
      );
    });

    it("deve usar cache na segunda chamada", async () => {
      const axiosInstance = mockedAxios.create({});
      (axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: { registros: [mockCliente] },
      });

      // Primeira chamada - busca da API
      await ixcService.buscarClientesPorCpf("12345678901");

      // Segunda chamada - deve vir do cache
      const resultado = await ixcService.buscarClientesPorCpf("12345678901");

      // Axios deve ter sido chamado apenas uma vez
      expect(axiosInstance.post).toHaveBeenCalledTimes(1);
      expect(resultado).toHaveLength(1);
    });

    it("deve retornar array vazio quando não encontrar clientes", async () => {
      const axiosInstance = mockedAxios.create({});
      (axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: { registros: [] },
      });

      const resultado = await ixcService.buscarClientesPorCpf("00000000000");

      expect(resultado).toHaveLength(0);
    });

    it("deve lançar erro quando a API falhar", async () => {
      const axiosInstance = mockedAxios.create({});
      (axiosInstance.post as jest.Mock).mockRejectedValueOnce(
        new Error("Network error")
      );

      await expect(
        ixcService.buscarClientesPorCpf("12345678901")
      ).rejects.toThrow();
    });
  });

  describe("buscarClientePorEmail", () => {
    it("deve buscar cliente por email", async () => {
      const mockCliente = {
        id: 123,
        razao: "João da Silva",
        hotsite_email: "joao@test.com",
      };

      const axiosInstance = mockedAxios.create({});
      (axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: { registros: [mockCliente] },
      });

      const resultado = await ixcService.buscarClientePorEmail("joao@test.com");

      expect(resultado).toMatchObject(mockCliente);
    });

    it("deve retornar null quando não encontrar cliente", async () => {
      const axiosInstance = mockedAxios.create({});
      (axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: { registros: [] },
      });

      const resultado = await ixcService.buscarClientePorEmail("naoexiste@test.com");

      expect(resultado).toBeNull();
    });
  });

  // ==========================================================================
  // TESTES DE FINANCEIRO
  // ==========================================================================

  describe("financeiroListar", () => {
    const mockFatura = {
      id: 1,
      id_cliente: 123,
      documento: "123456",
      data_vencimento: "2024-12-31",
      valor: "100.00",
      status: "A" as const,
    };

    it("deve listar faturas do cliente", async () => {
      const axiosInstance = mockedAxios.create({});
      (axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: { registros: [mockFatura] },
      });

      const resultado = await ixcService.financeiroListar(123);

      expect(resultado).toHaveLength(1);
      expect(resultado[0]).toMatchObject(mockFatura);
    });

    it("deve usar cache nas chamadas subsequentes", async () => {
      const axiosInstance = mockedAxios.create({});
      (axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: { registros: [mockFatura] },
      });

      await ixcService.financeiroListar(123);
      await ixcService.financeiroListar(123);

      expect(axiosInstance.post).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // TESTES DE TICKETS
  // ==========================================================================

  describe("criarTicket", () => {
    const mockTicketPayload = {
      id_cliente: 123,
      assunto: "Problema de conexão",
      descricao: "Internet lenta",
      prioridade: "alta" as const,
    };

    const mockTicketResponse = {
      id: 456,
      protocolo: "TKT-2024-001",
      ...mockTicketPayload,
    };

    it("deve criar ticket com sucesso", async () => {
      const axiosInstance = mockedAxios.create({});
      (axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockTicketResponse,
      });

      const resultado = await ixcService.criarTicket(mockTicketPayload);

      expect(resultado).toMatchObject({
        id: 456,
        protocolo: "TKT-2024-001",
      });
      expect(axiosInstance.post).toHaveBeenCalledWith(
        expect.stringContaining("/su_ticket"),
        mockTicketPayload
      );
    });

    it("deve invalidar cache do cliente após criar ticket", async () => {
      const axiosInstance = mockedAxios.create({});
      (axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockTicketResponse,
      });

      const spyCacheInvalidate = jest.spyOn(cacheManager, "delMany");

      await ixcService.criarTicket(mockTicketPayload);

      expect(spyCacheInvalidate).toHaveBeenCalled();
    });

    it("deve lançar erro quando payload inválido", async () => {
      const axiosInstance = mockedAxios.create({});
      (axiosInstance.post as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 400,
          data: { message: "Payload inválido" },
        },
      });

      await expect(
        ixcService.criarTicket(mockTicketPayload)
      ).rejects.toThrow();
    });
  });

  // ==========================================================================
  // TESTES DE SENHA
  // ==========================================================================

  describe("alterarSenhaHotsite", () => {
    it("deve alterar senha com sucesso", async () => {
      const axiosInstance = mockedAxios.create({});
      (axiosInstance.put as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
      });

      const resultado = await ixcService.alterarSenhaHotsite(123, "NovaSenha@123");

      expect(resultado).toMatchObject({ success: true });
      expect(axiosInstance.put).toHaveBeenCalledWith(
        expect.stringContaining("/cliente/123"),
        { senha: "NovaSenha@123" }
      );
    });

    it("deve invalidar cache após alterar senha", async () => {
      const axiosInstance = mockedAxios.create({});
      (axiosInstance.put as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
      });

      const spyCacheInvalidate = jest.spyOn(cacheManager, "delMany");

      await ixcService.alterarSenhaHotsite(123, "NovaSenha@123");

      expect(spyCacheInvalidate).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // TESTES DE CONSUMO
  // ==========================================================================

  describe("getConsumoCompleto", () => {
    const mockLogin = {
      id: 1,
      id_cliente: 123,
      login: "teste",
      download_atual: "1000000",
      upload_atual: "500000",
      status: "A" as const,
    };

    it("deve retornar consumo completo", async () => {
      const axiosInstance = mockedAxios.create({});
      (axiosInstance.post as jest.Mock)
        .mockResolvedValueOnce({
          data: {
            registros: [
              { data: "2024-01-01", consumo: "100", consumo_upload: "50" },
            ],
          },
        })
        .mockResolvedValueOnce({
          data: {
            registros: [
              { data: "2024-01", consumo: "3000", consumo_upload: "1500" },
            ],
          },
        });

      const resultado = await ixcService.getConsumoCompleto(mockLogin);

      expect(resultado).toHaveProperty("total_download_bytes");
      expect(resultado).toHaveProperty("total_upload_bytes");
      expect(resultado.history).toHaveProperty("daily");
      expect(resultado.history).toHaveProperty("weekly");
      expect(resultado.history).toHaveProperty("monthly");
    });

    it("deve retornar valores zerados quando login não tem ID", async () => {
      const loginSemId = { ...mockLogin, id: undefined };

      const resultado = await ixcService.getConsumoCompleto(loginSemId as any);

      expect(resultado.total_download_bytes).toBe(0);
      expect(resultado.total_upload_bytes).toBe(0);
      expect(resultado.history.daily).toHaveLength(0);
    });
  });

  // ==========================================================================
  // TESTES DE UTILITÁRIOS
  // ==========================================================================

  describe("Utilitários", () => {
    it("deve limpar cache", () => {
      const spyFlush = jest.spyOn(cacheManager, "flush");

      ixcService.clearCache();

      expect(spyFlush).toHaveBeenCalled();
    });

    it("deve retornar estatísticas do cache", () => {
      const stats = ixcService.getCacheStats();

      expect(stats).toHaveProperty("keys");
      expect(stats).toHaveProperty("hits");
      expect(stats).toHaveProperty("misses");
    });

    it("deve testar conexão com sucesso", async () => {
      const axiosInstance = mockedAxios.create({});
      (axiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: { registros: [] },
      });

      const resultado = await ixcService.testConnection();

      expect(resultado).toBe(true);
    });

    it("deve retornar false quando conexão falhar", async () => {
      const axiosInstance = mockedAxios.create({});
      (axiosInstance.post as jest.Mock).mockRejectedValueOnce(
        new Error("Connection failed")
      );

      const resultado = await ixcService.testConnection();

      expect(resultado).toBe(false);
    });
  });
});