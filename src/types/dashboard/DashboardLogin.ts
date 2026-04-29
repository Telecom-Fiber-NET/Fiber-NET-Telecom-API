import { DashboardConsumo } from "./DashboardConsumo";

export interface DashboardLogin {
  raw: number | string;
  id: number | string;
  login: string;
  status: string;
  uptime?: string;
  contrato_id?: number | string;
  download_atual?: string;
  upload_atual?: string;
  // Novos campos
  ip_privado?: string;
  ip_publico?: string;
  ipv4?: string;
  endereco?: string;
  plano?: string;
  consumo?: DashboardConsumo;
}
