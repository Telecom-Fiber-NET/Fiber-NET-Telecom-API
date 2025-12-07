export interface DashboardFatura {
  id: number;
  vencimento: string;
  valor: string;
  status: string;
  pix_code?: string;
  linha_digitavel?: string;
}