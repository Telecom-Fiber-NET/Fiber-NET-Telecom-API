import { DashboardConsumo } from "./DashboardConsumo";

export interface DashboardLogin {
  raw: number;
  id: number;
  login: string;
  status: string;
  uptime?: string;
  contrato_id?: number;
  download_atual?: string;
  upload_atual?: string;
  // Novos campos
  ip_privado?: string;
  ip_publico?: string;
  ipv4?: string;
  endereco?: string;
  plano?: string;
  wifi_ssid?: string;
  wifi_senha?: string;
  wifi_ssid_5g?: string;
  wifi_senha_5g?: string;
  sinal?: string;
  onu_mac?: string;
  consumo?: DashboardConsumo;
}
