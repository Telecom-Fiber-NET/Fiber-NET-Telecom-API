import "dotenv/config";
import axios from "axios";
import { Cliente } from "../resources/clientes/types";

// ============================================================================
// CONFIGURAÇÃO E UTILITÁRIOS
// ============================================================================

const getBaseUrl = (): string => {
  const url = process.env.IXC_API_URL || process.env.IXC_BASE_URL || "";
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

const IXC_TOKEN = process.env.IXC_ADMIN_TOKEN || process.env.IXC_AUTH_BASIC;

if (!getBaseUrl() || !IXC_TOKEN) {
  console.warn(
    "⚠️ Variáveis de ambiente do IXC não configuradas corretamente."
  );
}

const getHeaders = () => {
  const token = IXC_TOKEN?.includes("Basic") ? IXC_TOKEN : `Basic ${IXC_TOKEN}`;
  return {
    "Content-Type": "application/json",
    Authorization: token,
    ixcsoft: "listar",
  };
};

/**
 * Função auxiliar para realizar requisições ao IXC
 */
const fetchIxc = async (endpoint: string, payload: any): Promise<any[]> => {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    console.warn("Base URL do IXC não configurada");
    return [];
  }

  const url = `${baseUrl}/${endpoint}`;

  try {
    const resp = await axios.post(url, payload, { headers: getHeaders() });
    return resp.data.registros || [];
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    console.error(`Erro na requisição IXC (${endpoint}):`, errorMessage);
    return [];
  }
};

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface ConsumoHistory {
  daily: ConsumoDaily[];
  weekly: ConsumoDaily[];
  monthly: ConsumoMonthly[];
}

interface ConsumoDaily {
  data: string;
  download_bytes: number;
  upload_bytes: number;
}

interface ConsumoMonthly {
  mes_ano: string;
  download_bytes: number;
  upload_bytes: number;
}

interface ConsumoCompleto {
  total_download_bytes: number;
  total_upload_bytes: number;
  history: ConsumoHistory;
}

interface TicketPayload {
  id_cliente: string;
  titulo: string;
  menssagem: string;
  id_setor?: string;
  id_tipo?: string;
  prioridade?: string;
  id_contrato?: string;
  id_login?: string;
  id_ticket_origem?: string;
  status?: string;
  origem_endereco?: string;
  endereco?: string;
  atualizar_cliente?: string;
  su_status?: string;
  interacao_pendente?: string;
}

interface TicketResponse {
  id: number;
  protocolo: string;
  [key: string]: any;
}

// ============================================================================
// SERVIÇO IXC
// ============================================================================

