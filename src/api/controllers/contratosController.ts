import { Response } from "express";
import { ixcService } from "../../services/ixcService";

export async function gerarPdfContrato(req: any, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID do contrato é obrigatório" });
    }
    const base64 = await ixcService.imprimirContrato(Number(id));

    if (!base64) {
      return res
        .status(404)
        .json({ error: "PDF do contrato indisponível ou error na geração." });
    }

    return res.json({ base64_document: base64 });
  } catch (error: any) {
    console.error("Error controller gerarPdfContrato:", error);
    return res.status(500).json({ error: "Error interno ao gerar contrato" });
  }
}

export async function assinarContrato(req: any, res: Response) {
  try {
    const { id_termo } = req.params;
    const clientIp =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";

    if (!id_termo) {
      return res.status(400).json({ error: "ID do termo é obrigatório" });
    }

    const result = await ixcService.assinarTermo(
      Number(id_termo),
      String(clientIp),
    );

    return res.json({
      success: true,
      message: "Contrato assinado com sucesso!",
      data: result,
    });
  } catch (error: any) {
    console.error("Erro ao assinar contrato:", error);
    return res
      .status(500)
      .json({ error: error.message || "Erro ao assinar contrato" });
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

export async function executarAutoDesbloqueio(req: any, res: Response) {
  try {
    const { id } = req.params; // ID do contrato
    
    if (!id) {
      return res.status(400).json({ error: "ID do contrato é obrigatório." });
    }

    // Chama o serviço
    const resultado = await ixcService.desbloqueioConfianca(Number(id));

    return res.json({
      success: true,
      message: "Desbloqueio de confiança realizado com sucesso! Reinicie seu equipamento em 2 minutos.",
      data: resultado
    });
  } catch (error: any) {
    return res.status(400).json({ 
      error: true, 
      message: error.message || "Erro ao processar desbloqueio." 
    });
  }
}
