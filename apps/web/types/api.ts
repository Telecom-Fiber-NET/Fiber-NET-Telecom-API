export interface Cliente {
  id: number | string;
  nome: string;
  endereco?: string;
  cnpj_cpf?: string; // Prompt uses cnpj_cpf
  fone?: string;
  email?: string;
  numero?: string;
}

export interface Contrato {
  id: number | string;
  id_cliente?: number | string;
  login?: string; 
  plano?: string; 
  status?: string; 
  status_acesso?: string;
  status_internet?: string;
  situacao?: string;
  cor?: string;
  pago_ate?: string;
  data_contrato?: string;
  desbloqueio_confianca?: 'S' | 'N';
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
}

export interface Fatura {
  id: string | number;
  vencimento: string; // From prompt
  valor: string; // Original value
  valor_recebido?: string; // Real paid value
  valor_nominal?: string; // Original nominal value
  valor_atualizado?: string; // Value with interest/fine
  juros?: string;
  multa?: string;
  status: string; // From prompt: "aberto" | "pago"
  linha_digitavel: string; // From prompt
  
  // Backward compatibility fields
  id_cliente?: number;
  id_contrato?: number | string;
  contrato_id?: number | string;
  documento?: string;
  data_emissao?: string;
  data_vencimento?: string; 
  data_pagamento?: string;
  pix_code?: string;
  qr_code?: string; // Returned from GET /faturas/:id/pix
  link_pdf?: string;
}

export interface Login {
  id?: number | string;
  login: string; 
  status: string; 
  online: 'S' | 'N';
  uptime: string; 
  tempo_conectado: string;
  ipv4: string; 
  ip_privado?: string;
  ip_publico?: string;
  sinal?: string;
  onu_mac?: string;
  wifi_ssid?: string;
  wifi_senha?: string;
  total_download: string; 
  total_upload: string; 
  contrato_id?: number | string;
  id_contrato?: number | string;
  consumo?: Consumo;
  history?: HistoryData; 
}

export interface ConsumoPoint {
  data?: string;     
  mes_ano?: string;
  semana?: string;  
  download_bytes: number;
  upload_bytes: number;
}

export interface HistoryData {
  daily: ConsumoPoint[];
  weekly: ConsumoPoint[];
  monthly: ConsumoPoint[];
}

export interface Consumo {
  total_download_bytes?: number;
  total_upload_bytes?: number;
  total_download: string; 
  total_upload: string;
  history: HistoryData;
}

export interface OrdemServico {
  id: string;
  tipo?: string;
  status?: string;
  protocolo?: string;
  data_abertura?: string;
  mensagem?: string;
  assunto?: string;
}

export interface Ticket {
  id: string;
  protocolo?: string;
  assunto: string;
  status: string;
  data_abertura: string;
  mensagem?: string;
  podeFechar?: boolean;
}

export interface ReportRamal {
  id?: number | string;
  numero?: string;
  nome?: string;
  descricao?: string;
  label?: string;
}

export interface Termo {
  id: number;
  id_contrato: number;
  id_modelo_termo: number;
  data_aceite?: string;
  ip_aceite?: string;
  status: 'P' | 'A' | 'C';
  titulo?: string;
  conteudo?: string;
}

export interface DashboardResponse {
  clientes?: Cliente[];
  contratos: Contrato[];
  faturas: Fatura[];
  logins: Login[];
  ordensServico: OrdemServico[];
  tickets: Ticket[];
  termos?: Termo[]; // Added back
  consumo_global: Consumo;
  consumo: Consumo;
  ai_analysis?: AiAnalysis; 
}

export interface AiInsight {
  type: 'risk' | 'positive' | 'neutral';
  title: string;
  message: string;
}

export interface AiAnalysis {
  summary: string;
  insights: AiInsight[];
}

export interface LoginResponse {
  token: string;
  user: {
      id: string | number;
      ids_vinculados: string[];
      nome: string;
      cnpj_cpf: string;
  };
  success?: boolean;
  message?: string;
}

export interface NotaFiscal {
    id: number | string;
    numero?: string;
    data_emissao?: string;
    valor?: string;
    link_pdf?: string;
}

export interface ContractFinancialResponse {
  id_contrato: number;
  financeiro: {
    boletos: Fatura[];
    notas_fiscais: NotaFiscal[];
  };
}

export interface CreateTicketPayload {
  assunto: string;
  mensagem: string;
  contratoId?: number;
}
