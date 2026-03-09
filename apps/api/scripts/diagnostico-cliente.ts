
import "dotenv/config";
import { ixcService } from "../src/services/ixcService";
import { DashboardService } from "../src/services/dashboardService";

async function diagnosticoCliente() {
    const email = "nascimentoanderson333@gmail.com";
    console.log(`[DIAGNÓSTICO] Iniciando testes para: ${email}`);

    try {
        // 1. Busca o cliente
        const cliente = await ixcService.buscarClientePorEmail(email);
        if (!cliente) {
            console.log("❌ Cliente não localizado no IXC pelo e-mail informado.");
            return;
        }

        console.log(`✅ Cliente localizado: ${cliente.razao} (ID: ${cliente.id})`);
        console.log(`   CPF/CNPJ: ${cliente.cnpj_cpf}`);

        // 2. Gera os dados do Dashboard (onde aplicamos as novas lógicas)
        const dashboardService = new DashboardService();
        const dashboard = await dashboardService.gerarDashboard([Number(cliente.id)], "127.0.0.1");

        console.log("\n--- STATUS DOS CONTRATOS ---");
        if (dashboard.contratos && dashboard.contratos.length > 0) {
            dashboard.contratos.forEach((c: any) => {
                console.log(`Contrato ID:     ${c.id}`);
                console.log(`Plano:           ${c.plano || "Não definido"}`);
                console.log(`Status Geral:    ${c.status}`);
                console.log(`Status ACESSO:   ${c.status_acesso}`);
                console.log(`Status INTERNET: ${c.status_internet}`);
                
                if (c.status_internet === 'AA') {
                    console.log("⚠️ AÇÃO NECESSÁRIA: Aguardando Assinatura Digital.");
                } else if (['CA', 'FA'].includes(c.status_internet)) {
                    console.log("⚠️ AÇÃO NECESSÁRIA: Bloqueio Financeiro detectado.");
                }
                console.log('---------------------------------------------');
            });
        } else {
            console.log("Nenhum contrato ativo encontrado para este cliente.");
        }

        console.log("\n--- RESUMO FINANCEIRO ---");
        const faturasAbertas = dashboard.faturas.filter((f: any) => f.status === 'aberto');
        console.log(`Faturas em aberto: ${faturasAbertas.length}`);
        faturasAbertas.forEach((f: any) => {
            console.log(`- Vencimento: ${f.vencimento} | Valor: R$ ${f.valor}`);
        });

    } catch (error: any) {
        console.error("Erro durante o diagnóstico:", error.message);
    }
}

diagnosticoCliente();
