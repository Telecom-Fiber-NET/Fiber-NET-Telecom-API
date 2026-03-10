
import "dotenv/config";
import { ixcService } from "../src/services/ixcService";

async function run() {
    try {
        console.log("Iniciando teste de consumo...");

        // 1. Buscar um cliente qualquer (limitado a 1) para pegar um ID válido
        // Como não tenho um método "listar todos", vou tentar buscar por ID 1, 2, etc, até achar.
        // Ou melhor, vou usar buscarClientesPorId com um ID que sei que existe ou tentar listar se houver método.
        // O ixcService tem 'buscarClientesPorId'. Vou tentar o ID 1, depois o ID 5760 (do meu teste anterior).

        let clienteId = 5760; // ID conhecido de testes anteriores
        let cliente = await ixcService.buscarClientesPorId(clienteId);

        if (!cliente) {
            console.log(`Cliente ${clienteId} não encontrado. Tentando ID 1...`);
            cliente = await ixcService.buscarClientesPorId(1);
            clienteId = 1;
        }

        if (!cliente) {
            console.error("Nenhum cliente encontrado para teste.");
            return;
        }

        console.log(`Cliente encontrado: ${cliente.razao} (ID: ${cliente.id})`);

        // 2. Listar logins do cliente
        const logins = await ixcService.loginsListar(cliente.id);
        console.log(`Encontrados ${logins.length} logins.`);

        if (logins.length === 0) {
            console.warn("Cliente sem logins. Teste de consumo abortado.");
            return;
        }

        const login = logins[0];
        console.log(`Testando consumo para Login ID: ${login.id} (${login.login})`);

        // 3. Buscar consumo completo
        const consumo = await ixcService.getConsumoCompleto(login);

        console.log("\n--- RESULTADO DO CONSUMO ---");
        console.log(JSON.stringify(consumo, null, 2));
        console.log("----------------------------\n");

    } catch (error) {
        console.error("Erro durante o teste:", error);
    }
}

run();
