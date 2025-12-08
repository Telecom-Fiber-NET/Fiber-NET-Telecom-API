import { Request, Response } from "express";
import { activeAIProvider } from "../../services/ai";
import { ixcService } from "../../services/ixcService";

export async function handleChat(req: Request, res: Response) {
  try {
    const { message } = req.body;
    const userId = req.user?.ids?.[0]; // Pega o ID do usuário logado

    if (!message) return res.status(400).json({ error: "Mensagem vazia." });

    // 1. Busca dados frescos do cliente para dar contexto à IA
    // Podemos reutilizar a lógica do dashboard ou buscar algo mais leve
    // Aqui vou simular uma busca rápida de contexto usando o serviço existente
    const [clientes, contratos, faturas, logins] = await Promise.all([
      ixcService.buscarClientesPorId(userId),
      ixcService.buscarContratosPorIdCliente(userId),
      ixcService.financeiroListar(userId),
      ixcService.loginsListar(userId),
    ]);

    const clientData = {
      clientes: [clientes],
      contratos,
      faturas,
      logins,
      consumo: {
        total_download: "Verificar no App",
        total_upload: "Verificar no App",
      }, // Simplificado para rapidez
    };

    // 2. Envia para a IA
    const responseText = await activeAIProvider.chat(message, clientData);

    return res.json({ text: responseText });
  } catch (error) {
    console.error("Erro no chat:", error);
    return res.status(500).json({ error: "Erro ao processar mensagem." });
  }
}