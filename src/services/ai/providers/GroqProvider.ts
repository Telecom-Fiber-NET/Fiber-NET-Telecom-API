import Groq from 'groq-sdk';
import { IAIProvider, AIMessage, AIResponse, AIProviderConfig } from './IAIProvider';

export class GroqProvider implements IAIProvider {
  name = 'Groq';
  isAvailable = true;
  private client: Groq;
  public config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 2000,
      ...config, // Groq SDK não tem timeout direto no construtor, mas pode ser configurado na chamada
    };

    this.client = new Groq({
      apiKey: this.config.apiKey,
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
        // timeout: customConfig?.timeout || this.config.timeout, // Groq SDK não tem esta opção aqui
      });

      return {
        content: response.choices[0].message.content || '',
        provider: this.name,
        model: response.model,
        tokensUsed: response.usage?.total_tokens,
        finishReason: response.choices[0].finish_reason,
      };
    } catch (error: any) {
      console.error(`GroqProvider Error: ${error.message}`);
      this.isAvailable = false;
      throw new Error(`Groq Error: ${error.message}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Tenta fazer uma requisição mínima para verificar a conectividade
      await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5, // Requisição pequena
      });
      this.isAvailable = true;
      return true;
    } catch (error) {
      console.error(`GroqProvider Health Check Failed: ${error}`);
      this.isAvailable = false;
      return false;
    }
  }

  estimateCost(messages: AIMessage[]): number {
    // Groq é conhecido por ser muito econômico, e para muitos modelos Llama, é gratuito ou tem um custo muito baixo.
    // Para Llama 3.1 70B, o custo é geralmente muito baixo ou gratuito em planos de uso razoáveis.
    // Consulte a documentação do Groq para os preços mais recentes.
    return 0; // Assumindo custo zero para uso padrão
  }
}
