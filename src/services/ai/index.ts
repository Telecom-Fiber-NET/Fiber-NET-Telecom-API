import { OmniRouteProvider } from "./providers/OmniRouteProvider";
import { IAIProvider } from "./providers/IAIProvider";

// --- MODO OMNIROUTE EXCLUSIVO ---
export const activeAIProvider: IAIProvider = new OmniRouteProvider({
  apiKey: process.env.OMNIROUTE_API_KEY || '',
  model: process.env.OMNIROUTE_MODEL || 'gpt-4o',
  baseURL: process.env.OMNIROUTE_BASE_URL || 'http://localhost:3000/api/v1',
});


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
