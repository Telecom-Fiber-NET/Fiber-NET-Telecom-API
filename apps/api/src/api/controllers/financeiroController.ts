// src/api/controllers/financeiroController.ts
import { Request, Response } from "express";
import { ixcService } from "../../services/ixcService";

export async function getPixCode(req: Request, res: Response) {
  try {
    const { id } = req.params; // ID da fatura

    if (!id) {
      return res.status(400).json({ error: "ID da fatura é obrigatório" });
    }

    const pixData = await ixcService.buscarPixDetalhado(Number(id));

    if (!pixData) {
      return res.status(404).json({ error: "PIX não disponível ou erro ao gerar." });
    }

    return res.json(pixData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno ao buscar PIX" });
  }
}

export async function getResumo(req: any, res: Response) {
  try {
    const userIds = req.user?.ids || [];
    const idContrato = req.query.id_contrato ? Number(req.query.id_contrato) : undefined;

    if (!userIds || userIds.length === 0) {
      return res.status(401).json({ error: "Usuário não autenticado corretamente." });
    }

    const clienteId = Number(userIds[0]); // Usa o primeiro ID como principal

    // Opcional: Validar se o contrato pertence ao usuário, se fornecido
    if (idContrato) {
      const contrato = await ixcService.buscarContratoPorId(idContrato);
      if (!contrato || String(contrato.id_cliente) !== String(clienteId)) {
        // Poderia checar se está em userIds também, mas assumindo cliente principal por enquanto
        // Se id_cliente do contrato não estiver na lista de IDs do user, rejeita.
        if (!userIds.includes(String(contrato?.id_cliente))) {
          return res.status(403).json({ error: "Acesso negado a este contrato." });
        }
      }
    }

    const resumo = await ixcService.getResumoFinanceiro(clienteId, idContrato);
    return res.json(resumo);

  } catch (error) {
    console.error("[Financeiro] Erro ao obter resumo:", error);
    return res.status(500).json({ error: "Erro ao calcular resumo financeiro." });
  }
}
