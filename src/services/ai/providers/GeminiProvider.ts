import { GoogleGenerativeAI } from "@google/generative-ai";
import { IAIProvider, AIMessage, AIResponse, AIProviderConfig } from "./IAIProvider";

export class GeminiProvider implements IAIProvider {
  name = "Gemini";
  isAvailable = true;
  private client: GoogleGenerativeAI;
  public config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 2000,
      ...config,
    };

    this.client = new GoogleGenerativeAI(this.config.apiKey);
  }

  async chat(messages: AIMessage[], customConfig?: Partial<AIProviderConfig>): Promise<AIResponse> {
    try {
      const model = this.client.getGenerativeModel({ 
        model: customConfig?.model || this.config.model,
      });

      // Gemini aceita um array de objetos com role e parts (content)
      const formattedMessages = messages.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role, // Gemini não tem 'system' role direto em chat, usa 'user' para instruções
        parts: [{ text: msg.content }],
      }));

      const result = await model.generateContent({
        contents: formattedMessages,
        generationConfig: {
          temperature: customConfig?.temperature || this.config.temperature,
          maxOutputTokens: customConfig?.maxTokens || this.config.maxTokens,
        },
      });
      const response = result.response;

      return {
        content: response.text(),
        provider: this.name,
        model: this.config.model, // O modelo usado
        tokensUsed: response.usageMetadata?.totalTokenCount,
      };
    } catch (error: any) {
      console.error(`GeminiProvider Error: ${error.message}`);
      this.isAvailable = false;
      throw new Error(`Gemini Error: ${error.message}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({ model: this.config.model });
      await model.generateContent('ping'); // Requisição mínima
      this.isAvailable = true;
      return true;
    } catch (error) {
      console.error(`GeminiProvider Health Check Failed: ${error}`);
      this.isAvailable = false;
      return false;
    }
  }

  estimateCost(messages: AIMessage[]): number {
    // Estimativa de custo para Gemini 1.5 Pro (preços podem variar)
    // Exemplo: Gemini 1.5 Pro: $3.50 / 1M input tokens, $10.50 / 1M output tokens
    const inputTokensPerMillion = 3.50;
    const outputTokensPerMillion = 10.50;

    const totalInputChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    const estimatedInputTokens = Math.ceil(totalInputChars / 4);

    const estimatedOutputTokens = 500; 

    const inputCost = (estimatedInputTokens / 1_000_000) * inputTokensPerMillion;
    const outputCost = (estimatedOutputTokens / 1_000_000) * outputTokensPerMillion;

    return inputCost + outputCost;
  }
}
