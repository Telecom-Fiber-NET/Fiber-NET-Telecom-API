import { Request, Response } from "express";
import { DashboardService } from "../../services/dashboardService";
import { ixcService } from "../../services/ixcService";

// instancia simples; para produção injetar dependências
const dashboardService = new DashboardService(ixcService);

export async function getDashboard(req: any, res: Response) {
  try {
    // ids podem vir do token: req.user.ids
    const ids: number[] = Array.isArray(req.user?.ids) ? req.user.ids : (req.query.ids ? String(req.query.ids).split(",").map(Number) : []);
    if (!ids || ids.length === 0) {
      return res.status(400).json({ error: "Nenhum client id fornecido (no token ou query param ids)" });
    }

    const data = await dashboardService.gerarDashboard(ids);
    return res.json(data);
  } catch (err) {
    console.error("Erro controller getDashboard:", err);
    return res.status(500).json({ error: "Erro ao obter dashboard" });
  }
}