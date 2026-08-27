import { Request, Response } from "express";
import { ixcService } from "../../services/ixcService";

/**
 * Corrige contratos que travaram no cancelamento (eram de "comodato não
 * devolvido"). Agora o ixcService.cancelarContrato lista os comodatos reais
 * e baixa cada um pelo ID do registro (não pelo ID do contrato). Esta rota
 * aceita um lote de IDs e devolve um relatório.
 *
 * POST /api/corrigir/cancelar
 * body: { ids: ["6018","6008",...], id_almox?, id_filial_baixa?, motivo?, obs?, data? }
 */
export async function corrigirCancelarLote(req: Request, res: Response) {
  try {
    const body = req.body || {};
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
    if (ids.length === 0) {
      return res.status(400).json({ error: "Envie 'ids' (array de IDs de contrato)." });
    }
    // segurança: limita tamanho do lote por request
    if (ids.length > 200) {
      return res
        .status(400)
        .json({ error: "Lote muito grande (máx 200). Divida em lotes." });
    }

    const relatorio: any[] = [];
    for (const rawId of ids) {
      const id = String(rawId).trim();
      try {
        const r = await ixcService.cancelarContrato({
          idContrato: id,
          idAlmox: body.id_almox,
          idFilialBaixa: body.id_filial_baixa,
          motivo: body.motivo || "11",
          obs: body.obs || "Correcao de cancelamento travado - comodato",
          dataCancelamento: body.data || new Date().toISOString().slice(0, 10),
          forcar: body.forcar === true || body.forcar === "true", // GUARDRAILS: default false
        });
        const cancel: any = r.cancelamento || {};
        const bloqueado = /BLOQUEADO pelo guardrails|bloqueado pelo guardrails/.test(JSON.stringify(cancel));
        const ok =
          cancel.type === "success" ||
          /já cancelado|cancelado/.test(JSON.stringify(cancel));
        relatorio.push({
          id_contrato: id,
          sucesso: ok,
          bloqueado_guardrails: bloqueado,
          baixa: r.baixa,
          cancelamento: r.cancelamento,
        });
      } catch (e: any) {
        relatorio.push({
          id_contrato: id,
          sucesso: false,
          erro: e?.message || String(e),
        });
      }
    }

    const sucessos = relatorio.filter((r) => r.sucesso).length;
    return res.json({
      total: relatorio.length,
      sucessos,
      falhas: relatorio.length - sucessos,
      relatorio,
    });
  } catch (error: any) {
    console.error("Erro em corrigirCancelarLote:", error);
    return res.status(500).json({ error: true, message: error?.message });
  }
}

/**
 * Baixa um comodato pelo ID DO REGISTRO (quando o token não tem permissão
 * para LISTAR a tabela cliente_contrato_comodato, o ID pode ser informado
 * manualmente — vem da aba Comodato do contrato no painel IXC).
 * POST /api/comodato/baixar
 * body: { id_comodato, id_almox?, id_filial_baixa? }
 */
export async function baixarComodatoExplicito(req: Request, res: Response) {
  try {
    const { id_comodato, id_almox = "1", id_filial_baixa = "1" } = req.body || {};
    if (!id_comodato) {
      return res.status(400).json({ error: "Envie 'id_comodato' (ID do registro de comodato)." });
    }
    const r = await ixcService.executeAction("baixar_comodato_23069", {
      id: String(id_comodato),
      id_almox,
      id_almox_label: "Almoxarifado Principal",
      id_filial_baixa,
      id_filial_baixa_label: "Filial 1",
    });
    const ok = /devolvido|success/.test(JSON.stringify(r).toLowerCase());
    return res.status(ok ? 200 : 400).json({ success: ok, id_comodato, resposta: r });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message });
  }
}
export async function statusContrato(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "ID do contrato obrigatório." });
    const contrato: any = await ixcService.buscarContratoPorId(Number(id));
    if (!contrato) return res.status(404).json({ error: "Contrato não encontrado." });
    return res.json({
      id_contrato: Number(id),
      status: contrato.status,
      status_internet: contrato.status_internet,
      data_cancelamento: contrato.data_cancelamento,
      motivo_cancelamento: contrato.motivo_cancelamento,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message });
  }
}
