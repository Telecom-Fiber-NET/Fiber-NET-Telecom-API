export interface DashboardContrato {
  id: number;
  plano: string;
  status: string;
  status_acesso?: string;
  status_internet?: string;
  situacao?: string; // NOVO: "bloqueado" ou "liberado"
  cor?: string;      // NOVO: "red", "green", "orange"
  pdf_link: string;
}