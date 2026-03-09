import Anthropic from '@anthropic-ai/sdk';
import { IAIProvider, AIMessage, AIResponse, AIProviderConfig } from './IAIProvider';

export class ClaudeProvider implements IAIProvider {
  name = 'Claude';
  isAvailable = true;
  private client: Anthropic;
  public config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 2000,
      timeout: 30000,
      ...config,
    };

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      timeout: this.config.timeout,
    });
  }

  async chat(messages: AIMessage[], customConfig?: Partial<AIProviderConfig>): Promise<AIResponse> {
    try {
      // Claude espera a mensagem do sistema separada das mensagens de conversação
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const conversationMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant', // Claude só aceita 'user' ou 'assistant' aqui
          content: m.content,
        }));

      const response = await this.client.messages.create({
        model: customConfig?.model || this.config.model,
        max_tokens: customConfig?.maxTokens ?? this.config.maxTokens ?? 500,
        temperature: customConfig?.temperature || this.config.temperature,
        system: systemMessage,
        messages: conversationMessages,
      });

      return {
        content: response.content[0].type === 'text' ? response.content[0].text : '',
        provider: this.name,
        model: response.model,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        finishReason: response.stop_reason || undefined,
      };
    } catch (error: any) {
      console.error(`ClaudeProvider Error: ${error.message}`);
      this.isAvailable = false;
      throw new Error(`Claude Error: ${error.message}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Tenta fazer uma requisição mínima para verificar a conectividade
      await this.client.messages.create({
        model: this.config.model,
        max_tokens: 10, // Requisição pequena para não gastar muito
        messages: [{ role: 'user', content: 'ping' }],
      });
      this.isAvailable = true;
      return true;
    } catch (error) {
      console.error(`ClaudeProvider Health Check Failed: ${error}`);
      this.isAvailable = false;
      return false;
    }
  }

  estimateCost(messages: AIMessage[]): number {
    // Estimativa de custo para Claude 3.5 Sonnet (preços podem variar)
    // Exemplo: Claude 3.5 Sonnet: $3.00 / 1M input tokens, $15.00 / 1M output tokens
    const inputTokensPerMillion = 3.00;
    const outputTokensPerMillion = 15.00;

    const totalInputChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    const estimatedInputTokens = Math.ceil(totalInputChars / 4);

    const estimatedOutputTokens = 500; 

    const inputCost = (estimatedInputTokens / 1_000_000) * inputTokensPerMillion;
    const outputCost = (estimatedOutputTokens / 1_000_000) * outputTokensPerMillion;

    return inputCost + outputCost;
  }
}
