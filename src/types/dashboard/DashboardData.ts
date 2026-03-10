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
  notas_fiscais?: any[];
  ai_insights?: any[];
  ordensServico: any[];
  tickets: any[];
  termos: any[];
  ontInfo: any[];
  consumo: DashboardConsumo;
}
