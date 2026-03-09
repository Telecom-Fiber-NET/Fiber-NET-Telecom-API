
import axios from "axios";
import "dotenv/config";

// Reimplementação simples do fetchIxc para debug
const getBaseUrl = () => {
    let url = process.env.IXC_API_URL || process.env.IXC_BASE_URL;
    if (url && url.endsWith("/")) {
        url = url.slice(0, -1);
    }
    return url;
};

const getHeaders = () => {
    const token = process.env.IXC_ADMIN_TOKEN || process.env.IXC_AUTH_BASIC;
    return {
        Authorization: `Basic ${token}`,
        "Content-Type": "application/json",
        ixcsoft: "listar",
    };
};

async function fetchIxcDebug(endpoint: string, payload: any) {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/${endpoint}`;
    try {
        console.log(`[DEBUG] Request para ${url}`);
        console.log(`[DEBUG] Payload:`, JSON.stringify(payload));

        const resp = await axios.post(url, payload, { headers: getHeaders() });

        console.log(`[DEBUG] Status: ${resp.status}`);
        console.log(`[DEBUG] Total registros: ${resp.data.total}`);
        return resp.data.registros || [];
    } catch (error: any) {
        if (error.response) {
            console.error(`[ERRO API] Status: ${error.response.status}`);
            console.error(`[ERRO API] Data:`, error.response.data);
        } else {
            console.error(`[ERRO] ${error.message}`);
        }
        return [];
    }
}

async function run() {
    try {
        console.log("--- TESTE DE DEBUG CONSUMO ---");

        // Tentar listar qualquer registro de consumo diário
        console.log("Tentando listar últimos 5 registros de radusuarios_consumo_d...");
        const registros = await fetchIxcDebug("radusuarios_consumo_d", {
            qtype: "radusuarios_consumo_d.id",
            query: "0",
            oper: ">",
            page: "1",
            rp: "5",
            sortname: "radusuarios_consumo_d.id",
            sortorder: "desc",
        });

        console.log("Registros encontrados:", registros);

        if (registros.length > 0) {
            // Se encontrou algum, vamos ver a estrutura
            console.log("Estrutura do primeiro registro:", JSON.stringify(registros[0], null, 2));

            // Tentar buscar por login de um registro encontrado
            const idLogin = registros[0].id_login;
            console.log(`\nTentando filtrar pelo id_login ${idLogin} encontrado...`);

            const porLogin = await fetchIxcDebug("radusuarios_consumo_d", {
                qtype: "id_login",
                query: String(idLogin),
                oper: "=",
                page: "1",
                rp: "5",
                sortname: "data",
                sortorder: "desc",
            });
            console.log("Resultado por login:", porLogin.length);
        } else {
            console.log("Nenhum registro de consumo encontrado na tabela inteira.");
        }

    } catch (error) {
        console.error("Erro fatal:", error);
    }
}

run();