export const ixcService = {
  // ==========================================================================
  // CLIENTES
  // ==========================================================================

  /**
   * Busca clientes por CPF/CNPJ
   * @param cpfCnpj - CPF ou CNPJ formatado (com pontos e traços)
   */
  async buscarClientesPorCpf(cpfCnpj: string): Promise<Cliente[]> {
    return (await fetchIxc("cliente", {
      qtype: "cliente.cnpj_cpf",
      query: cpfCnpj,
      oper: "=",
      page: "1",
      rp: "100",
      sortname: "cliente.id",
      sortorder: "desc",
    })) as Cliente[];
  },

  /**
   * Busca cliente por email
   */
  async buscarClientePorEmail(email: string): Promise<Cliente | null> {
    const registros = await fetchIxc("cliente", {
      qtype: "cliente.hotsite_email",
      query: email,
      oper: "=",
      page: "1",
      rp: "1",
      sortname: "cliente.id",
      sortorder: "desc",
    });

    return registros.length > 0 ? (registros[0] as Cliente) : null;
  },

  /**
   * Busca cliente por ID
   */
  async buscarClientesPorId(id: number): Promise<any | null> {
    const registros = await fetchIxc("cliente", {
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

  // ==========================================================================
  // CONTRATOS E SERVIÇOS
  // ==========================================================================

  /**
   * Busca contratos por ID do cliente
   */
  async buscarContratosPorIdCliente(id_cliente: number): Promise<any[]> {
    return await fetchIxc("cliente_contrato", {
      qtype: "cliente_contrato.id_cliente",
      query: String(id_cliente),
      oper: "=",
      page: "1",
      rp: "100",
      sortname: "cliente_contrato.id",
      sortorder: "desc",
    });
  },

  // ==========================================================================
  // FINANCEIRO
  // ==========================================================================

  /**
   * Lista faturas e boletos do cliente
   */
  async financeiroListar(id_cliente: number): Promise<any[]> {
    return await fetchIxc("fn_areceber", {
      qtype: "fn_areceber.id_cliente",
      query: String(id_cliente),
      oper: "=",
      page: "1",
      rp: "50",
      sortname: "fn_areceber.data_vencimento",
      sortorder: "desc",
    });
  },

  /**
   * Obtém dados PIX de uma fatura
   */
  async getPixFatura(faturaId: number): Promise<any | null> {
    // TODO: Implementar a lógica real para buscar dados PIX do IXC
    console.warn(`[IXC Service] getPixFatura(${faturaId}) not implemented. Returning dummy data.`);
    return {
      qrCode: "dummy_qr_code_base64",
      qrCodeText: "dummy_qr_code_text",
      valor: 123.45,
      status: "pendente",
    };
  },

  // ==========================================================================
  // LOGINS E CONEXÕES
  // ==========================================================================

  /**
   * Lista logins (conexões) do cliente
   */
  async loginsListar(id_cliente: number): Promise<any[]> {
    return await fetchIxc("radusuarios", {
      qtype: "radusuarios.id_cliente",
      query: String(id_cliente),
      oper: "=",
      page: "1",
      rp: "20",
      sortname: "radusuarios.id",
      sortorder: "desc",
    });
  },

  /**
   * Lista equipamentos ONT do login
   */
  async ontListar(id_login: number): Promise<any[]> {
    return await fetchIxc("radpop_radio_cliente_fibra", {
      qtype: "radpop_radio_cliente_fibra.id_login",
      query: String(id_login),
      oper: "=",
      page: "1",
      rp: "1",
      sortname: "radpop_radio_cliente_fibra.id",
      sortorder: "desc",
    });
  },

  // ==========================================================================
  // ORDENS DE SERVIÇO E TICKETS
  // ==========================================================================

  /**
   * Lista ordens de serviço do cliente
   */
  async ordensServicoListar(id_cliente: number): Promise<any[]> {
    return await fetchIxc("su_oss_chamado", {
      qtype: "su_oss_chamado.id_cliente",
      query: String(id_cliente),
      oper: "=",
      page: "1",
      rp: "20",
      sortname: "su_oss_chamado.id",
      sortorder: "desc",
    });
  },

  /**
   * Cria um novo ticket de atendimento
   */
  async criarTicket(payload: TicketPayload): Promise<TicketResponse> {
    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      throw new Error("IXC URL não configurada");
    }

    const url = `${baseUrl}/su_ticket`;

    try {
      const resp = await axios.post(url, payload, {
        headers: getHeaders(),
      });

      return {
        id: resp.data.id || resp.data.retorno_id || resp.data.protocolo,
        protocolo: resp.data.protocolo,
        ...resp.data,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao criar ticket no IXC:", errorMessage);
      throw new Error("IXC: Falha ao criar ticket");
    }
  },

  // ==========================================================================
  // GERENCIAMENTO DE CONTA
  // ==========================================================================

  /**
   * Altera a senha do hotsite (portal do cliente)
   */
  async alterarSenhaHotsite(
    clienteId: number,
    novaSenha: string
  ): Promise<any> {
    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      throw new Error("IXC URL não configurada");
    }

    const url = `${baseUrl}/cliente/${clienteId}`;

    try {
      const resp = await axios.put(
        url,
        { senha: novaSenha },
        { headers: getHeaders() }
      );

      return resp.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao alterar senha no IXC:", errorMessage);
      throw new Error("IXC: Falha ao alterar senha");
    }
  },

  // ==========================================================================
  // CONSUMO E ESTATÍSTICAS
  // ==========================================================================

  /**
   * Obtém histórico completo de consumo de dados
   */
  async getConsumoCompleto(login: any): Promise<ConsumoCompleto> {
    const loginId = login.id;

    if (!loginId) {
      return {
        total_download_bytes: 0,
        total_upload_bytes: 0,
        history: { daily: [], weekly: [], monthly: [] },
      };
    }

    const totalDownload = parseFloat(login.download_atual || "0");
    const totalUpload = parseFloat(login.upload_atual || "0");

    // Buscar dados diários e mensais em paralelo
    const [dailyRes, monthlyRes] = await Promise.all([
      fetchIxc("radusuarios_consumo_d", {
        qtype: "id_login",
        query: String(loginId),
        oper: "=",
        page: "1",
        rp: "30",
        sortname: "data",
        sortorder: "desc",
      }),
      fetchIxc("radusuarios_consumo_m", {
        qtype: "id_login",
        query: String(loginId),
        oper: "=",
        page: "1",
        rp: "12",
        sortname: "data",
        sortorder: "desc",
      }),
    ]);

    // Processar dados diários
    const daily: ConsumoDaily[] = dailyRes
      .map((d: any) => ({
        data: d.data ? d.data.split(" ")[0] : d.data,
        download_bytes: parseFloat(d.consumo || "0"),
        upload_bytes: parseFloat(d.consumo_upload || "0"),
      }))
      .reverse();

    // Últimos 7 dias para visualização semanal
    const weekly: ConsumoDaily[] = daily.slice(-7);

    // Processar dados mensais
    const monthly: ConsumoMonthly[] = monthlyRes
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
};
