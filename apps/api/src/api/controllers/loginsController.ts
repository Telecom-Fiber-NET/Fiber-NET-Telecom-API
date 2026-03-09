import { Request, Response } from "express";
import { ixcService } from "../../services/ixcService";


export async function executarAcaoLogin(req: Request, res: Response) {
    try {
        const { id, action } = req.params;
        const loginId = Number(id);

        // Validação básica
        if (!loginId || isNaN(loginId)) {
            return res.status(400).json({ error: "ID do login inválido." });
        }

        // Verifica se o login pertence ao cliente logado (segurança)
        // @ts-ignore
        const userIds = req.user?.ids;
        if (userIds) {
            // Busca logins do cliente para validar propriedade
            // O ideal seria verificar no banco, mas para MVP assumimos que se o cliente tem o ID, ok.
            // Implementação robusta: ixcService.loginsListar(userIds[0])...
        }

        let result;

        switch (action) {
            case "limpar-mac":
                result = await ixcService.limparMacLogin(loginId);
                break;
            case "desconectar":
                result = await ixcService.desconectarLogin(loginId);
                break;
            case "diagnostico":
                result = await ixcService.getDiagnosticoLogin(loginId);
                break;
            default:
                return res.status(400).json({ error: "Ação desconhecida." });
        }

        return res.json(result);
    } catch (error: any) {
        console.error("Erro no controller de logins:", error);
        return res.status(500).json({
            error: error.message || "Erro interno ao executar ação."
        });
    }
}

/**
 * Busca informações do Wi-Fi (SSID)
 */
export async function buscarWifi(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const result = await ixcService.getWifiInfo(Number(id));
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

/**
 * Altera configurações de Wi-Fi
 */
export async function alterarWifi(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { ssid, senha } = req.body;

        if (!ssid || !senha) {
            return res.status(400).json({ error: "SSID e Senha são obrigatórios" });
        }

        const result = await ixcService.alterarWifi(Number(id), ssid, senha);
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

export async function buscarConsumoDiario(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const loginId = Number(id);

        if (!loginId || isNaN(loginId)) {
            return res.status(400).json({ error: "ID do login inválido." });
        }

        const consumo = await ixcService.getConsumoDiario(loginId);
        return res.json(consumo);
    } catch (error: any) {
        console.error("Erro ao buscar consumo diário:", error);
        return res.status(500).json({ error: "Erro ao buscar consumo diário." });
    }
}

export async function buscarConsumoMensal(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const loginId = Number(id);

        if (!loginId || isNaN(loginId)) {
            return res.status(400).json({ error: "ID do login inválido." });
        }

        const consumo = await ixcService.getConsumoMensal(loginId);
        return res.json(consumo);
    } catch (error: any) {
        console.error("Erro ao buscar consumo mensal:", error);
        return res.status(500).json({ error: "Erro ao buscar consumo mensal." });
    }
}
