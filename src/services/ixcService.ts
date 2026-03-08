// spell:disable
import axios from "axios";
import "dotenv/config";
import { Cliente, Contrato } from "../resources/clientes/types";

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
    "⚠️ Variáveis de ambiente do IXC não configuradas corretamente.",
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
   * Busca clientes por CPF/CNPJ (Híbrido: Com e Sem formatação)
   * @param cpfCnpj - CPF ou CNPJ
   */
  async buscarClientesPorCpf(cpfCnpj: string): Promise<Cliente[]> {
    // 1. Tenta buscar APENAS NÚMEROS (Limpo)
    const cpfLimpo = cpfCnpj.replace(/\D/g, "");

    // Primeira tentativa: CPF Limpo
    let clientes = (await fetchIxc("cliente", {
      qtype: "cliente.cnpj_cpf",
      query: cpfLimpo,
      oper: "=",
      page: "1",
      rp: "100",
      sortname: "cliente.id",
      sortorder: "desc",
    })) as Cliente[];

    // 2. Se não achou nada, tenta buscar COM FORMATAÇÃO (Ex: 123.456.789-00)
    if (clientes.length === 0) {
      let cpfFormatado = cpfLimpo;

      if (cpfLimpo.length === 11) {
        // Formata CPF
        cpfFormatado = cpfLimpo.replace(
          /(\d{3})(\d{3})(\d{3})(\d{2})/,
          "$1.$2.$3-$4",
        );
      } else if (cpfLimpo.length === 14) {
        // Formata CNPJ
        cpfFormatado = cpfLimpo.replace(
          /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
          "$1.$2.$3/$4-$5",
        );
      }

      // Só busca de novo se a formatação mudou algo
      if (cpfFormatado !== cpfLimpo) {
        const clientesFormatados = (await fetchIxc("cliente", {
          qtype: "cliente.cnpj_cpf",
          query: cpfFormatado,
          oper: "=",
          page: "1",
          rp: "100",
          sortname: "cliente.id",
          sortorder: "desc",
        })) as Cliente[];

        if (clientesFormatados.length > 0) {
          clientes = clientesFormatados;
        }
      }
    }

    return clientes;
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
  async buscarContratosPorIdCliente(id_cliente: number): Promise<Contrato[]> {
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

  /**
   * Busca contratos com endereço resolvido (Híbrido: Contrato ou Cliente)
   */
  async buscarContratosDetalhados(id_cliente: number): Promise<Contrato[]> {
    const contracts = (await this.buscarContratosPorIdCliente(
      id_cliente
    )) as Contrato[];
    const client = await this.buscarClientesPorId(id_cliente);

    return contracts.map((c) => {
      // Se usar endereço padrão do cliente, substitui os campos
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
  },

  /**
   * Busca um contrato específico pelo ID
   */
  async buscarContratoPorId(id: number): Promise<Contrato | null> {
    const registros = await fetchIxc("cliente_contrato", {
      qtype: "cliente_contrato.id",
      query: String(id),
      oper: "=",
      page: "1",
      rp: "1",
      sortname: "cliente_contrato.id",
      sortorder: "desc",
    });
    return (registros[0] as Contrato) || null;
  },

  // ==========================================================================
  // FINANCEIRO
  // ==========================================================================

  // ... (existing code for financeiroListar and listarNotasFiscais is fine, checking if I need to edit lines far away. No, I will just edit the block I targeted if possible? 
  // Wait, replacing a huge block is bad. I should split edits.
  // `buscarContratosDetalhados` is around line 230. 
  // `ordensServicoListar` at 637
  // `ticketsListar` at 666.
  // I can't restart `view_file` to check exact lines easily without consuming tools.
  // The `replace_file_content` supports strict StartLine/EndLine.
  // I will do separate calls.)


  // ==========================================================================
  // FINANCEIRO
  // ==========================================================================

  /**
   * Realiza o Desbloqueio de Confiança (Liberação Provisória)
   */
  async desbloqueioConfianca(id_contrato: number): Promise<any> {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/cliente_contrato_desbloqueio_confianca/${id_contrato}`;

    try {
      // O IXC exige um POST, mesmo que o corpo seja vazio
      const resp = await axios.post(url, {}, { headers: getHeaders() });

      // O IXC retorna status "sucesso" ou erro se já foi usado
      return resp.data;
    } catch (error: any) {
      console.error(`[IXC] Erro ao desbloquear contrato ${id_contrato}:`, error.message);
      // Repassa a mensagem exata do IXC (ex: "Limite de desbloqueios atingido")
      throw new Error(error.response?.data?.message || "Não foi possível realizar o desbloqueio no momento.");
    }
  },

  /**
   * Lista faturas e boletos do cliente
   */
  async financeiroListar(id_cliente: number, id_contrato?: number): Promise<any[]> {
    const payload: any = {
      qtype: "fn_areceber.id_cliente",
      query: String(id_cliente),
      oper: "=",
      page: "1",
      rp: "50",
      sortname: "fn_areceber.data_vencimento",
      sortorder: "desc",
    };

    // Filtro adicional por contrato se fornecido
    if (id_contrato) {
      // IXC API grid filtering: using multiple filters requires specific syntax or just filtering client side.
      // However, standard IXC list API (fetchIxc here) usually supports only one filter via simple fields.
      // But we can filter client-side since we fetch limited items, OR verify if IXC supports AND.
      // Most basic IXC integrations fetch by Client and filter in code for specific contract if the API doesn't support complex query.
      // BUT, fn_areceber has `id_contrato`. We can query directly by `id_contrato` IF we want ONLY that contract.
      // If we want to be safe:
      if (id_contrato) {
        payload.qtype = "fn_areceber.id_contrato";
        payload.query = String(id_contrato);
      }
    }

    return await fetchIxc("fn_areceber", payload);
  },

  /**
   * Lista Notas Fiscais (Modelo 21/22/55/etc)
   */
  async listarNotasFiscais(id_cliente: number, id_contrato?: number): Promise<any[]> {
    const payload: any = {
      qtype: "id_cliente",
      query: String(id_cliente),
      oper: "=",
      page: "1",
      rp: "20",
      sortname: "data_emissao",
      sortorder: "desc",
    };

    if (id_contrato) {
      payload.qtype = "id_contrato";
      payload.query = String(id_contrato);
    }

    // Tenta buscar na tabela de saída de notas 
    return await fetchIxc("fn_saida", payload);
  },

  /**
   * Imprime (Gera) o PDF do boleto usando a rota get_boleto do IXC
   * Retorna o arquivo em Base64
   */
  async imprimirBoleto(id: number): Promise<string | null> {
    const baseUrl = getBaseUrl();

    // Endpoint específico para gerar o arquivo
    const url = `${baseUrl}/get_boleto`;

    // Payload conforme documentação do IXC
    const payload = {
      boletos: String(id), // ID da fatura
      juro: "N", // Não recalcular juros na visualização
      multa: "N", // Não recalcular multa
      atualiza_boleto: "S", // Atualiza o registro se necessário
      tipo_boleto: "arquivo", // Tipo de saída
      base64: "S", // OBRIGATÓRIO: Retorna o conteúdo do arquivo em Base64
      layout_impressao: "", // Usa o layout padrão do sistema
    };

    try {
      console.log(`[IXC] Gerando boleto ID ${id} via get_boleto...`);

      const resp = await axios.post(url, payload, { headers: getHeaders() });

      // O IXC geralmente retorna o base64 diretamente no campo 'base64'
      // ou dentro de um objeto de resposta.
      // Vamos tentar capturar de forma segura.
      const base64 = resp.data.base64 || resp.data;

      if (!base64 || typeof base64 !== "string") {
        console.warn(`[IXC] Resposta inválida ao gerar boleto:`, resp.data);
        return null;
      }

      return base64;
    } catch (error: any) {
      console.error("Erro ao gerar boleto (get_boleto):", error.message);

      // Log detalhado para debug se a API recusar
      if (axios.isAxiosError(error) && error.response) {
        console.error(
          "Detalhes do erro API:",
          JSON.stringify(error.response.data),
        );
      }

      return null;
    }
  },

  /**
   * Obtém dados PIX de uma fatura
   */
  /**
   * Busca os dados detalhados do PIX (QR Code e Copia e Cola)
   * Baseado no endpoint que retorna a estrutura { gateway: ..., pix: ... }
   * @param idReceber ID da fatura (conta a receber)
   */
  /**
   * Busca os dados detalhados do PIX (QR Code e Copia e Cola)
   * Endpoint: get_pix
   */
  async buscarPixDetalhado(idReceber: number): Promise<any> {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/get_pix`;

    try {
      // Payload padrão para geração do PIX no IXC
      const payload = {
        id_areceber: String(idReceber),
      };

      const resp = await axios.post(url, payload, { headers: getHeaders() });

      // Retorna o objeto completo (gateway, pix, type) para o controller tratar
      return resp.data;
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error(
        `Erro ao buscar PIX detalhado (ID: ${idReceber}):`,
        errorMessage,
      );
      return null;
    }
  },

  /**
   * Busca as baixas (pagamentos) de uma fatura específica.
   */
  async buscarBaixasDaFatura(idFatura: number | string) {
    const url = "fn_areceber_baixas";

    const body = {
      qtype: "id_receber",
      query: String(idFatura),
      oper: "=",
      page: "1",
      rp: "100",
      sortname: "data",
      sortorder: "desc",
    };

    try {
      // CORREÇÃO 1: Usar 'fetchIxc' em vez de 'listar'
      // CORREÇÃO 2: fetchIxc já devolve os registros, não precisa acessar .registros
      const registros = await fetchIxc(url, body);
      return registros;
    } catch (error) {
      console.error(`[IxcService] Erro ao buscar baixas ${idFatura}:`, error);
      return [];
    }
  },

  /**
   * Gera o PDF da Nota Fiscal
   */
  async imprimirNotaFiscal(id: number): Promise<string | null> {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/get_nf`; // Endpoint correto para NF no IXC (verificado documentação padrão)

    const payload = {
      id_saida: String(id), // ID da nota fiscal na tabela fn_saida
      base64: "S"
    };

    try {
      const resp = await axios.post(url, payload, { headers: getHeaders() });
      if (resp.data) {
        return resp.data.base64 || resp.data;
      }
      return null;
    } catch (error: any) {
      console.error(`Erro ao gerar PDF da NF (ID: ${id}):`, error.message);
      return null;
    }
  },

  /**
   * Gera o PDF de um Termo de Contrato
   */
  async imprimirTermo(id: number): Promise<string | null> {
    const baseUrl = getBaseUrl();
    // Endpoint padrão para impressão de termo. O sufixo _17678 pode ser específico de versão, 
    // mas vamos tentar o padrão ou manter o padrão visto em imprimirContrato se aplicável.
    // O endpoint correto geralmente é cliente_contrato_termo_imprimir_termo
    const url = `${baseUrl}/cliente_contrato_termo_imprimir_termo`;

    const payload = {
      id: String(id),
      base64: "S" // Forçar retorno base64
    };

    try {
      const resp = await axios.post(url, payload, { headers: getHeaders() });
      if (resp.data) {
        return resp.data.base64 || resp.data;
      }
      return null;
    } catch (error: any) {
      console.error(`Erro ao gerar PDF do Termo (ID: ${id}):`, error.message);
      return null;
    }
  },

  /**
   * Obtém um resumo financeiro do cliente ou contrato
   * Retorna Média de Pagamento, Média Diária, Total Pago, etc.
   */
  async getResumoFinanceiro(id_cliente: number, id_contrato?: number) {
    // 1. Determine contracts to process (with resolved address)
    let contratos = await this.buscarContratosDetalhados(id_cliente);

    // If specific contract requested, filter it
    if (id_contrato) {
      contratos = contratos.filter((c) => String(c.id) === String(id_contrato));
    }

    if (!contratos.length) {
      return [];
    }

    // 2. Process each contract
    const resultados = await Promise.all(
      contratos.map(async (contrato) => {
        // Fetch financials for this contract
        const faturas = await this.financeiroListar(id_cliente, contrato.id);

        // Filter paid invoices
        const faturasPagas = faturas.filter(
          (f: any) =>
            f.status === "R" || parseFloat(f.valor_recebido || "0") > 0,
        );

        let metrics = {
          media_pagamento: 0,
          media_diaria: 0,
          total_pago: 0,
          qtd_faturas: 0,
        };

        if (faturasPagas.length > 0) {
          const totalPago = faturasPagas.reduce(
            (acc: number, f: any) =>
              acc + parseFloat(f.valor_recebido || f.valor || "0"),
            0,
          );
          const qtd = faturasPagas.length;
          const mediaPagamento = totalPago / qtd;
          const mediaDiaria = mediaPagamento / 30; // Arranged monthly average

          metrics = {
            media_pagamento: parseFloat(mediaPagamento.toFixed(2)),
            media_diaria: parseFloat(mediaDiaria.toFixed(2)),
            total_pago: parseFloat(totalPago.toFixed(2)),
            qtd_faturas: qtd,
          };
        }

        // Fetch logins for this contract
        const logins = await this.loginsListar(id_cliente, contrato.id);

        return {
          id_contrato: contrato.id,
          contrato: contrato.contrato, // Description/Name
          endereco: {
            endereco: contrato.endereco,
            numero: contrato.numero,
            bairro: contrato.bairro,
            cidade: contrato.cidade,
            uf: contrato.uf,
            cep: contrato.cep,
            complemento: contrato.complemento,
          },
          financeiro: metrics,
          logins: logins,
        };
      }),
    );

    return resultados;
  },

  // ==========================================================================
  // LOGINS E CONEXÕES
  // ==========================================================================

  /**
   * Lista logins (conexões) do cliente
   */
  async loginsListar(id_cliente: number, id_contrato?: number): Promise<any[]> {
    const payload: any = {
      qtype: "radusuarios.id_cliente",
      query: String(id_cliente),
      oper: "=",
      page: "1",
      rp: "20",
      sortname: "radusuarios.id",
      sortorder: "desc",
    };

    if (id_contrato) {
      payload.qtype = "radusuarios.id_contrato";
      payload.query = String(id_contrato);
    }

    return await fetchIxc("radusuarios", payload);
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

  /**
   * Limpa o MAC Address do login para permitir nova conexão
   */
  async limparMacLogin(id: number): Promise<any> {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/radusuarios/${id}`;

    try {
      // No IXC, limpar MAC é um PUT enviando string vazia
      await axios.put(url, { mac: "" }, { headers: getHeaders() });
      return { success: true, message: "MAC address limpo com sucesso." };
    } catch (error: any) {
      console.error(`Erro ao limpar MAC (ID: ${id}):`, error.message);
      throw new Error("Falha ao limpar MAC address.");
    }
  },

  /**
   * Desconecta o login do cliente
   */
  async desconectarLogin(id: number): Promise<any> {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/radusuarios/${id}`;

    try {
      // Tenta forçar a desconexão alterando o status online ou via comando específico
      // Nota: A API padrão do IXC pode variar. O método comum é PUT com online: 'N'
      await axios.put(url, { online: "N" }, { headers: getHeaders() });
      return { success: true, message: "Comando de desconexão enviado." };
    } catch (error: any) {
      console.error(`Erro ao desconectar (ID: ${id}):`, error.message);
      throw new Error("Falha ao enviar comando de desconexão.");
    }
  },
  /**
   * Realiza diagnóstico do login (Retorna consumo atual e status)
   */
  async getDiagnosticoLogin(id: number): Promise<any> {
    try {
      // Busca dados atualizados do login
      const registros = await fetchIxc("radusuarios", {
        qtype: "radusuarios.id",
        query: String(id),
        oper: "=",
        page: "1",
        rp: "1",
        sortname: "radusuarios.id",
        sortorder: "desc",
      });

      if (!registros.length) throw new Error("Login não encontrado.");

      const login = registros[0];

      // Busca diagnóstico detalhado do IXC
      const diagnosticoIxc = await fetchIxc("su_diagnostico", {
        qtype: "id_login",
        query: String(id),
        oper: "=",
        page: "1",
        rp: "1",
        sortname: "id",
        sortorder: "desc",
      });

      // Retorna uma estrutura simplificada para o diagnóstico
      return {
        consumo: {
          download: login.download_atual || "0",
          upload: login.upload_atual || "0",
        },
        status: login.online === "S" ? "Online" : "Offline",
        ip: login.ip_concentrador || login.ip,
        sinal: login.sinal_ultimo_atendimento || "N/A",
        detalhes: diagnosticoIxc[0] || null,
        message: "Diagnóstico realizado com sucesso.",
      };
    } catch (error: any) {
      console.error(`Erro no diagnóstico (ID: ${id}):`, error.message);
      throw new Error("Falha ao realizar diagnóstico.");
    }
  },

  /**
   * Gera o PDF do contrato
   */
  async imprimirContrato(id: number): Promise<string | null> {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/cliente_contrato_imprimir_contrato_17678`;

    const payload = {
      id: String(id),
    };

    try {
      const resp = await axios.post(url, payload, { headers: getHeaders() });

      // Tenta obter o base64 de diferentes formas possíveis na resposta
      if (resp.data) {
        return resp.data.base64 || resp.data;
      }
      return null;
    } catch (error: any) {
      console.error(
        `Erro ao gerar PDF do contrato (ID: ${id}):`,
        error.message,
      );
      return null;
    }
  },

  /**
   * Lista termos/contratos pendentes de assinatura
   */
  async listarTermosPendentes(id_contrato: number): Promise<any[]> {
    return await fetchIxc("cliente_contrato_termo", {
      qtype: "id_contrato",
      query: String(id_contrato),
      oper: "=",
      page: "1",
      rp: "10",
      sortname: "id",
      sortorder: "desc",
    });
  },

  /**
   * Realiza a assinatura digital de um termo
   */
  async assinarTermo(id_termo: number, ip: string): Promise<any> {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/cliente_contrato_termo/${id_termo}`;

    try {
      const payload = {
        status: "A", // Aceito
        data_aceite: new Date().toISOString().slice(0, 19).replace("T", " "),
        ip_aceite: ip,
      };

      const resp = await axios.put(url, payload, { headers: getHeaders() });
      return resp.data;
    } catch (error: any) {
      console.error(`Erro ao assinar termo (ID: ${id_termo}):`, error.message);
      throw new Error("Falha ao realizar assinatura digital.");
    }
  },

  // ==========================================================================
  // ORDENS DE SERVIÇO E TICKETS
  // ==========================================================================

  /**
   * Lista ordens de serviço do cliente
   */
  async ordensServicoListar(id_cliente: number, id_contrato?: number): Promise<any[]> {
    const payload: any = {
      qtype: "su_oss_chamado.id_cliente",
      query: String(id_cliente),
      oper: "=",
      page: "1",
      rp: "20",
      sortname: "su_oss_chamado.id",
      sortorder: "desc",
    };

    if (id_contrato) {
      payload.qtype = "su_oss_chamado.id_contrato";
      payload.query = String(id_contrato);
    }

    return await fetchIxc("su_oss_chamado", payload);
  },

  /**
   * Busca o assunto de uma OS pelo ID
   */
  async buscarAssuntoOS(id_assunto: number): Promise<any> {
    const registros = await fetchIxc("su_oss_assunto", {
      qtype: "id",
      query: String(id_assunto),
      oper: "=",
      page: "1",
      rp: "1",
    });
    return registros[0] || null;
  },

  /**
   * Lista tickets do cliente
   */
  async ticketsListar(id_cliente: number, id_contrato?: number): Promise<any[]> {
    const payload: any = {
      qtype: "su_ticket.id_cliente",
      query: String(id_cliente),
      oper: "=",
      page: "1",
      rp: "20",
      sortname: "su_ticket.id",
      sortorder: "desc",
    };

    if (id_contrato) {
      payload.qtype = "su_ticket.id_contrato";
      payload.query = String(id_contrato);
    }

    return await fetchIxc("su_ticket", payload);
  },

  /**
   * Busca o assunto de um Ticket pelo ID
   */
  async buscarAssuntoTicket(id_assunto: number): Promise<any> {
    const registros = await fetchIxc("su_assunto", {
      qtype: "id",
      query: String(id_assunto),
      oper: "=",
      page: "1",
      rp: "1",
    });
    return registros[0] || null;
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

  /**
   * Lista interações (mensagens) de um ticket
   */
  async listarInteracoesTicket(id_ticket: number): Promise<any[]> {
    return await fetchIxc("su_ticket_interacao", {
      qtype: "id_ticket",
      query: String(id_ticket),
      oper: "=",
      page: "1",
      rp: "100",
      sortname: "data",
      sortorder: "asc",
    });
  },

  /**
   * Fecha um ticket
   */
  async fecharTicket(id_ticket: number, mensagem: string = "Ticket fechado pelo cliente"): Promise<any> {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/su_ticket/${id_ticket}`;

    try {
      // Atualiza status para F (Finalizado)
      // Nota: Algumas versões do IXC podem exigir endpoint específico ou interação.
      // Tentando PUT direto no ticket.
      await axios.put(url, {
        status: "F",
        menssagem: mensagem // Alguns IXC exigem mensagem ao fechar
      }, { headers: getHeaders() });

      return { success: true };
    } catch (error: any) {
      console.error(`Erro ao fechar ticket ${id_ticket}:`, error.message);
      throw new Error("Falha ao fechar ticket.");
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
    novaSenha: string,
  ): Promise<any> {
    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      throw new Error("IXC URL não configurada");
    }

    // 1. Buscar dados atuais do cliente para não perder informações
    const clienteAtual = await ixcService.buscarClientesPorId(clienteId);

    if (!clienteAtual) {
      throw new Error("Cliente não encontrado para atualização");
    }

    // 2. Prepara o pyload com os dados originais + a nova senha

    const payload = {
      ...clienteAtual,
      senha: novaSenha,
    };

    const url = `${baseUrl}/cliente/${clienteId}`;

    try {
      console.log(`[IXC] Atualizando senha do cliente ${clienteId}...`);

      // 3. Envia o objeto completo via PUT
      const resp = await axios.put(url, payload, { headers: getHeaders() });

      return resp.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao alterar senha no IXC:", errorMessage);
      throw new Error("IXC: Falha ao alterar senha");
    }
  },


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
      .reverse(); // Now descending (latest first) or ascending?
    // fetchIxc sorts by 'data' desc. So [0] is today/yesterday.
    // .reverse() makes it Ascending (oldest first)?
    // Wait. The original code did .reverse().
    // If dailyRes is DESC (Today...Oldest), then .reverse() makes it (Oldest...Today).
    // Let's keep it (Oldest...Today) for the Daily Chart.

    // Weekly: Calculate 7 in 7 days from the Daily data
    // We want to group by 7 days.
    // If daily is Ascending (Oldest...Today), we should group from the end (Today backwards) or start?
    // User ref: "calculated of 7 in 7 days". Usually standard weeks or rolling backwards.
    // Let's do Rolling 7-day chunks starting from the latest date backwards.

    // We need a copy of daily sorted Descending to chunk easily
    const dailyDesc = [...daily].reverse();
    const weekly: ConsumoDaily[] = [];

    for (let i = 0; i < dailyDesc.length; i += 7) {
      const chunk = dailyDesc.slice(i, i + 7);
      if (chunk.length === 0) break;

      // Sum up
      const totalDown = chunk.reduce((acc, curr) => acc + curr.download_bytes, 0);
      const totalUp = chunk.reduce((acc, curr) => acc + curr.upload_bytes, 0);

      // Date label: Start Date of the chunk (or End Date).
      // Provide the range or just the start date.
      // Let's use the date of the FIRST item in the chunk (Latest date in the week) or Last?
      // Usually "Week of <Start Date>". 
      // In this chunk (Descending), the last item is the oldest.
      const weekLabel = chunk[chunk.length - 1].data; // Start date of the week

      weekly.push({
        data: weekLabel, // Represents the week starting on this date
        download_bytes: totalDown,
        upload_bytes: totalUp
      });
    }

    // Reverse weekly to be Ascending (Oldest Week ... Latest Week)
    weekly.reverse();

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

  // ==========================================================================
  // CONSUMO E RELATÓRIOS
  // ==========================================================================

  /**
   * Busca consumo diário para um login
   */
  async getConsumoDiario(id_login: number): Promise<any[]> {
    return await fetchIxc("radusuarios_consumo_d", {
      qtype: "id_login",
      query: String(id_login),
      oper: "=",
      page: "1",
      rp: "30", // Últimos 30 dias
      sortname: "data",
      sortorder: "desc",
    });
  },

  /**
   * Busca consumo mensal para um login
   */
  async getConsumoMensal(id_login: number): Promise<any[]> {
    return await fetchIxc("radusuarios_consumo_m", {
      qtype: "id_login",
      query: String(id_login),
      oper: "=",
      page: "1",
      rp: "12", // Últimos 12 meses
      sortname: "data",
      sortorder: "desc",
    });
  },
};

