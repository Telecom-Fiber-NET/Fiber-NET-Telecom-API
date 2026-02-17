export interface DashboardFatura {
  id: number;
  vencimento: string;
  valor: string;
  valor_recebido: string;
  status: string;
  pix_code?: string;
  linha_digitavel?: string;
  data_pagamento?: string;
}
