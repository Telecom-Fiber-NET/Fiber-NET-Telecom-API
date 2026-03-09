
import "dotenv/config";
import { ixcService } from "../src/services/ixcService";
import { DashboardService } from "../src/services/dashboardService";

async function testDashboardChanges() {
    const email = "carlos847@gmail.com";
    console.log(`[TESTE] Iniciando simulação de Dashboard para: ${email}`);

    try {
        // 1. Busca o cliente pelo email (Simulando o que o login faz)
        const cliente = await ixcService.buscarClientePorEmail(email);
        if (!cliente) {
            console.log("❌ Cliente não encontrado.");
            return;
        }

        console.log(`✅ Cliente ID ${cliente.id} localizado.`);

        // 2. Gera o Dashboard para este cliente
        const dashboardService = new DashboardService();
        const data = await dashboardService.gerarDashboard([Number(cliente.id)], "127.0.0.1");

        console.log("\n--- VERIFICAÇÃO DE CONTRATOS NO DASHBOARD ---");
        if (data.contratos && data.contratos.length > 0) {
            data.contratos.forEach((c: any) => {
                console.log(`ID Contrato:     ${c.id}`);
                console.log(`Plano:           ${c.plano}`);
                console.log(`Status Geral:    ${c.status}`);
                console.log(`Status ACESSO:   ${c.status_acesso}`); // <-- Campo novo
                console.log(`Status INTERNET: ${c.status_internet}`); // <-- Campo novo
                console.log('---------------------------------------------');
            });
        } else {
            console.log("Nenhum contrato encontrado no Dashboard.");
        }

    } catch (error: any) {
        console.error("Erro no teste de dashboard:", error.message);
    }
}

testDashboardChanges();
