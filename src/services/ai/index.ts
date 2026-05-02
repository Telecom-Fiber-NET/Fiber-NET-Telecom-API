import { OmniRouteProvider } from "./providers/OmniRouteProvider";
import { IAIProvider } from "./providers/IAIProvider";

// --- MODO OPENROUTER (Modelos Gratuitos) ---
// Modelos recomendados: 
// - google/gemini-2.0-flash-lite-preview-02-05:free
// - deepseek/deepseek-r1:free
// - mistralai/mistral-7b-instruct:free

export const activeAIProvider: IAIProvider = new OmniRouteProvider({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '',
  model: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-lite-preview-02-05:free',
  baseURL: 'https://openrouter.ai/api/v1',
});
