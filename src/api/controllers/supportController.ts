// api/src/api/controllers/supportController.ts

import { Request, Response } from "express";
import { activeAIProvider } from "../../services/ai"; // Importa o provedor ativo (pode ser o orquestrador ou um único)
import { AIMessage } from "../../services/ai/providers/IAIProvider";
import { ixcService } from "../../services/ixcServiceClass"; // Import ixcService
import { buildCustomerContext } from "../../websocket/utils"; // Import buildCustomerContext

export const supportAI = async (req: Request, res: Response) => {
  const { message, conversationHistory = [] } = req.body; // Recebe histórico e mensagem
  const userId = (req as any).userId; // Assuming userId is available from authentication middleware

  if (!message) {
    return res.status(400).json({ ok: false, error: "Mensagem é obrigatória." });
  }

  try {
    // Adiciona a mensagem do usuário ao histórico
    const userMessage: AIMessage = { role: "user", content: message };
    const fullConversation: AIMessage[] = [...conversationHistory, userMessage];

    // Buscar o contexto do cliente
    const customerContext = await buildCustomerContext(userId);

    // Cria a mensagem de sistema com o contexto do cliente
    const systemPrompt = `Você é o assistente virtual de um provedor de internet (ISP) chamado FiberNet.
    Seu objetivo é ajudar o cliente de forma eficiente e amigável.

    INFORMAÇÕES DO CLIENTE:
    - Nome: ${customerContext.customerName || "Não disponível"}
    - Email: ${customerContext.customerEmail || "Não disponível"}
    - Faturas em aberto: ${customerContext.openInvoices}
    - Conexões ativas: ${customerContext.activeConnections}

    DIRETRIZES:
    - Seja proativo, empático e eficiente.
    - Ofereça soluções práticas e diretas.
    - Se houver problema de rede, explique a situação e dê uma previsão de resolução.
    - Para questões financeiras, seja claro sobre valores e datas.
    - Sempre que possível, resolva a questão sem a necessidade de transferir para um atendente humano.
    - Mantenha as respostas concisas e focadas no problema.
    - Se o cliente perguntar sobre "segunda via de boleto", direcione-o para a área de faturas.
    - Se o cliente perguntar sobre "velocidade da internet", peça para ele verificar no painel do cliente ou ofereça um teste de velocidade.
    `;

    const messagesToSend: AIMessage[] = [
      { role: "system", content: systemPrompt },
      ...fullConversation
    ];

    const result = await activeAIProvider.chat(messagesToSend);

    // Adiciona a resposta da IA ao histórico para a próxima interação
    const updatedConversation = [...fullConversation, { role: "assistant", content: result.content }];

    return res.json({
      ok: true,
      reply: result.content,
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
      conversationHistory: updatedConversation, // Retorna o histórico atualizado
    });
  } catch (error: any) {
    console.error("Erro no suporte AI:", error);
    return res.status(500).json({
      ok: false,
      error: "Desculpe, estou com dificuldades técnicas. Por favor, tente novamente mais tarde.",
      details: error.message,
    });
  }
};
