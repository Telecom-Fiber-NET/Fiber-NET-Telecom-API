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
  ClienteArquivo,
  IxcAssunto,
  TicketInteracao,
  GridParam
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

  /**
   * Helper para construir consultas complexas usando grid_param
   */
  public buildGridParam(filters: GridParam[]): string {
    return JSON.stringify(filters);
  }

  // ==========================================================================
  // MÉTODOS CRUD GENÉRICOS
  // ==========================================================================

  /**
   * Inserção genérica (POST)
   */
  async create<T = any>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`;
    try {
      ixcLogger.operation(`Create ${endpoint}`, "start", { data });
      const response = await this.axiosInstance.post(url, data);
      ixcLogger.operation(`Create ${endpoint}`, "success", { id: response.data.id });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `create:${endpoint}`);
    }
  }

  /**
   * Edição genérica (PUT)
   */
  async update<T = any>(endpoint: string, id: number | string, data: any): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}/${id}`;
    try {
      ixcLogger.operation(`Update ${endpoint}`, "start", { id, data });
      const response = await this.axiosInstance.put(url, data);
      ixcLogger.operation(`Update ${endpoint}`, "success", { id });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `update:${endpoint}`);
    }
  }

  /**
   * Exclusão genérica (DELETE)
   */
  async delete(endpoint: string, id: number | string): Promise<any> {
    const url = `${this.baseUrl}/${endpoint}/${id}`;
    try {
      ixcLogger.operation(`Delete ${endpoint}`, "start", { id });
      const response = await this.axiosInstance.delete(url);
      ixcLogger.operation(`Delete ${endpoint}`, "success", { id });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `delete:${endpoint}`);
    }
  }

  /**
   * Ação genérica via POST (para botões e rotas especiais)
   */
  async executeAction(endpoint: string, payload: any): Promise<any> {
    const url = `${this.baseUrl}/${endpoint}`;
    try {
      ixcLogger.operation(`Action ${endpoint}`, "start", { payload });
      const response = await this.axiosInstance.post(url, payload);
      ixcLogger.operation(`Action ${endpoint}`, "success");
      return response.data;
    } catch (error) {
      throw this.handleError(error, `action:${endpoint}`);
    }
  }

  // ==========================================================================
  // CLIENTES
  // ==========================================================================

  async buscarClientesPorCpf(cpfCnpj: string): Promise<Cliente[]> {
    const cpfLimpo = cpfCnpj.replace(/\D/g, "");

    return cacheOrFetch(
      clienteCacheKey(cpfLimpo),
      async () => {
        // Tenta buscar pelo limpo
        let clientes = await this.fetchIxc<Cliente>(IxcEndpoints.CLIENTE, {
          qtype: "cliente.cnpj_cpf",
          query: cpfLimpo,
          oper: "=",
          page: "1",
          rp: "100",
          sortname: "cliente.id",
          sortorder: "desc",
        });

        if (clientes.length === 0) {
          console.log(`[DEBUG] Nenhum cliente encontrado para CPF/CNPJ: ${cpfLimpo}`);
          let cpfFormatado = cpfLimpo;
          if (cpfLimpo.length === 11) {
            cpfFormatado = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
          } else if (cpfLimpo.length === 14) {
            cpfFormatado = cpfLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
          }

          if (cpfFormatado !== cpfLimpo) {
            clientes = await this.fetchIxc<Cliente>(IxcEndpoints.CLIENTE, {
              qtype: "cliente.cnpj_cpf",
              query: cpfFormatado,
              oper: "=",
              page: "1",
              rp: "100",
              sortname: "cliente.id",
              sortorder: "desc",
            });
          }
        }
        return clientes;
      },
      CacheTTL.CLIENTE
    );
  }

  /**
   * Gerenciamento de arquivos do cliente
   */
  async listarArquivosCliente(clienteId: number): Promise<ClienteArquivo[]> {
    return await this.fetchIxc<ClienteArquivo>(IxcEndpoints.CLIENTE_ARQUIVOS, {
      qtype: "id_cliente",
      query: String(clienteId),
      oper: "=",
    });
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

  /**
   * Busca um contrato específico pelo ID
   */
  async buscarContratoPorId(id: number): Promise<Contrato | null> {
    const registros = await this.fetchIxc<Contrato>(IxcEndpoints.CLIENTE_CONTRATO, {
      qtype: "id",
      query: String(id),
      oper: "=",
      page: "1",
      rp: "1",
    });
    return registros[0] || null;
  }

  /**
   * Busca contratos com endereço resolvido (Híbrido: Contrato ou Cliente)
   */
  async buscarContratosDetalhados(id_cliente: number): Promise<any[]> {
    const contracts = await this.buscarContratosPorIdCliente(id_cliente);
    const client = await this.buscarClientePorId(id_cliente);

    return contracts.map((c: any) => {
      if (c.endereco_padrao_cliente === "S" && client) {
        return {
          ...c,
          endereco: client.endereco,
          numero: client.numero,
          bairro: client.bairro,
          cidade: client.cidade,
          uf: client.uf,
          cep: client.cep,
          complemento: client.complemento,
        };
      }
      return c;
    });
  }

  /**
   * Realiza o Desbloqueio de Confiança
   */
  async desbloqueioConfianca(id_contrato: number): Promise<any> {
    return this.executeAction(`cliente_contrato_desbloqueio_confianca/${id_contrato}`, {});
  }

  async imprimirContrato(id: number): Promise<string | null> {
    const data = await this.executeAction("cliente_contrato_imprimir_contrato_17678", { id: String(id) });
    return data.base64 || data;
  }

  async imprimirTermo(id: number): Promise<string | null> {
    const data = await this.executeAction("cliente_contrato_termo_imprimir_termo", { id: String(id), base64: "S" });
    return data.base64 || data;
  }

  async listarTermosPendentes(id_contrato: number): Promise<any[]> {
    return await this.fetchIxc(IxcEndpoints.TERMO_CONTRATO, {
      qtype: "id_contrato",
      query: String(id_contrato),
      oper: "=",
    });
  }

  async assinarTermo(id_termo: number, ip: string): Promise<any> {
    return this.update(IxcEndpoints.TERMO_CONTRATO, id_termo, {
      status: "A",
      data_aceite: new Date().toISOString().slice(0, 19).replace("T", " "),
      ip_aceite: ip,
    });
  }

  // ==========================================================================
  // FINANCEIRO
  // ==========================================================================

  async financeiroListar(id_cliente: number, id_contrato?: number): Promise<Fatura[]> {
    return cacheOrFetch(
      faturasCacheKey(`${id_cliente}-${id_contrato || "all"}`),
      async () => {
        const payload: Partial<IxcQueryPayload> = {
          qtype: id_contrato ? "fn_areceber.id_contrato" : "fn_areceber.id_cliente",
          query: String(id_contrato || id_cliente),
          oper: "=",
          page: "1",
          rp: "50",
          sortname: "fn_areceber.data_vencimento",
          sortorder: "desc",
        };
        return await this.fetchIxc<Fatura>(IxcEndpoints.FINANCEIRO, payload);
      },
      CacheTTL.FATURA
    );
  }

  async listarNotasFiscais(id_cliente: number, id_contrato?: number): Promise<any[]> {
    const [saidasModel21, saidasVendas] = await Promise.all([
      this.fetchIxc(IxcEndpoints.NOTAS_FISCAIS, {
        qtype: id_contrato ? "id_contrato" : "id_cliente",
        query: String(id_contrato || id_cliente),
        oper: "=",
        sortname: "data_emissao",
        sortorder: "desc",
      }),
      this.fetchIxc("vd_saida", {
        qtype: id_contrato ? "id_contrato" : "id_cliente",
        query: String(id_contrato || id_cliente),
        oper: "=",
        sortname: "data_saida",
        sortorder: "desc",
      })
    ]);

    // Filtra vd_saida para pegar apenas as que tem número de NF (evitar lixo/pré-vendas)
    const vendasComNf = saidasVendas.filter((v: any) => v.numero_nf && v.numero_nf !== "");

    // Normaliza campos para o frontend (vd_saida usa numero_nf, fn_saida usa numero_nota/numero_nf)
    const normalizadas = vendasComNf.map((v: any) => ({
      ...v,
      numero_nota: v.numero_nf,
      data_emissao: v.data_saida || v.data_emissao
    }));

    // Merge e remove duplicatas por ID
    const total = [...saidasModel21, ...normalizadas];
    const seen = new Set();
    return total.filter(item => {
      const duplicate = seen.has(item.id);
      seen.add(item.id);
      return !duplicate;
    });
  }

  async imprimirBoleto(id: number): Promise<string | null> {
    const payload = {
      boletos: String(id),
      juro: "N",
      multa: "N",
      atualiza_boleto: "S",
      tipo_boleto: "arquivo",
      base64: "S",
    };
    const data = await this.executeAction("get_boleto", payload);
    return data.base64 || data;
  }

  async imprimirNotaFiscal(id: number): Promise<string | null> {
    const data = await this.executeAction("get_nf", { id_saida: String(id), base64: "S" });
    return data.base64 || data;
  }

  async buscarBaixasDaFatura(idFatura: number | string): Promise<any[]> {
    return await this.fetchIxc(IxcEndpoints.RECEBER_BAIXAS, {
      qtype: "id_receber",
      query: String(idFatura),
      oper: "=",
    });
  }

  async getPixFatura(faturaId: number): Promise<any | null> {
    const url = `${this.baseUrl}/get_pix`;

    const payload = {
      id_areceber: String(faturaId),
      retornar_qrcode: "S",
    };

    try {
      ixcLogger.operation(`Get PIX Fatura ${faturaId}`, "start");
      const response = await this.axiosInstance.post(url, payload);
      const pixData = response.data;
      console.log("[IXC-PIX-DATA]", JSON.stringify(pixData));

      const pix = pixData.pix || pixData;
      
      const qrCode = pix.qrCode?.imagemQrcode || 
                     pix.pix_qrcode || 
                     pix.pix_qrcode_url || 
                     null;
                     
      const qrCodeText = pix.qrCode?.qrcode || 
                         pix.pix_copia_e_cola || 
                         pix.pix_txid || 
                         pix.pix_code ||
                         null;

      const valor = parseFloat(pix.dadosPix?.valor?.original || pix.valor || "0") || null;

      if (!qrCodeText && !qrCode) {
        ixcLogger.warn(`Resposta PIX sem dados válidos para fatura ${faturaId}`, { responseData: pixData });
        return null;
      }

      ixcLogger.operation(`Get PIX Fatura ${faturaId}`, "success");
      return {
        qrCode,
        qrCodeText,
        valor,
        status: pixData.status || pixData.type || "pendente",
      };
    } catch (error) {
      ixcLogger.operation(`Get PIX Fatura ${faturaId}`, "error", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw this.handleError(error, "getPixFatura");
    }
  }

  /**
   * Alias para getPixFatura para compatibilidade
   */
  async buscarPixDetalhado(faturaId: number): Promise<any | null> {
    const res = await this.getPixFatura(faturaId);
    if (!res) return null;
    return {
      pix: {
        qrCode: {
          qrcode: res.qrCodeText,
          imagemQrcode: res.qrCode
        }
      }
    };
  }

  // ==========================================================================
  // LOGINS
  // ==========================================================================

  async loginsListar(id_cliente: number, id_contrato?: number): Promise<Login[]> {
    return cacheOrFetch(
      loginsCacheKey(`${id_cliente}-${id_contrato || "all"}`),
      async () => {
        return await this.fetchIxc<Login>(IxcEndpoints.LOGINS, {
          qtype: id_contrato ? "radusuarios.id_contrato" : "radusuarios.id_cliente",
          query: String(id_contrato || id_cliente),
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

  async ontListar(id_login: number | string): Promise<Ont[]> {
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

  async limparMacLogin(id: number): Promise<any> {
    return this.update(IxcEndpoints.LOGINS, id, { mac: "" });
  }

  async desconectarLogin(id: number): Promise<any> {
    return this.update(IxcEndpoints.LOGINS, id, { online: "N" });
  }

  async getDiagnosticoLogin(id: number): Promise<any> {
    const login = await this.fetchIxc(IxcEndpoints.LOGINS, { qtype: "id", query: String(id), oper: "=" });
    const diagnostico = await this.fetchIxc(IxcEndpoints.DIAGNOSTICO, { qtype: "id_login", query: String(id), oper: "=" });

    return {
      login: login[0] || null,
      diagnostico: diagnostico[0] || null,
      status: login[0]?.online === "S" ? "Online" : "Offline",
    };
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

  async getConsumoDiario(id_login: number): Promise<any[]> {
    return await this.fetchIxc(IxcEndpoints.CONSUMO_DIARIO, {
      qtype: "id_login",
      query: String(id_login),
      oper: "=",
      page: "1",
      rp: "30",
      sortname: "data",
      sortorder: "desc",
    });
  }

  async getConsumoMensal(id_login: number): Promise<any[]> {
    return await this.fetchIxc(IxcEndpoints.CONSUMO_MENSAL, {
      qtype: "id_login",
      query: String(id_login),
      oper: "=",
      page: "1",
      rp: "12",
      sortname: "data",
      sortorder: "desc",
    });
  }

  // ==========================================================================
  // ORDENS DE SERVIÇO E TICKETS
  // ==========================================================================

  async ordensServicoListar(id_cliente: number, id_contrato?: number): Promise<OrdemServico[]> {
    return await this.fetchIxc<OrdemServico>(IxcEndpoints.ORDEM_SERVICO, {
      qtype: id_contrato ? "su_oss_chamado.id_contrato" : "su_oss_chamado.id_cliente",
      query: String(id_contrato || id_cliente),
      oper: "=",
      page: "1",
      rp: "20",
      sortname: "su_oss_chamado.id",
      sortorder: "desc",
    });
  }

  async buscarAssuntoOS(id_assunto: number): Promise<IxcAssunto | null> {
    const res = await this.fetchIxc<IxcAssunto>(IxcEndpoints.ORDEM_SERVICO_ASSUNTO, {
      qtype: "id",
      query: String(id_assunto),
      oper: "=",
    });
    return res[0] || null;
  }

  async ticketsListar(id_cliente: number, id_contrato?: number): Promise<any[]> {
    return await this.fetchIxc(IxcEndpoints.TICKET, {
      qtype: id_contrato ? "su_ticket.id_contrato" : "su_ticket.id_cliente",
      query: String(id_contrato || id_cliente),
      oper: "=",
      page: "1",
      rp: "20",
      sortname: "su_ticket.id",
      sortorder: "desc",
    });
  }

  async buscarAssuntoTicket(id_assunto: number): Promise<IxcAssunto | null> {
    const res = await this.fetchIxc<IxcAssunto>(IxcEndpoints.TICKET_ASSUNTO, {
      qtype: "id",
      query: String(id_assunto),
      oper: "=",
    });
    return res[0] || null;
  }

  async listarInteracoesTicket(id_ticket: number): Promise<TicketInteracao[]> {
    return await this.fetchIxc<TicketInteracao>(IxcEndpoints.TICKET_INTERACAO, {
      qtype: "id_ticket",
      query: String(id_ticket),
      oper: "=",
      sortname: "data",
      sortorder: "asc",
    });
  }

  async fecharTicket(id_ticket: number, mensagem: string = "Ticket fechado pelo cliente"): Promise<any> {
    return this.update(IxcEndpoints.TICKET, id_ticket, {
      status: "F",
      menssagem: mensagem,
    });
  }

  async criarTicket(payload: TicketPayload): Promise<TicketResponse> {
    const res = await this.create<TicketResponse>(IxcEndpoints.TICKET, payload);
    invalidateClienteCache(Number(payload.id_cliente));
    return res;
  }

  /**
   * Obtém um resumo financeiro do cliente ou contrato
   */
  async getResumoFinanceiro(id_cliente: number, id_contrato?: number) {
    let contratos = await this.buscarContratosDetalhados(id_cliente);
    if (id_contrato) {
      contratos = contratos.filter((c) => String(c.id) === String(id_contrato));
    }

    if (!contratos.length) return [];

    return await Promise.all(
      contratos.map(async (contrato) => {
        const faturas = await this.financeiroListar(id_cliente, contrato.id);
        const faturasPagas = faturas.filter((f: any) => f.status === "P" || parseFloat(f.valor_pago || "0") > 0);

        let metrics = { media_pagamento: 0, total_pago: 0, qtd_faturas: 0 };

        if (faturasPagas.length > 0) {
          const totalPago = faturasPagas.reduce((acc, f: any) => acc + parseFloat(f.valor_pago || f.valor || "0"), 0);
          metrics = {
            media_pagamento: parseFloat((totalPago / faturasPagas.length).toFixed(2)),
            total_pago: parseFloat(totalPago.toFixed(2)),
            qtd_faturas: faturasPagas.length,
          };
        }

        const logins = await this.loginsListar(id_cliente, contrato.id);

        return {
          id_contrato: contrato.id,
          contrato: contrato.contrato || contrato.descricao_plano,
          endereco: contrato.endereco,
          financeiro: metrics,
          logins: logins,
        };
      })
    );
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
