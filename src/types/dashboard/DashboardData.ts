import { DashboardCliente } from "./DashboardCliente";
import { DashboardContrato } from "./DashboardContrato";
import { DashboardFatura } from "./DashboardFatura";
import { DashboardLogin } from "./DashboardLogin";

import { DashboardConsumo } from "./DashboardConsumo";

export { DashboardConsumo, DashboardConsumoHistoryItem } from "./DashboardConsumo";

export interface DashboardData {
  clientes: DashboardCliente[];
  contratos: DashboardContrato[];
  faturas: DashboardFatura[];
  logins: DashboardLogin[];
  notas: any[];
  ordensServico: any[];
  tickets: any[];
  termos: any[];
  ontInfo: any[];
  consumo: DashboardConsumo;
  ai_analysis?: {
    summary: string;
    insights: Array<{
      type: "positive" | "negative" | "warning";
      title: string;
      message: string;
    }>;
  };
}
