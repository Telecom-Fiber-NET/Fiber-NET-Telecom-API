import axios from 'axios';
import { IAIProvider, AIMessage, AIResponse, AIProviderConfig } from './IAIProvider';

export class OmniRouteProvider implements IAIProvider {
  name = 'OmniRoute';
  isAvailable = true;
  public config: AIProviderConfig & { baseURL?: string };

  constructor(config: AIProviderConfig & { baseURL?: string }) {
    this.config = {
      temperature: 0.7,
      maxTokens: 2000,
      timeout: 30000,
      baseURL: 'http://localhost:3000/api/v1', // Default local OmniRoute
      ...config,
    };
  }

  async chat(messages: AIMessage[], customConfig?: Partial<AIProviderConfig>): Promise<AIResponse> {
    try {
      const response = await axios.post(
        `${this.config.baseURL}/chat/completions`,
        {
          model: customConfig?.model || this.config.model,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          temperature: customConfig?.temperature || this.config.temperature,
          max_tokens: customConfig?.maxTokens || this.config.maxTokens,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://centralfiber.online',
            'X-Title': 'Fiber NET Telecom',
          },
          timeout: this.config.timeout,
        }
      );

      const data = response.data;

      return {
        content: data.choices[0].message.content || '',
        provider: this.name,
        model: data.model,
        tokensUsed: data.usage?.total_tokens,
        finishReason: data.choices[0].finish_reason,
      };
    } catch (error: any) {
      console.error(`OmniRouteProvider Error: ${error.message}`);
      this.isAvailable = false;
      throw new Error(`OmniRoute Error: ${error.message}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // OmniRoute usually has a health or models endpoint
      await axios.get(`${this.config.baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
        timeout: 5000
      });
      this.isAvailable = true;
      return true;
    } catch (error) {
      console.error(`OmniRouteProvider Health Check Failed: ${error}`);
      this.isAvailable = false;
      return false;
    }
  }

  estimateCost(messages: AIMessage[]): number {
    // Cost estimation depends on the actual model being proxied by OmniRoute.
    // For simplicity, we use a generic estimation or return 0 if managed by OmniRoute dashboard.
    return 0;
  }
}
