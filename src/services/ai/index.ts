// api/src/services/ai/index.ts

// Importe todos os provedores disponíveis
import { OpenAIProvider } from "./providers/OpenAIProvider";
import { ClaudeProvider } from "./providers/ClaudeProvider";
import { GeminiProvider } from "./providers/GeminiProvider";
import { GroqProvider } from "./providers/GroqProvider";
import { AIOrchestrator } from "./AIOrchestrator";
import { IAIProvider } from "./providers/IAIProvider";

// --- ESCOLHA SEU MODO DE OPERAÇÃO ---

// Opção 1: Usar o Orquestrador (RECOMENDADO para resiliência e roteamento inteligente)
// O orquestrador gerencia múltiplos provedores, faz health checks e fallback automático.
export const activeAIProvider = new AIOrchestrator();


// Opção 2: Usar um único provedor diretamente (se você não precisa de fallback ou roteamento)
// Descomente a linha do provedor que deseja usar e comente a linha do AIOrchestrator acima.
/*
export const activeAIProvider: IAIProvider = new GeminiProvider({
  apiKey: process.env.GOOGLE_API_KEY!,
  model: "gemini-1.5-pro"
});
*/

/*
export const activeAIProvider: IAIProvider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4o"
});
*/

/*
export const activeAIProvider: IAIProvider = new ClaudeProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: "claude-3-5-sonnet-20241022"
});
*/

/*
export const activeAIProvider: IAIProvider = new GroqProvider({
  apiKey: process.env.GROQ_API_KEY!,
  model: "llama-3.1-70b-versatile"
});
*/
