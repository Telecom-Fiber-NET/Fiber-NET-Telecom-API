import { DashboardService } from "./src/services/dashboardService";
import { ixcService } from "./src/services/ixcService";

async function test() {
  const dashboardService = new DashboardService(ixcService);
  const clientIds = [4162, 4007];
  console.log(`Gerando dashboard para IDs: ${clientIds.join(", ")}`);
  
  const dashboard = await dashboardService.gerarDashboard(clientIds);
  
  console.log(`\nFaturas no Dashboard: ${dashboard.faturas.length}`);
  dashboard.faturas.forEach((f: import('./src/types/dashboard/DashboardFatura').DashboardFatura) => {
    console.log(`  ID: ${f.id} - Status: ${f.status} - Vencimento: ${f.vencimento} - Valor: ${f.valor}`);
  });

  console.log(`\nNotas Fiscais no Dashboard: ${dashboard.notas.length}`);
  dashboard.notas.forEach((n: any) => {
    console.log(`  ID: ${n.id} - NF: ${n.numero_nota || n.numero_nf} - Data: ${n.data_emissao}`);
  });
}

test().catch(console.error);
