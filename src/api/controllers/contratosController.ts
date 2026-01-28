import { Request, Response } from "express";
import { ixcService } from "../../services/ixcService";

export async function assinarContrato(req: any, res: Response) {
  try {
    const { id_termo } = req.params;
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";

    if (!id_termo) {
      return res.status(400).json({ error: "ID do termo é obrigatório" });
    }

    const result = await ixcService.assinarTermo(Number(id_termo), String(clientIp));

    return res.json({
      success: true,
      message: "Contrato assinado com sucesso!",
      data: result,
    });
  } catch (error: any) {
    console.error("Erro ao assinar contrato:", error);
    return res.status(500).json({ error: error.message || "Erro ao assinar contrato" });
  }
}

export async function listarTermos(req: any, res: Response) {
  try {
    const { id_contrato } = req.params;

    if (!id_contrato) {
      return res.status(400).json({ error: "ID do contrato é obrigatório" });
    }

    const termos = await ixcService.listarTermosPendentes(Number(id_contrato));
    return res.json(termos);
  } catch (error: any) {
    console.error("Erro ao listar termos:", error);
    return res.status(500).json({ error: "Erro ao listar termos" });
  }
}
