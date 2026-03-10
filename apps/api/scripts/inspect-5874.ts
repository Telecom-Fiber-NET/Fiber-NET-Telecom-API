
import "dotenv/config";
import { ixcService } from "../src/services/ixcService";

async function inspectContract() {
    const contractId = 5874;
    try {
        console.log(`[DEBUG] Buscando detalhes do contrato ID: ${contractId}`);
        const contrato = await ixcService.buscarContratoPorId(contractId);
        
        if (!contrato) {
            console.log("Contrato não encontrado.");
            return;
        }

        console.log("\n--- DADOS DO CONTRATO ---");
        console.log(`ID:        ${contrato.id}`);
        console.log(`Status:    ${contrato.status_internet}`);
        console.log(`Endereço:  ${contrato.endereco}`);
        console.log(`Número:    ${contrato.numero}`);
        console.log(`Bairro:    ${contrato.bairro}`);
        console.log(`Cidade:    ${contrato.cidade}`);
        console.log(`CEP:       ${contrato.cep}`);
        console.log(`Usa endereço padrão cliente? ${contrato.endereco_padrao_cliente}`);

        // Buscar também o cliente dono
        if (contrato.id_cliente) {
            const cliente = await ixcService.buscarClientesPorId(Number(contrato.id_cliente));
            console.log("\n--- DADOS DO CLIENTE (Dono) ---");
            console.log(`Nome:      ${cliente.razao}`);
            console.log(`Endereço:  ${cliente.endereco}`);
            console.log(`Número:    ${cliente.numero}`);
            console.log(`Bairro:    ${cliente.bairro}`);
        }

        // Buscar logins vinculados
        const logins = await ixcService.loginsListar(Number(contrato.id_cliente));
        const loginContrato = logins.filter((l: any) => String(l.id_contrato) === String(contractId));
        
        if (loginContrato.length > 0) {
            console.log("\n--- DADOS DE ENDEREÇO NO LOGIN (Radius) ---");
            loginContrato.forEach((l: any) => {
                console.log(`Login:     ${l.login}`);
                console.log(`Endereço:  ${l.endereco}`);
                console.log(`Número:    ${l.numero}`);
                console.log(`Bairro:    ${l.bairro}`);
            });
        }

    } catch (error) {
        console.error("Erro durante a inspeção:", error);
    }
}

inspectContract();
