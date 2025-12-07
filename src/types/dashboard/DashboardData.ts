import { DashboardCliente } from "./DashboardCliente";
import { DashboardContrato } from "./DashboardContrato";
import { DashboardFatura } from "./DashboardFatura";
import { DashboardLogin } from "./DashboardLogin";

export interface DashboardConsumoHistoryItem {
  data: string;
  download_bytes: number;
  upload_bytes: number;
}

export interface DashboardConsumo {
  total_download_bytes: number;
  total_upload_bytes: number;
  // Novos campos formatados
  total_download: string;
  total_upload: string;

  history: {
    daily: DashboardConsumoHistoryItem[]; // Últimos 30 dias (ou o padrão que vier)
    weekly: DashboardConsumoHistoryItem[]; // Últimos 7 dias
    monthly: Array<{
      mes_ano: string;
      download_bytes: number;
      upload_bytes: number;
    }>;
  };
}

export interface DashboardData {
  clientes: DashboardCliente[];
  contratos: DashboardContrato[];
  faturas: DashboardFatura[];
  logins: DashboardLogin[];
  notas: any[];
  ordensServico: any[];
  ontInfo: any[];
  consumo: DashboardConsumo;
}
