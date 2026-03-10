
import "dotenv/config";
import { ixcService } from "../src/services/ixcService";
import { DashboardService } from "../src/services/dashboardService";
import { cacheSet } from "../src/services/cache/supabaseClient";

async function realizarValidacaoFinal() {
    const dashboardService = new DashboardService();
    const usuarios = [
        { email: "carlos847@gmail.com", label: "CARLOS (Teste de Bloqueio Inteligente)" },
        { email: "anderluciaoliveira@yahoo.com.br", label: "ANDERLUCIA (Teste de Assinatura)" }
    ];

    for (const user of usuarios) {
        console.log(`\n=== VALIDANDO: ${user.label} ===`);
        try {
            const cliente = await ixcService.buscarClientePorEmail(user.email);
            if (!cliente) {
                console.log(`❌ Usuário ${user.email} não encontrado.`);
                continue;
            }

            // Limpa cache para pegar dados vivos
            await cacheSet(`dashboard:${cliente.id}`, null, 0);

            const data = await dashboardService.gerarDashboard([Number(cliente.id)], "127.0.0.1");

            console.log(`> Contratos encontrados: ${data.contratos.length}`);
            data.contratos.forEach((c: any) => {
                console.log(`  [Contrato ${c.id}]`);
                console.log(`  - Situação: ${c.situacao.toUpperCase()}`);
                console.log(`  - Cor Sugerida: ${c.cor}`);
                console.log(`  - Status Amigável: ${c.status_acesso}`);
                console.log(`  - Código IXC: ${c.status_internet}`);
            });

            console.log(`> Logins e Wi-Fi:`);
            data.logins.forEach((l: any) => {
                console.log(`  - Login: ${l.login} | Status: ${l.status}`);
                console.log(`  - Wi-Fi: ${l.wifi_ssid || 'N/A'} | Sinal: ${l.sinal || 'N/A'}`);
            });

        } catch (e: any) {
            console.log(`❌ Erro no usuário ${user.email}: ${e.message}`);
        }
    }
}

realizarValidacaoFinal();
