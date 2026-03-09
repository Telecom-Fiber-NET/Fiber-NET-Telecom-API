
import "dotenv/config";
import { ixcService } from "../src/services/ixcService";

async function debugLogin() {
    // Pegar argumentos da linha de comando
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.log("Uso: npx tsx scripts/debug-login.ts <email> <senha>");
        return;
    }

    try {
        console.log(`[DEBUG] Buscando cliente por email: ${email}`);
        const clientePrincipal = await ixcService.buscarClientePorEmail(email);

        if (!clientePrincipal) {
            console.error(`[ERRO] Cliente não encontrado com o email: ${email}`);
            return;
        }

        console.log(`[INFO] Cliente encontrado: ID ${clientePrincipal.id} - ${clientePrincipal.razao}`);
        
        const hotsite_senha = (clientePrincipal as any).hotsite_senha;
        const senha_legada = (clientePrincipal as any).senha;

        console.log("\n--- COMPARAÇÃO DE SENHA ---");
        console.log(`Senha fornecida no teste: "${password}"`);
        console.log(`hotsite_senha no IXC:    "${hotsite_senha || 'NULO/VAZIO'}"`);
        console.log(`senha (legada) no IXC:   "${senha_legada || 'NULO/VAZIO'}"`);
        console.log("----------------------------");

        const matchHotsite = hotsite_senha === password;
        const matchLegada = senha_legada === password;

        if (matchHotsite || matchLegada) {
            console.log("\n✅ SUCESSO: A senha coincide com " + (matchHotsite ? "hotsite_senha" : "senha legada") + ".");
        } else {
            console.log("\n❌ ERRO: A senha NÃO coincide com nenhuma das opções no IXC.");
        }

        // Mostrar outros campos relevantes para login
        console.log("\n--- DADOS RELEVANTES ---");
        console.log(`hotsite_email: ${clientePrincipal.hotsite_email}`);
        console.log(`email (geral): ${clientePrincipal.email}`);
        console.log(`CNPJ/CPF:      ${clientePrincipal.cnpj_cpf}`);
        console.log(`Status:        ${clientePrincipal.status}`);

    } catch (error) {
        console.error("Erro durante o debug:", error);
    }
}

debugLogin();
