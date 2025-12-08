import "dotenv/config";
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { activeAIProvider } from '../services/ai'; // Import AIOrchestrator instance
import { AIMessage, AIResponse } from '../services/ai/providers/IAIProvider'; // Import AIMessage and AIResponse interface
import { ProactiveMonitor } from '../proactive';
import { authenticateWebSocket, buildCustomerContext } from './utils';
import { ixcLogger } from '../utils/logger';

interface AuthenticatedWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: string;
  // No need for chatHistory here, it's managed by Orchestrator or client
}

export const setupWebSocketServer = (expressServer: any) => {
  const wss = new WebSocketServer({
    noServer: true,
  });

  const proactiveMonitor = new ProactiveMonitor();

  expressServer.on('upgrade', (request: IncomingMessage, socket: any, head: Buffer) => {
    ixcLogger.info('Upgrade request received', { url: request.url });

    try {
      // Authenticate WebSocket connection using helper
      const customerId = authenticateWebSocket(request);
      (request as any).userId = customerId; // Attach customerId to request for wss.on('connection')
    } catch (error: any) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      ixcLogger.warn('WebSocket connection denied:', error.message);
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', async (ws: AuthenticatedWebSocket, request: IncomingMessage) => {
    ws.isAlive = true;
    const customerId = (request as any).userId; // Get customerId from authenticated request
    ws.userId = customerId;
    ixcLogger.info(`Cliente ${customerId} conectado via WebSocket`);

    // Enviar mensagem de boas-vindas
    ws.send(JSON.stringify({
      type: 'message',
      message: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: await activeAIProvider.chat([
          { role: 'system', content: `Você é um assistente virtual para o cliente ${customerId} da Fiber.Net.` },
          { role: 'user', content: 'Olá, me dê uma mensagem de boas-vindas.' }
        ]).then((res: AIResponse) => res.content),
        timestamp: new Date(),
      }
    }));

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (message: string) => {
      ixcLogger.info('Received WebSocket message', { userId: ws.userId, message: message.toString() });
      try {
        const payload = JSON.parse(message.toString());

        if (payload.type === 'chat') {
          // Indicador de digitação
          sendTypingStatus(ws, true);

          try {
            // Adiciona a mensagem do usuário ao histórico para enviar ao orquestrador
            const userMessage: AIMessage = { role: 'user', content: payload.content };
            const fullConversation: AIMessage[] = [...(payload.chatHistory || []), userMessage];

            const response = await activeAIProvider.chat(fullConversation);

            ws.send(JSON.stringify({
              type: 'message',
              message: {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: response.content,
                timestamp: new Date(),
                metadata: {
                  model: response.model,
                  tokensUsed: response.tokensUsed,
                  finishReason: response.finishReason,
                  // actions: response.suggestedActions, // AIOrchestrator.chat doesn't return suggestedActions directly
                }
              }
            }));
          } catch (error) {
            ixcLogger.error('Error from Orchestrator during chat', { userId: customerId, error: (error as Error).message });
            ws.send(JSON.stringify({
              type: 'message',
              message: {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: 'Desculpe, tive um problema ao processar sua solicitação. Pode tentar novamente?',
                timestamp: new Date(),
              }
            }));
          } finally {
            sendTypingStatus(ws, false);
          }
        }
      } catch (error) {
        ixcLogger.error('Failed to parse WebSocket message or handle chat', { userId: ws.userId, error: (error as Error).message });
        ws.send(JSON.stringify({
          type: 'error',
          content: 'Ocorreu um erro ao processar sua mensagem.'
        }));
      }
    });

    ws.on('close', () => {
      ixcLogger.info('Client disconnected from WebSocket', { userId: ws.userId });
    });

    ws.on('error', (error) => {
      ixcLogger.error('WebSocket error on connection', { userId: ws.userId, error: error.message });
    });

    // Sistema proativo - enviar alertas
    proactiveMonitor.on(`alert:${customerId}`, (alert) => {
      ixcLogger.info('Sending proactive alert to client', { customerId, alertType: alert.type });
      ws.send(JSON.stringify({
        type: 'proactive_alert',
        alert,
      }));
    });
  });

  // Keep-alive pings
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
      const client = ws as AuthenticatedWebSocket;
      if (!client.isAlive) {
        ixcLogger.warn('WebSocket client not alive, terminating', { userId: client.userId });
        return client.terminate();
      }
      client.isAlive = false;
      client.ping();
    });
  }, 30000); // Ping every 30 seconds

  wss.on('close', () => {
    clearInterval(interval);
    proactiveMonitor.stop(); // Stop proactive monitoring when server closes
  });

  // Start proactive monitoring
  proactiveMonitor.start();

  ixcLogger.info('WebSocket server setup complete');
  return wss;
};

function sendTypingStatus(ws: WebSocket, isTyping: boolean) {
  ws.send(JSON.stringify({ type: 'typing', isTyping }));
}
