/**
 * TIPOS PARA INTEGRAÇÃO COM API IXC SOFT
 * Versão refatorada (nível sênior)
 */

// ============================================================================
// BASE TYPES
// ============================================================================

export type ISODateString = string;
export type Base64Flag = "S" | "N";

// ============================================================================
// ENUMS
// ============================================================================

export enum ClienteTipo {
  FISICA = "F",
  JURIDICA = "J",
}

export enum ClienteStatus {
  ATIVO = "A",
  INATIVO = "I",
  DESATIVADO = "D",
}

export enum ContratoStatus {
  ATIVO = "A",
  INATIVO = "I",
  CANCELADO = "C",
}

export enum FaturaStatus {
  ABERTO = "A",
  PAGO = "P",
  CANCELADO = "C",
}

export enum LoginStatus {
  ATIVO = "A",
  BLOQUEADO = "B",
  CANCELADO = "CA",
}

// ============================================================================
// CLIENTE
// ============================================================================

export interface Cliente {
  id: number;
  razao: string;
  fantasia: string;
  cnpj_cpf: string;
  tipo_cliente: ClienteTipo;
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
  status: ClienteStatus;
  data_cadastro: ISODateString;
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
  valor: string; // vindo da API
  data_ativacao: ISODateString;
  data_vencimento?: ISODateString;
  status: ContratoStatus;
  tipo_contrato: string;
  dia_vencimento: number;
}

// ============================================================================
// FINANCEIRO (API RAW)
// ============================================================================

export interface Fatura {
  id: number;
  id_cliente: number;
  documento: string;
  data_vencimento: ISODateString;
  data_pagamento?: ISODateString;
  valor: string; // API retorna string
  valor_pago?: string;
  status: FaturaStatus;
  linha_digitavel?: string;
  boleto?: string; // URL
  pix_txid?: string;
  pix_qrcode?: string;
  descricao?: string;
  observacao?: string;
}

// ============================================================================
// FINANCEIRO (DOMÍNIO)
// ============================================================================

export type StatusBoleto =
  | "Vencido"
  | "Vence Hoje"
  | "Vence em Breve"
  | "A Vencer";

export type StatusCor = "danger" | "warning" | "success";

export interface ResumoBoleto {
  id: number;
  clienteId: number;
  clienteNome: string;
  documento: string;
  vencimento: ISODateString;
  vencimentoFormatado: string;
  valor: number;
  valorFormatado: string;
  linhaDigitavel?: string;
  pixCopiaECola?: string;
  boletoPdfLink?: string;
  status: StatusBoleto;
  statusCor: StatusCor;
  diasVencimento: number;
}

// ============================================================================
// NOTA FISCAL
// ============================================================================

export interface ImprimirNotaParams {
  id: string;
  base64: Base64Flag;
}

// ============================================================================
// LOGIN
// ============================================================================

export interface Login {
  id: number;
  id_cliente: number;
  login: string;
  senha?: string;
  status: LoginStatus;
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
// ONT (FIBRA)
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
// CONSUMO
// ============================================================================

export interface ConsumoDaily {
  data: ISODateString;
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
// TICKETS
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
  data_abertura: ISODateString;
  data_fechamento?: ISODateString;
  [key: string]: unknown;
}

// ============================================================================
// ORDEM DE SERVIÇO
// ============================================================================

export interface OrdemServico {
  id: number;
  id_cliente: number;
  protocolo: string;
  assunto: string;
  descricao: string;
  status: string;
  prioridade: string;
  data_abertura: ISODateString;
  data_agendamento?: ISODateString;
  data_conclusao?: ISODateString;
  tecnico_responsavel?: string;
}

// ============================================================================
// QUERY PADRÃO IXC
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

// ============================================================================
// RESPONSE PADRÃO (SEPARADO)
// ============================================================================

export interface IxcListResponse<T> {
  type: string;
  total: number;
  page: number;
  registros: T[];
}

export interface IxcSingleResponse<T> {
  status: string;
  data: T;
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
// ERROS
// ============================================================================

export class IxcApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown,
  ) {
    super(message);
    this.name = "IxcApiError";
  }
}

export interface ApiErrorResponse {
  error: string;
  detalhes?: string;
  statusCode?: number;
  timestamp?: ISODateString;
}

// ============================================================================
// CONFIG
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
// UTILITÁRIOS
// ============================================================================

export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};
