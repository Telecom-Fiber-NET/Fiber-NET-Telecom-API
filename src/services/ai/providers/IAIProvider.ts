export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  model?: string; // Adicionado para identificar o modelo específico usado
  tokensUsed?: number; // Adicionado para métricas de custo
  finishReason?: string; // Adicionado para depuração
}

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface IAIProvider {
  name: string;
  config: AIProviderConfig;
  isAvailable: boolean; // Para health checks

  /**
   * Envia uma lista de mensagens para o provedor de IA e retorna a resposta.
   * @param messages O histórico da conversa, incluindo a mensagem atual do usuário.
   * @param customConfig Configurações específicas para esta chamada (opcional).
   * @returns Uma promessa que resolve para a resposta da IA.
   */
  chat(messages: AIMessage[], customConfig?: Partial<AIProviderConfig>): Promise<AIResponse>;

  /**
   * Realiza um health check para verificar a disponibilidade do provedor.
   * @returns Uma promessa que resolve para true se o provedor estiver saudável, false caso contrário.
   */
  healthCheck(): Promise<boolean>;

  /**
   * Estima o custo de uma requisição com base nas mensagens.
   * @param messages As mensagens a serem enviadas.
   * @returns O custo estimado em dólares.
   */
  estimateCost(messages: AIMessage[]): number;
}
