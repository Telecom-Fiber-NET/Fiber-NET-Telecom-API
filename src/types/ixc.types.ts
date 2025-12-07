/**
 * TIPOS PARA INTEGRAÇÃO COM API IXC SOFT
 * Documentação completa de todos os tipos usados na API
 */

// ============================================================================
// CLIENTE
// ============================================================================

export interface Cliente {
  id: number;
  razao: string;
  fantasia: string;
  cnpj_cpf: string;
  tipo_cliente: "F" | "J"; // F=Física, J=Jurídica
  fone_comercial?: string;
  celular?: string;
  email?: string;
  hotsite_email?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  status: "A" | "I" | "D"; // A=Ativo, I=Inativo, D=Desativado
  data_cadastro: string;
  observacao?: string;
}

// ============================================================================
// CONTRATO
// ============================================================================

export interface Contrato {
  id: number;
  id_cliente: number;
  id_plano: number;
  descricao_plano?: string;
  valor: string;
  data_ativacao: string;
  data_vencimento?: string;
  status: "A" | "I" | "C"; // A=Ativo, I=Inativo, C=Cancelado
  tipo_contrato: string;
  dia_vencimento: number;
}

// ============================================================================
// FINANCEIRO
// ============================================================================

export interface Fatura {
  id: number;
  id_cliente: number;
  documento: string;
  data_vencimento: string;
  data_pagamento?: string;
  valor: string;
  valor_pago?: string;
  status: "A" | "P" | "C"; // A=Aberto, P=Pago, C=Cancelado
  linha_digitavel?: string;
  boleto?: string; // URL do PDF
  pix_txid?: string;
  pix_qrcode?: string;
  descricao?: string;
  observacao?: string;
}

export interface ResumoBoleto {
  id: number;
  clienteId: number;
  clienteNome: string;
  documento: string;
  vencimento: string;
  vencimentoFormatado: string;
  valor: number;
  valorFormatado: string;
  linhaDigitavel?: string;
  pixCopiaECola?: string;
  boleto_pdf_link?: string;
  status: StatusBoleto;
  statusCor: StatusCor;
  diasVencimento: number;
}

export type StatusBoleto = "Vencido" | "Vence Hoje" | "Vence em Breve" | "A Vencer";
export type StatusCor = "danger" | "warning" | "success";

// ============================================================================
// LOGIN (CONEXÃO)
// ============================================================================

export interface Login {
  id: number;
  id_cliente: number;
  login: string;
  senha?: string;
  status: "A" | "B" | "CA"; // A=Ativo, B=Bloqueado, CA=Cancelado
  download_atual?: string;
  upload_atual?: string;
  limite_download?: string;
  limite_upload?: string;
  ip?: string;
  mac?: string;
  id_pop?: number;
  descricao_pop?: string;
}

// ============================================================================
// ONT (EQUIPAMENTO FIBRA)
// ============================================================================

export interface Ont {
  id: number;
  id_login: number;
  serial: string;
  modelo?: string;
  status: string;
  sinal?: string;
  olt?: string;
  pon?: string;
  online: "S" | "N";
}

// ============================================================================
// CONSUMO DE DADOS
// ============================================================================

export interface ConsumoDaily {
  data: string; // YYYY-MM-DD
  download_bytes: number;
  upload_bytes: number;
}

export interface ConsumoMonthly {
  mes_ano: string; // YYYY-MM
  download_bytes: number;
  upload_bytes: number;
}

export interface ConsumoHistory {
  daily: ConsumoDaily[];
  weekly: ConsumoDaily[];
  monthly: ConsumoMonthly[];
}

export interface ConsumoCompleto {
  total_download_bytes: number;
  total_upload_bytes: number;
  history: ConsumoHistory;
}

// ============================================================================
// TICKETS E ORDEM DE SERVIÇO
// ============================================================================

export interface TicketPayload {
  id_cliente: number;
  assunto: string;
  descricao: string;
  id_setor?: number;
  id_tipo?: number;
  prioridade?: "baixa" | "media" | "alta" | "urgente";
  id_tecnico?: number;
  observacao?: string;
}

export interface TicketResponse {
  id: number;
  protocolo: string;
  id_cliente: number;
  assunto: string;
  status: string;
  data_abertura: string;
  data_fechamento?: string;
  [key: string]: any;
}

export interface OrdemServico {
  id: number;
  id_cliente: number;
  protocolo: string;
  assunto: string;
  descricao: string;
  status: string;
  prioridade: string;
  data_abertura: string;
  data_agendamento?: string;
  data_conclusao?: string;
  tecnico_responsavel?: string;
}

// ============================================================================
// PAYLOADS DE REQUISIÇÃO
// ============================================================================

export interface IxcQueryPayload {
  qtype: string;
  query: string;
  oper: "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE";
  page: string;
  rp: string;
  sortname: string;
  sortorder: "asc" | "desc";
}

export interface IxcResponse<T> {
  type: string;
  total: number;
  page: number;
  registro: number;
  registros: T[];
}

// ============================================================================
// ALTERAÇÃO DE SENHA
// ============================================================================

export interface AlterarSenhaPayload {
  senha: string;
}

export interface AlterarSenhaResponse {
  success: boolean;
  message: string;
  id?: number;
}

// ============================================================================
// ERROS E RESPOSTAS
// ============================================================================

export class IxcApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = "IxcApiError";
  }
}

export interface ApiErrorResponse {
  error: string;
  detalhes?: string;
  statusCode?: number;
  timestamp?: string;
}

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

export interface IxcConfig {
  baseUrl: string;
  token: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
}

// ============================================================================
// UTILITÁRIOS DE TIPO
// ============================================================================

/**
 * Remove null e undefined de um tipo
 */
export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

/**
 * Torna campos específicos opcionais
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Torna campos específicos obrigatórios
 */
export type Required<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};
