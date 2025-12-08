import { IAIProvider, AIMessage, AIResponse, AIProviderConfig } from "./providers/IAIProvider";
import { OpenAIProvider } from "./providers/OpenAIProvider";
import { ClaudeProvider } from "./providers/ClaudeProvider";
import { GeminiProvider } from "./providers/GeminiProvider";
import { GroqProvider } from "./providers/GroqProvider";
import { ixcLogger } from "../../utils/logger"; // Importar ixcLogger

interface ProviderEntry {
  provider: IAIProvider;
  priority: number; // Menor número = maior prioridade
  enabled: boolean;
  useFor?: ('simple' | 'medium' | 'complex')[]; // Para roteamento inteligente
}

export class AIOrchestrator {
  private providers: Map<string, ProviderEntry> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeProviders();
    this.startHealthChecks();
  }

  private initializeProviders() {
    // Carregar configurações do .env
    const config = {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4o',
      },
      claude: {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        model: 'claude-3-5-sonnet-20241022',
      },
      gemini: {
        apiKey: process.env.GOOGLE_API_KEY || '',
        model: 'gemini-2.5-flash',
      },
      groq: {
        apiKey: process.env.GROQ_API_KEY || '',
        model: 'llama-3.1-70b-versatile', // Ou outro modelo Groq como 'mixtral-8x7b-32768'
      },
    };

    // Registrar providers com suas prioridades e casos de uso
    // A ordem aqui define a prioridade inicial se não houver roteamento inteligente
    if (config.groq.apiKey) {
      this.registerProvider('groq', new GroqProvider(config.groq), 1, ['simple']); // Mais rápido e barato para simples
    }

    if (config.gemini.apiKey) {
      this.registerProvider('gemini', new GeminiProvider(config.gemini), 2, ['simple', 'medium']); // Bom custo-benefício
    }

    if (config.openai.apiKey) {
      this.registerProvider('openai', new OpenAIProvider(config.openai), 3, ['medium', 'complex']); // Qualidade alta
    }

    if (config.claude.apiKey) {
      this.registerProvider('claude', new ClaudeProvider(config.claude), 4, ['complex']); // Qualidade premium para complexos
    }
  }

  private registerProvider(
    name: string, 
    provider: IAIProvider, 
    priority: number,
    useFor: ('simple' | 'medium' | 'complex')[] = ['simple', 'medium', 'complex']
  ) {
    if (provider.config.apiKey) { // Só registra se a API Key estiver presente
      this.providers.set(name, {
        provider,
        priority,
        enabled: true,
        useFor,
      });
      ixcLogger.info(`Provider ${name} registrado com prioridade ${priority}.`);
    } else {
      ixcLogger.warn(`API Key para ${name} não encontrada. Provider não será registrado.`);
    }
  }

  private startHealthChecks() {
    // Health check a cada 2 minutos
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 120000); // 2 minutos
  }

  /**
   * MÉTODO PRINCIPAL - Envia mensagem e retorna resposta, com fallback automático.
   */
  async chat(messages: AIMessage[], options?: {
    preferredProvider?: string;
    complexity?: 'simple' | 'medium' | 'complex';
  }): Promise<AIResponse> {
    const complexity = options?.complexity || this.analyzeComplexity(messages);

    // 1. Tentar provedor preferencial, se especificado e disponível
    if (options?.preferredProvider) {
      const entry = this.providers.get(options.preferredProvider);
      if (entry?.enabled && entry.provider.isAvailable) {
        try {
          ixcLogger.info(`Tentando provedor preferencial: ${options.preferredProvider}`);
          return await entry.provider.chat(messages);
        } catch (error) {
          ixcLogger.warn(`Provedor preferencial ${options.preferredProvider} falhou, tentando fallback...`);
          entry.provider.isAvailable = false; // Marca como indisponível
        }
      }
    }

    // 2. Filtrar provedores adequados para a complexidade e disponíveis
    const availableProviders = Array.from(this.providers.entries())
      .filter(([_, entry]) => 
        entry.enabled && 
        entry.provider.isAvailable &&
        (entry.useFor?.includes(complexity) || !entry.useFor) // Se não tem 'useFor', serve para tudo
      )
      .sort((a, b) => a[1].priority - b[1].priority); // Ordena por prioridade

    // 3. Tentar cada provedor em ordem de prioridade
    for (const [name, entry] of availableProviders) {
      try {
        ixcLogger.info(`Tentando provedor: ${name} (complexidade: ${complexity})`);
        return await entry.provider.chat(messages);
      } catch (error: any) {
        ixcLogger.error(`Provedor ${name} falhou:`, error);
        entry.provider.isAvailable = false; // Marca como indisponível
        // Continua para o próximo provedor
      }
    }

    // Se todos falharem
    throw new Error('Todos os provedores de IA falharam ou estão indisponíveis.');
  }

  /**
   * Analisa a complexidade da mensagem para roteamento inteligente.
   */
  private analyzeComplexity(messages: AIMessage[]): 'simple' | 'medium' | 'complex' {
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop()?.content.toLowerCase() || '';

    // Palavras-chave simples
    const simpleKeywords = ['oi', 'olá', 'obrigado', 'tchau', 'status', 'horário', 'agradeço', 'bom dia', 'boa tarde'];
    if (simpleKeywords.some(k => lastUserMessage.includes(k))) {
      return 'simple';
    }

    // Palavras-chave complexas
    const complexKeywords = [
      'problema', 'não funciona', 'erro', 'reclamação', 'cancelar', 
      'contrato', 'jurídico', 'reembolso', 'velocidade', 'instabilidade', 'suporte técnico'
    ];
    if (complexKeywords.some(k => lastUserMessage.includes(k))) {
      return 'complex';
    }

    // Mensagens longas ou com muitas perguntas podem ser complexas
    if (lastUserMessage.length > 150 || (lastUserMessage.match(/\?/g) || []).length > 1) {
      return 'complex';
    }

    return 'medium';
  }

  /**
   * Realiza health checks em todos os provedores registrados.
   */
  private async performHealthChecks() {
    ixcLogger.debug('Executando health checks nos provedores de IA...');

    for (const [name, entry] of this.providers.entries()) {
      if (!entry.enabled) {
        ixcLogger.debug(`Provedor ${name} está desabilitado.`);
        continue;
      }

      const wasAvailable = entry.provider.isAvailable;
      const isHealthy = await entry.provider.healthCheck();

      if (isHealthy && !wasAvailable) {
        ixcLogger.info(`Provedor ${name} voltou a ficar DISPONÍVEL.`);
      } else if (!isHealthy && wasAvailable) {
        ixcLogger.warn(`Provedor ${name} ficou INDISPONÍVEL.`);
      } else {
        ixcLogger.debug(`Provedor ${name}: ${isHealthy ? 'OK' : 'FALHA'}`);
      }
      entry.provider.isAvailable = isHealthy;
    }
  }

  /**
   * Habilita ou desabilita um provedor manualmente.
   */
  setProviderEnabled(name: string, enabled: boolean) {
    const entry = this.providers.get(name);
    if (entry) {
      entry.enabled = enabled;
      ixcLogger.info(`Provedor ${name} ${enabled ? 'habilitado' : 'desabilitado'}.`);
    } else {
      ixcLogger.warn(`Provedor ${name} não encontrado.`);
    }
  }

  /**
   * Obtém o status atual de todos os provedores.
   */
  getProvidersStatus() {
    return Array.from(this.providers.entries()).map(([name, entry]) => ({
      name,
      enabled: entry.enabled,
      available: entry.provider.isAvailable,
      priority: entry.priority,
      useFor: entry.useFor,
      estimatedCostPerQuery: entry.provider.estimateCost([{ role: 'user', content: 'teste' }]), // Custo de uma query de teste
    }));
  }

  /**
   * Limpa o intervalo de health checks ao destruir a instância.
   */
  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    ixcLogger.info('AIOrchestrator destruído. Health checks parados.');
  }
}
