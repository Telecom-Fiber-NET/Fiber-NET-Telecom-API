import { Request, Response } from "express";
import { ixcService } from "../../services/ixcService";

/**
 * Lista os comodatos vinculados a um contrato.
 * GET /api/contratos/:id/comodatos
 */
export async function listarComodatosContrato(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "ID do contrato é obrigatório." });
    const comodatos = await ixcService.listarComodatos(Number(id));
    return res.json({ id_contrato: Number(id), total: comodatos.length, comodatos });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Erro ao listar comodatos" });
  }
}

/**
 * Cancela um contrato no IXC (baixa comodato + cancela financeiro).
 * POST /api/contratos/:id/cancelar
 */
export async function cancelarContrato(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "ID do contrato é obrigatório." });
    }

    const {
      id_almox,
      id_filial_baixa,
      motivo_cancelamento,
      obs_cancelamento,
      data_cancelamento,
      forcar, // GUARDRAILS: true para bypass explicito (uso manual apenas)
    } = req.body || {};

    const resultado = await ixcService.cancelarContrato({
      idContrato: Number(id),
      idAlmox: id_almox,
      idFilialBaixa: id_filial_baixa,
      motivo: motivo_cancelamento,
      obs: obs_cancelamento,
      dataCancelamento: data_cancelamento,
      forcar: forcar === true || forcar === "true",
    });

    const cancelamento: any = resultado.cancelamento || {};
    const bloqueadoGuardrails = /BLOQUEADO pelo guardrails|bloqueado pelo guardrails/.test(JSON.stringify(cancelamento));
    const sucesso =
      cancelamento.type === "success" ||
      /já cancelado|cancelado/.test(JSON.stringify(cancelamento));

    // 403 se o guardrails bloqueou (não é erro de servidor, é regra de negócio)
    return res.status(bloqueadoGuardrails ? 403 : sucesso ? 200 : 400).json({
      success: sucesso,
      bloqueado_guardrails: bloqueadoGuardrails,
      id_contrato: Number(id),
      baixa: resultado.baixa,
      cancelamento: resultado.cancelamento,
    });
  } catch (error: any) {
    console.error("Erro ao cancelar contrato:", error);
    return res.status(500).json({
      error: true,
      message: error?.message || "Erro ao cancelar contrato",
    });
  }
}
