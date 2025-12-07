import axios, { AxiosInstance, AxiosError } from "axios";
import axiosRetry from "axios-retry";
import { ixcConfig, getHeaders, IxcEndpoints } from "../config/ixc.config";
import { ixcLogger } from "../utils/logger";
import {
  cacheManager,
  cacheOrFetch,
  clienteCacheKey,
  contratoCacheKey,
  faturasCacheKey,
  loginsCacheKey,
  consumoCacheKey,
  CacheTTL,
  invalidateClienteCache,
} from "../utils/cache";
import {
  Cliente,
  Contrato,
  Fatura,
  Login,
  Ont,
  OrdemServico,
  ConsumoCompleto,
  TicketPayload,
  TicketResponse,
  IxcApiError,
  IxcQueryPayload,
} from "../types/ixc.types";

/**
 * SERVIÇO IXC PROFISSIONAL COM:
 * - Retry automático
 * - Cache inteligente
 * - Logging estruturado
 * - Tratamento de erros robusto
 * - Tipagem completa
 */

export class IxcService {
  private axiosInstance: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = ixcConfig.baseUrl;
    this.axiosInstance = this.createAxiosInstance();
    this.setupRetryLogic();
    
    ixcLogger.info("IxcService inicializado", {
      baseUrl: this.baseUrl,
      cacheEnabled: ixcConfig.cacheEnabled,
      retries: ixcConfig.retries,
    });
  }

  // ==========================================================================
  // CONFIGURAÇÃO DO AXIOS
  // ==========================================================================

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      timeout: ixcConfig.timeout,
      headers: getHeaders(),
    });
  }

  private setupRetryLogic(): void {
    axiosRetry(this.axiosInstance, {
      retries: ixcConfig.retries || 3,
      retryDelay: (retryCount) => {
        const delay = retryCount * (ixcConfig.retryDelay || 1000);
        ixcLogger.warn(`Tentando novamente... Tentativa ${retryCount}`, { delay });
        return delay;
      },
      retryCondition: (error: AxiosError) => {
        // Retry em erros de rede ou 5xx
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response?.status ?? 0) >= 500
        );
      },
      onRetry: (retryCount, error, requestConfig) => {
        ixcLogger.warn("Retry executado", {
          retryCount,
          url: requestConfig.url,
          method: requestConfig.method,
        });
      },
    });
  }

  // ==========================================================================
  // MÉTODOS AUXILIARES INTERNOS
  // ==========================================================================

  private async fetchIxc<T = any>(
    endpoint: string,
    payload: Partial<IxcQueryPayload>
  ): Promise<T[]> {
    const url = `${this.baseUrl}/${endpoint}`;
    const startTime = Date.now();

    try {
      ixcLogger.operation(`Fetch ${endpoint}`, "start", { payload });

      const response = await this.axiosInstance.post(url, payload);
      const duration = Date.now() - startTime;

      ixcLogger.operation(`Fetch ${endpoint}`, "success", {
        duration: `${duration}ms`,
        results: response.data.registros?.length || 0,
      });

      return response.data.registros || [];
    } catch (error) {
      const duration = Date.now() - startTime;
      
      ixcLogger.operation(`Fetch ${endpoint}`, "error", {
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw this.handleError(error, endpoint);
    }
  }

  private handleError(error: unknown, context: string): IxcApiError {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      const statusCode = error.response?.status;

      ixcLogger.error(`Erro IXC em ${context}`, error, {
        statusCode,
        responseData: error.response?.data,
      });

      return new IxcApiError(
        `IXC API Error (${context}): ${message}`,
        statusCode,
        error
      );
    }

    ixcLogger.error(`Erro desconhecido em ${context}`, error);
    return new IxcApiError(`Erro desconhecido em ${context}`);
  }

  // ==========================================================================
  // CLIENTES
  // ==========================================================================

  async buscarClientesPorCpf(cpfCnpj: string): Promise<Cliente[]> {
    return cacheOrFetch(
      clienteCacheKey(cpfCnpj),
      async () => {
        return await this.fetchIxc<Cliente>(IxcEndpoints.CLIENTE, {
          qtype: "cliente.cnpj_cpf",
          query: cpfCnpj,
          oper: "=",
          page: "1",
          rp: "100",
          sortname: "cliente.id",
          sortorder: "desc",
        });
      },
      CacheTTL.CLIENTE
    );
  }

  async buscarClientePorEmail(email: string): Promise<Cliente | null> {
    return cacheOrFetch(
      clienteCacheKey(email),
      async () => {
        const registros = await this.fetchIxc<Cliente>(IxcEndpoints.CLIENTE, {
          qtype: "cliente.hotsite_email",
          query: email,
          oper: "=",
          page: "1",
          rp: "1",
          sortname: "cliente.id",
          sortorder: "desc",
        });

        return registros.length > 0 ? registros[0] : null;
      },
      CacheTTL.CLIENTE
    );
  }

  async buscarClientePorId(id: number): Promise<Cliente | null> {
    return cacheOrFetch(
      clienteCacheKey(id),
      async () => {
        const registros = await this.fetchIxc<Cliente>(IxcEndpoints.CLIENTE, {
          qtype: "cliente.id",
          query: String(id),
          oper: "=",
          page: "1",
          rp: "1",
          sortname: "cliente.id",
          sortorder: "asc",
        });

        return registros[0] || null;
      },
      CacheTTL.CLIENTE
    );
  }

  // ==========================================================================
  // CONTRATOS
  // ==========================================================================

  async buscarContratosPorIdCliente(id_cliente: number): Promise<Contrato[]> {
    return cacheOrFetch(
      contratoCacheKey(id_cliente),
      async () => {
        return await this.fetchIxc<Contrato>(IxcEndpoints.CLIENTE_CONTRATO, {
          qtype: "cliente_contrato.id_cliente",
          query: String(id_cliente),
          oper: "=",
          page: "1",
          rp: "100",
          sortname: "cliente_contrato.id",
          sortorder: "desc",
        });
      },
      CacheTTL.CONTRATO
    );
  }

  // ==========================================================================
  // FINANCEIRO
  // ==========================================================================

  async financeiroListar(id_cliente: number): Promise<Fatura[]> {
    return cacheOrFetch(
      faturasCacheKey(id_cliente),
      async () => {
        return await this.fetchIxc<Fatura>(IxcEndpoints.FINANCEIRO, {
          qtype: "fn_areceber.id_cliente",
          query: String(id_cliente),
          oper: "=",
          page: "1",
          rp: "50",
          sortname: "fn_areceber.data_vencimento",
          sortorder: "desc",
        });
      },
      CacheTTL.FATURA
    );
  }

  // ==========================================================================
  // LOGINS
  // ==========================================================================

  async loginsListar(id_cliente: number): Promise<Login[]> {
    return cacheOrFetch(
      loginsCacheKey(id_cliente),
      async () => {
        return await this.fetchIxc<Login>(IxcEndpoints.LOGINS, {
          qtype: "radusuarios.id_cliente",
          query: String(id_cliente),
          oper: "=",
          page: "1",
          rp: "20",
          sortname: "radusuarios.id",
          sortorder: "desc",
        });
      },
      CacheTTL.LOGIN
    );
  }

  async ontListar(id_login: number): Promise<Ont[]> {
    return await this.fetchIxc<Ont>(IxcEndpoints.ONT, {
      qtype: "radpop_radio_cliente_fibra.id_login",
      query: String(id_login),
      oper: "=",
      page: "1",
      rp: "1",
      sortname: "radpop_radio_cliente_fibra.id",
      sortorder: "desc",
    });
  }

  // ==========================================================================
  // CONSUMO
  // ==========================================================================

  async getConsumoCompleto(login: Login): Promise<ConsumoCompleto> {
    if (!login.id) {
      return {
        total_download_bytes: 0,
        total_upload_bytes: 0,
        history: { daily: [], weekly: [], monthly: [] },
      };
    }

    return cacheOrFetch(
      consumoCacheKey(login.id),
      async () => {
        const totalDownload = parseFloat(login.download_atual || "0");
        const totalUpload = parseFloat(login.upload_atual || "0");

        const [dailyRes, monthlyRes] = await Promise.all([
          this.fetchIxc(IxcEndpoints.CONSUMO_DIARIO, {
            qtype: "id_login",
            query: String(login.id),
            oper: "=",
            page: "1",
            rp: "30",
            sortname: "data",
            sortorder: "desc",
          }),
          this.fetchIxc(IxcEndpoints.CONSUMO_MENSAL, {
            qtype: "id_login",
            query: String(login.id),
            oper: "=",
            page: "1",
            rp: "12",
            sortname: "data",
            sortorder: "desc",
          }),
        ]);

        const daily = dailyRes
          .map((d: any) => ({
            data: d.data ? d.data.split(" ")[0] : d.data,
            download_bytes: parseFloat(d.consumo || "0"),
            upload_bytes: parseFloat(d.consumo_upload || "0"),
          }))
          .reverse();

        const weekly = daily.slice(-7);

        const monthly = monthlyRes
          .map((m: any) => ({
            mes_ano: m.data ? m.data.substring(0, 7) : "",
            download_bytes: parseFloat(m.consumo || "0"),
            upload_bytes: parseFloat(m.consumo_upload || "0"),
          }))
          .reverse();

        return {
          total_download_bytes: totalDownload,
          total_upload_bytes: totalUpload,
          history: { daily, weekly, monthly },
        };
      },
      CacheTTL.CONSUMO
    );
  }

  // ==========================================================================
  // ORDENS DE SERVIÇO E TICKETS
  // ==========================================================================

  async ordensServicoListar(id_cliente: number): Promise<OrdemServico[]> {
    return await this.fetchIxc<OrdemServico>(IxcEndpoints.ORDEM_SERVICO, {
      qtype: "su_oss_chamado.id_cliente",
      query: String(id_cliente),
      oper: "=",
      page: "1",
      rp: "20",
      sortname: "su_oss_chamado.id",
      sortorder: "desc",
    });
  }

  async criarTicket(payload: TicketPayload): Promise<TicketResponse> {
    const url = `${this.baseUrl}/${IxcEndpoints.TICKET}`;
    
    try {
      ixcLogger.operation("Criar Ticket", "start", { payload });

      const response = await this.axiosInstance.post(url, payload);

      ixcLogger.operation("Criar Ticket", "success", {
        ticketId: response.data.id,
      });

      // Invalidar cache do cliente
      invalidateClienteCache(payload.id_cliente);

      return {
        id: response.data.id || response.data.retorno_id || response.data.protocolo,
        protocolo: response.data.protocolo,
        ...response.data,
      };
    } catch (error) {
      ixcLogger.operation("Criar Ticket", "error", { error });
      throw this.handleError(error, "criarTicket");
    }
  }

  // ==========================================================================
  // GERENCIAMENTO DE CONTA
  // ==========================================================================

  async alterarSenhaHotsite(
    clienteId: number,
    novaSenha: string
  ): Promise<any> {
    const url = `${this.baseUrl}/${IxcEndpoints.CLIENTE}/${clienteId}`;

    try {
      ixcLogger.operation("Alterar Senha", "start", { clienteId });

      const response = await this.axiosInstance.put(url, { senha: novaSenha });

      ixcLogger.operation("Alterar Senha", "success", { clienteId });

      // Invalidar cache do cliente
      invalidateClienteCache(clienteId);

      return response.data;
    } catch (error) {
      ixcLogger.operation("Alterar Senha", "error", { clienteId, error });
      throw this.handleError(error, "alterarSenhaHotsite");
    }
  }

  // ==========================================================================
  // UTILITÁRIOS
  // ==========================================================================

  /**
   * Limpa todo o cache do serviço
   */
  clearCache(): void {
    cacheManager.flush();
    ixcLogger.info("Cache do IxcService limpo");
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats() {
    return cacheManager.getStats();
  }

  /**
   * Testa a conexão com a API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.fetchIxc(IxcEndpoints.CLIENTE, {
        page: "1",
        rp: "1",
      });
      return true;
    } catch {
      return false;
    }
  }
}

// ==========================================================================
// INSTÂNCIA SINGLETON (compatibilidade com código existente)
// ==========================================================================

export const ixcService = new IxcService();

// Export default para facilitar imports
export default ixcService;