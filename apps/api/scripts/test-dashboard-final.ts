
import "dotenv/config";
import { DashboardService } from "../src/services/dashboardService";
import { ixcService } from "../src/services/ixcService";

async function testDashboard() {
    const dashboardService = new DashboardService(ixcService);
    const clientIds = [7]; // ID do Carlos que estamos usando para debug
    
    try {
        console.log(`[TEST] Gerando dashboard para IDs: ${clientIds}`);
        const data = await dashboardService.gerarDashboard(clientIds, "127.0.0.1");
        console.log("[TEST] Dashboard gerado com sucesso!");
        console.log(JSON.stringify(data, null, 2).substring(0, 500) + "...");
    } catch (error) {
        console.error("[TEST] ERRO AO GERAR DASHBOARD:");
        console.error(error);
    }
}

testDashboard();
