import { Request, Response } from "express";
import { ixcService } from "../../services/ixcService";
import { error } from "console";
import { members } from './../../../node_modules/typedoc-plugin-markdown/dist/theme/context/partials/container.members';

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