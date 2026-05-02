import { OmniRouteProvider } from "./providers/OmniRouteProvider";
import { IAIProvider } from "./providers/IAIProvider";

// --- MODO OPENROUTER ---
export const activeAIProvider: IAIProvider = new OmniRouteProvider({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '',
  model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o',
  baseURL: 'https://openrouter.ai/api/v1',
});
