import OpenAI from 'openai';
import { IAIProvider, AIMessage, AIResponse, AIProviderConfig } from './IAIProvider';

export class OpenAIProvider implements IAIProvider {
  name = 'OpenAI';
  isAvailable = true; // Assume que está disponível até que um erro ocorra
  private client: OpenAI;
  public config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 2000,
      timeout: 30000, // 30 segundos
      ...config,
    };

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      timeout: this.config.timeout,
    });
  }

  async chat(messages: AIMessage[], customConfig?: Partial<AIProviderConfig>): Promise<AIResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: customConfig?.model || this.config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: customConfig?.temperature || this.config.temperature,
        max_tokens: customConfig?.maxTokens || this.config.maxTokens,
      });

      return {
        content: response.choices[0].message.content || '',
        provider: this.name,
        model: response.model,
        tokensUsed: response.usage?.total_tokens,
        finishReason: response.choices[0].finish_reason,
      };
    } catch (error: any) {
      console.error(`OpenAIProvider Error: ${error.message}`);
      this.isAvailable = false; // Marca como indisponível em caso de erro
      throw new Error(`OpenAI Error: ${error.message}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Tenta listar modelos para verificar a conectividade e a chave API
      await this.client.models.list();
      this.isAvailable = true;
      return true;
    } catch (error) {
      console.error(`OpenAIProvider Health Check Failed: ${error}`);
      this.isAvailable = false;
      return false;
    }
  }

  estimateCost(messages: AIMessage[]): number {
    // Estimativa de custo para GPT-4o (preços podem variar, consulte a documentação da OpenAI)
    // Exemplo: GPT-4o: $5.00 / 1M input tokens, $15.00 / 1M output tokens
    const inputTokensPerMillion = 5.00;
    const outputTokensPerMillion = 15.00;

    const totalInputChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    const estimatedInputTokens = Math.ceil(totalInputChars / 4); // Aproximação de tokens por caractere

    // Estimamos 500 tokens de saída para uma resposta média
    const estimatedOutputTokens = 500; 

    const inputCost = (estimatedInputTokens / 1_000_000) * inputTokensPerMillion;
    const outputCost = (estimatedOutputTokens / 1_000_000) * outputTokensPerMillion;

    return inputCost + outputCost;
  }
}
