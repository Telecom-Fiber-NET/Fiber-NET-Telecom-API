
import "dotenv/config";
import { ixcService } from "../src/services/ixcService";

async function testStatusAcesso() {
    const cpf = "135.477.317-98";
    console.log(`[TESTE] Verificando status de acesso para CPF: ${cpf}`);

    try {
        const clientes = await ixcService.buscarClientesPorCpf(cpf);
        if (clientes.length === 0) {
            console.log("❌ Cliente não encontrado.");
            return;
        }

        const cliente = clientes[0];
        console.log(`✅ Cliente encontrado: ${cliente.razao} (ID: ${cliente.id})`);

        const contratos = await ixcService.buscarContratosPorIdCliente(Number(cliente.id));
        console.log(`--- CONTRATOS (${contratos.length}) ---`);

        contratos.forEach((c: any) => {
            console.log(`Contrato ID: ${c.id}`);
            console.log(`Descrição:   ${c.contrato}`);
            console.log(`Status GERAL: ${c.status}`); // A=Ativo, I=Inativo, etc
            console.log(`Status ACESSO: ${c.status_internet}`); // CA=Bloqueio Automático, FA=Financeiro Atraso, etc
            
            // Tradução do Status baseada no esquema do IXC
            const statusMap: any = {
                'A': 'Ativo',
                'D': 'Desativado',
                'CM': 'Bloqueio Manual',
                'CA': 'Bloqueio Automático',
                'FA': 'Financeiro em Atraso',
                'AA': 'Aguardando Assinatura'
            };

            console.log(`Situação Real: ${statusMap[c.status_internet] || 'Desconhecido (' + c.status_internet + ')'}`);
            console.log('----------------------------');
        });

    } catch (error: any) {
        console.error("Erro no teste:", error.message);
    }
}

testStatusAcesso();
