import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

// Verifica a chave da API
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey) {
  console.warn("⚠️ GEMINI_API_KEY não configurada. A IA não funcionará.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// Modelo atualizado
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
});

export class GeminiService {
  /**
   * Chat inteligente com contexto do cliente
   */
  static async chat(message: string, clientData: any): Promise<string> {
    // Fallback se não houver chave
    if (!apiKey)
      return "Estou em modo de manutenção (sem chave de API). Por favor, contate o suporte humano.";

    try {
      // Cria um resumo do cliente para a IA entender o contexto
      const contexto = `
        DADOS DO CLIENTE:
        - Nome: ${clientData.clientes[0]?.nome || "Cliente"}
        - Contratos: ${clientData.contratos
          .map(
            (c: any) => `${c.plano} (${c.status === "A" ? "Ativo" : "Inativo"})`
          )
          .join(", ")}
        - Faturas em Aberto: ${
          clientData.faturas.filter((f: any) => f.status === "A").length
        }
        - Status da Conexão: ${
          clientData.logins[0]?.online === "S" ? "Online" : "Offline"
        }
        - Consumo: Download ${
          clientData.consumo?.total_download || "0"
        }, Upload ${clientData.consumo?.total_upload || "0"}
      `;

      const prompt = `
        Você é a Fiber.IA, assistente virtual da Fiber Net Telecom.
        
        CONTEXTO DO CLIENTE ATUAL:
        ${contexto}

        SUA MISSÃO:
        Responder à pergunta do usuário: "${message}"

        DIRETRIZES:
        1. Seja curto, educado e resolutivo.
        2. Se o cliente perguntar sobre faturas, use os dados acima para responder se há pendências.
        3. Se relatar lentidão, verifique o status da conexão nos dados acima.
        4. Se perguntar sobre algo que você não sabe (como mudança de endereço), oriente a ligar para o suporte.
        5. NUNCA invente dados.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("[Gemini Chat] Erro:", error);
      return "Desculpe, tive um problema técnico momentâneo. Pode repetir?";
    }
  }

  /**
   * Analisa os dados e gera DICAS ÚTEIS (Compatibilidade com Dashboard)
   */
  static async analyzeDashboard(data: any): Promise<string> {
    // Reutiliza a lógica se necessário ou mantém separada
    // ... (código do analyzeDashboard anterior se você usar) ...
    return "{}"; // Placeholder se não for usado aqui
  }
}
