export interface Cliente {
  id: number;
  razao: string;
  endereco: string;
  cnpj_cpf: string;
  fantasia: string;
  fone: string;
  email: string;
  numero?: string;
  senha?: string;
  hotsite_email?: string;
}

export interface Contrato {
  id: number;
  descricao_aux_plano_venda: string;
  status: string;
  desbloqueio_confianca: string;
  id_cliente: number;
  login: string;
}

export interface Fatura {
  id: number;
  documento: string;
  data_emissao: string;
  data_vencimento: string;
  valor: string;
  status: string;
  linha_digitavel: string;
  pix_txid: string;
  boleto: string;
  id_cliente: number;
}

export interface Login {
  id: number;
  login: string;
  online: string;
  sinal_ultimo_atendimento: string;
  tempo_conectado: string;
  id_contrato: number;
  id_cliente: number;
  upload_atual: string;
  download_atual: string;
}

export interface NotaFiscal {
  id: number;
  numero: string;
  data_emissao: string;
  valor: string;
  pdf_url: string;
}

export interface OrdemServico {
  id: string;
  tipo: string;
  id_filial: string;
  status: string;
  id_cliente: string;
  id_assunto: string;
  mensagem: string;
  protocolo: string;
  data_abertura: string;
  data_inicio: string;
  data_final: string;
  data_fechamento: string;
  mensagem_resposta: string;
  id_contrato_kit: string;
  id_login: string;
  endereco: string;
  bairro: string;
  cidade: string;
  latitude: string;
  longitude: string;
  ultima_atualizacao: string;
}

export interface OntInfo {
  id: string;
  id_login: string;
  serial_number?: string;
  modelo?: string;
  status?: string;
  sinal_rx?: string;
  sinal_tx?: string;
  potencia_ont?: string;
  ultima_atualizacao?: string;
}

export interface ConsumptionHistory {
  daily: Array<{
    data: string;
    download_bytes: number;
    upload_bytes: number;
  }>;
  monthly: Array<{
    mes_ano: string;
    download_bytes: number;
    upload_bytes: number;
  }>;
}

export interface Consumo {
  total_download_bytes: number;
  total_upload_bytes: number;
  history: ConsumptionHistory;
}

export interface DashboardData {
  clientes: Cliente[];
  contratos: Contrato[];
  faturas: Fatura[];
  logins: Login[];
  notas: NotaFiscal[];
  ordensServico: OrdemServico[];
  ontInfo: OntInfo[];
  consumo: Consumo;
}
