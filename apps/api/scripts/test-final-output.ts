
import "dotenv/config";
import { ixcService } from "../src/services/ixcService";
import { DashboardService } from "../src/services/dashboardService";
import { cacheSet } from "../src/services/cache/supabaseClient";

async function testFinalDashboard() {
    const email = "carlos847@gmail.com";
    console.log(`[TESTE FINAL] Verificando novos campos para: ${email}`);

    try {
        const cliente = await ixcService.buscarClientePorEmail(email);
        if (!cliente) return console.log("❌ Cliente não encontrado.");

        // Limpa o cache para garantir dados novos
        await cacheSet(`dashboard:${cliente.id}`, null, 0);

        const dashboardService = new DashboardService();
        const data = await dashboardService.gerarDashboard([Number(cliente.id)], "127.0.0.1");

        console.log("\n--- DADOS DE WI-FI E CONEXÃO ---");
        data.logins.forEach((l: any) => {
            console.log(`Login:       ${l.login}`);
            console.log(`Wi-Fi 2.4G:  ${l.wifi_ssid || 'N/A'} | Senha: ${l.wifi_senha || 'N/A'}`);
            console.log(`Wi-Fi 5G:    ${l.wifi_ssid_5g || 'N/A'} | Senha: ${l.wifi_senha_5g || 'N/A'}`);
            console.log(`Sinal ONU:   ${l.sinal || 'N/A'} dBm`);
            console.log(`MAC ONU:     ${l.onu_mac || 'N/A'}`);
            console.log('---------------------------------------------');
        });

        console.log("\n--- NOTAS FISCAIS LOCALIZADAS ---");
        if (data.notas_fiscais && data.notas_fiscais.length > 0) {
            data.notas_fiscais.forEach((nf: any) => {
                console.log(`NF Nº: ${nf.numero} | Data: ${nf.data_emissao} | Valor: R$ ${nf.valor}`);
            });
        } else {
            console.log("Nenhuma nota fiscal encontrada para este cliente no momento.");
        }

    } catch (error: any) {
        console.error("Erro no teste final:", error.message);
    }
}

testFinalDashboard();
