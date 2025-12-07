// src/api/controllers/financeiroController.ts
import { Request, Response } from "express";
import { ixcService } from "../../services/ixcService";

export async function getPixCode(req: Request, res: Response) {
  try {
    const { id } = req.params; // ID da fatura

    if (!id) {
      return res.status(400).json({ error: "ID da fatura é obrigatório" });
    }

    const pixData = await ixcService.getPixFatura(Number(id));

    if (!pixData) {
      return res.status(404).json({ error: "PIX não disponível ou erro ao gerar." });
    }

    return res.json(pixData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno ao buscar PIX" });
  }
}
