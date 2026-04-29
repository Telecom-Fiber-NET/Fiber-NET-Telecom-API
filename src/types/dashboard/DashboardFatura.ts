export interface DashboardFatura {
  id: number | string;
  id_cliente: number | string;
  id_contrato?: number | string;
  vencimento: string;
  valor: string;
  valor_recebido: string;
  status: string;
  pix_code?: string;
  linha_digitavel?: string;
  data_pagamento?: string;
}
