import { GoogleGenerativeAI } from "@google/generative-ai";
import { DashboardData } from "../../types/dashboard/DashboardData";

export class Gemini {
  private static genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY || ""
  );

  static async analyzeDashboard(data: DashboardData) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY não configurada.");
      return { summary: "IA não disponível.", insights: [] };
    }

    try {
      // CORREÇÃO: Usando o nome padrão estável.
      // Se ainda der erro 404, troque para "gemini-pro"
      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });

      // Prepara os dados para economizar tokens e focar no essencial
      // Adicionado filtro para garantir que dados existam antes do map
      const context = {
        financeiro: (data.faturas || [])
          .slice(0, 3)
          .map((f) => ({ venc: f.vencimento, status: f.status })),
        consumo: data.consumo?.total_download || "0 GB",
        chamados: (data.ordensServico || [])
          .slice(0, 3)
          .map((os) => ({ assunto: os.id_assunto, status: os.status })),
        contrato: (data.contratos || []).map((c) => c.plano),
      };

      const prompt = `
        Atue como um especialista em Customer Success de um Provedor de Internet (ISP).
        Analise os dados deste cliente: ${JSON.stringify(context)}
        
        Gere uma resposta JSON estrita (sem markdown) com este formato:
        {
          "summary": "Uma frase resumindo a situação do cliente (ex: Cliente saudável, Risco de Cancelamento, etc)",
          "insights": ["Dica 1", "Dica 2", "Dica 3"]
        }
        Seja breve e direto. Se houver faturas atrasadas, alerte. Se houver muitos chamados, sugira contato proativo.
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Limpeza básica para garantir que o JSON seja parseado corretamente
      const cleanedText = responseText.replace(/```json|```/g, "").trim();

      return JSON.parse(cleanedText);
    } catch (error) {
      console.error("[Gemini] Erro na análise:", error);
      // Retorna um objeto neutro para não quebrar o dashboard
      return {
        summary: "Análise indisponível no momento.",
        insights: [],
      };
    }
  }
}
