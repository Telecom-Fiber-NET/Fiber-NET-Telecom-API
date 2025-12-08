// api/src/api/routes/supportRoutes.ts

import { Router } from "express";
import { supportAI } from "../controllers/supportController";
import { AIOrchestrator } from "../../services/ai/AIOrchestrator"; // Importar a classe AIOrchestrator
import { activeAIProvider } from "../../services/ai"; // Importa a instância ativa

export const supportRoutes = Router();

// Rota para o chatbot de IA
supportRoutes.post("/ai", supportAI);

// Rota para obter o status dos provedores de IA (útil para monitoramento)
if (activeAIProvider instanceof AIOrchestrator) {
  supportRoutes.get("/ai/status", (req, res) => {
    return res.json({
      providers: activeAIProvider.getProvidersStatus(),
    });
  });
  // Rota para habilitar/desabilitar provedores manualmente
  supportRoutes.post("/ai/toggle-provider", (req, res) => {
    const { providerName, enabled } = req.body;
    activeAIProvider.setProviderEnabled(providerName, enabled);
    return res.json({
      success: true,
      status: activeAIProvider.getProvidersStatus(),
    });
  });
}