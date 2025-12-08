import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ixcLogger } from '../utils/logger';
import { ixcService } from '../services/ixcServiceClass'; // For fetching customer details
import { Action } from '@shared/types/api'; // Import Action from shared types

interface LLMProvider {
  name: string;
  priority: number;
  isHealthy: boolean;
  call: (prompt: string, context: any, chatHistory: any[]) => Promise<string>;
}

export class MultiLLMOrchestrator {
  private providers: LLMProvider[];
  private openai: OpenAI;
  private anthropic: Anthropic;
  private google: GoogleGenerativeAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.google = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

    this.providers = [
      {
        name: 'gpt-4o',
        priority: 1,
        isHealthy: true,
        call: this.callOpenAI.bind(this),
      },
      {
        name: 'claude-3.5-sonnet',
        priority: 2,
        isHealthy: true,
        call: this.callClaude.bind(this),
      },
      {
        name: 'gemini-1.5-pro',
        priority: 3,
        isHealthy: true,
        call: this.callGemini.bind(this),
      },
    ];

    // Health check a cada minuto
    setInterval(() => this.healthCheck(), 60000);
    ixcLogger.info('MultiLLMOrchestrator initialized with providers', { providerNames: this.providers.map(p => p.name) });
  }

  async getWelcomeMessage(customerId: string): Promise<string> {
    ixcLogger.info('Generating welcome message', { customerId });
    try {
        const customerIdNum = parseInt(customerId);
        const customer = await ixcService.buscarClientePorId(customerIdNum);
        const customerName = customer?.razao || customer?.fantasia || 'Cliente';
        return `Olá, ${customerName}! Sou o seu assistente virtual da Fiber.Net. Em que posso ajudar hoje?`;
    } catch (error) {
        ixcLogger.error('Failed to fetch customer for welcome message', { customerId, error });
        return "Olá! Sou o seu assistente virtual da Fiber.Net. Em que posso ajudar hoje?";
    }
  }

  async getResponse({ customerId, message, context, chatHistory }: { customerId: string, message: string, context: any, chatHistory: any[] }) {
    const complexity = this.analyzeComplexity(message);
    ixcLogger.info('Message complexity analyzed', { customerId, message, complexity });

    // Roteamento inteligente baseado em complexidade
    let selectedProviders = this.providers;
    if (complexity === 'simple') {
      // Usar Gemini para queries simples (mais barato)
      selectedProviders = this.providers.filter(p => p.name === 'gemini-1.5-pro');
    }

    for (const provider of selectedProviders.sort((a, b) => a.priority - b.priority)) {
      if (!provider.isHealthy) {
        ixcLogger.warn(`Skipping unhealthy provider: ${provider.name}`, { customerId });
        continue;
      }

      try {
        const prompt = this.buildPrompt(message, context);
        ixcLogger.info(`Calling provider ${provider.name} for customer ${customerId}`, { prompt: prompt.substring(0, 100) + '...' });
        const responseContent = await provider.call(prompt, context, chatHistory);

        return {
          content: responseContent,
          modelUsed: provider.name,
          confidence: 0.95, // Placeholder, can be dynamic
          suggestedActions: this.extractActions(responseContent, context),
        };
      } catch (error) {
        ixcLogger.error(`Provider ${provider.name} failed for customer ${customerId}:`, { error: (error as Error).message });
        provider.isHealthy = false; // Mark as unhealthy
        continue;
      }
    }

    throw new Error('Todos os providers falharam para gerar uma resposta.');
  }

  private async callOpenAI(prompt: string, context: any, chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[]): Promise<string> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.parts[0].text,
    }));

    messages.push({ role: 'user', content: prompt });

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: this.getSystemPrompt(context) },
        ...messages,
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || '';
  }

  private async callClaude(prompt: string, context: any, chatHistory: any[]): Promise<string> {
    const messages = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.parts[0].text,
    })).concat([
      { role: 'user', content: prompt },
    ]);

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: this.getSystemPrompt(context),
      messages: messages as any, // Anthropic's role types might be more strict
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  private async callGemini(prompt: string, context: any, chatHistory: any[]): Promise<string> {
    const model = this.google.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const fullHistory = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model', // Gemini expects 'user'/'model'
      parts: msg.parts,
    }));

    const chat = model.startChat({
        history: fullHistory,
    });

    const result = await chat.sendMessage(prompt);
    return result.response.text();
  }

  private buildPrompt(message: string, context: any): string {
    // This prompt can be more sophisticated
    return message;
  }

  private getSystemPrompt(context: any): string {
    return `Você é o assistente virtual de um provedor de internet (ISP).

INFORMAÇÕES DO CLIENTE:
- Nome: ${context.customerName || 'Não disponível'}
- Email: ${context.customerEmail || 'Não disponível'}
- Faturas em aberto: ${context.openInvoices}
- Conexões ativas: ${context.activeConnections}

DIRETRIZES:
- Seja proativo, empático e eficiente.
- Ofereça soluções práticas.
- Se houver problema de rede, explique e dê previsão.
- Para questões financeiras, seja claro sobre valores e datas.
- Sempre que possível, resolva sem transferir para humano.
- Responda de forma concisa e útil.

AÇÕES DISPONÍVEIS (se relevante, sugira ao usuário):
- Abrir ticket técnico (open_ticket)
- Consultar detalhes de fatura (get_bill_details)
- Agendar visita técnica (schedule_tech)
- Alterar plano (change_plan)
- Segunda via de boleto (get_bill_pdf)`;
  }

  private analyzeComplexity(message: string): 'simple' | 'medium' | 'complex' {
    const simpleKeywords = ['oi', 'olá', 'obrigado', 'tchau', 'horário', 'bom dia', 'boa tarde', 'boa noite'];
    const complexKeywords = ['problema', 'não funciona', 'reclamação', 'cancelar', 'lento', 'caindo'];

    const lower = message.toLowerCase();

    if (simpleKeywords.some(k => lower.includes(k))) return 'simple';
    if (complexKeywords.some(k => lower.includes(k))) return 'complex';

    return 'medium';
  }

  private extractActions(response: string, context: any): Action[] {
    const actions: Action[] = [];
    const lowerResponse = response.toLowerCase();

    // Priorize ações baseadas na resposta do LLM e no contexto do cliente
    if ((lowerResponse.includes('fatura') || lowerResponse.includes('boleto')) && context.openInvoices > 0) {
      actions.push({ type: 'get_bill_details', label: '📄 Ver Faturas' });
    }

    if (lowerResponse.includes('ticket') || lowerResponse.includes('suporte') || lowerResponse.includes('técnico')) {
      actions.push({ type: 'open_ticket', label: '🎫 Abrir Ticket' });
    }
    
    // Exemplo: Agendar visita técnica se houver um problema claro de conexão
    // if (lowerResponse.includes('visita') && context.activeConnections === 0) {
    //   actions.push({ type: 'schedule_tech', label: '🗓️ Agendar Visita Técnica' });
    // }

    return actions;
  }

  private async healthCheck() {
    ixcLogger.debug('Running LLM provider health check...');
    for (const provider of this.providers) {
      try {
        // Simple 'ping' equivalent by asking a basic question
        await provider.call('Hello', {}, []);
        if (!provider.isHealthy) {
          provider.isHealthy = true;
          ixcLogger.info(`Provider ${provider.name} is now healthy.`);
        }
      } catch (error) {
        if (provider.isHealthy) {
          provider.isHealthy = false;
          ixcLogger.error(`Provider ${provider.name} is unhealthy:`, { error: (error as Error).message });
        }
      }
    }
  }
}