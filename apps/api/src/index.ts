import 'dotenv/config'; // Carrega as variáveis de ambiente do .env
import app from "./app";
import http from 'http';
import { setupWebSocketServer } from './websocket';
import { activeAIProvider } from './services/ai'; // Importa a instância do orquestrador

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
setupWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 HTTP Endpoint: http://localhost:${PORT}/api`);
  console.log(`💬 WebSocket Endpoint: ws://localhost:${PORT}/`);
  console.log('AI Orchestrator inicializado.');
});

// Lida com o desligamento gracioso do servidor
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido. Encerrando servidor...');
  server.close(() => {
    console.log('Servidor HTTP encerrado.');
    activeAIProvider.destroy(); // Limpa o intervalo de health checks do orquestrador
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido. Encerrando servidor...');
  server.close(() => {
    console.log('Servidor HTTP encerrado.');
    activeAIProvider.destroy(); // Limpa o intervalo de health checks do orquestrador
    process.exit(0);
  });
});