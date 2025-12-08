// src/api/routes.ts - Versão Completa
import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";

// Controllers
import authRoutes from "./routes/authRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import { supportRoutes } from "./routes/supportRoutes"; // Importe as novas rotas de suporte
import {
  listarOrdensServico,
  buscarOrdemServico,
} from "./controllers/ordensServicoController";
import {
  criarTicket,
  listarTiposAtendimento,
  listarTickets,
} from "./controllers/ticketsController";
import {
  trocarSenha,
  solicitarRecuperacaoSenha,
  validarForcaSenha,
} from "./controllers/senhaController";
import {
  buscarBoletosPorCpf,
  gerarSegundaVia,
} from "./controllers/boletoController";
import { executarAcaoLogin } from "./controllers/loginsController";

const router = Router();

// ==================== AUTENTICAÇÃO ====================
router.use("/auth", authRoutes);

// ==================== DASHBOARD ====================
router.use("/dashboard", dashboardRoutes);

// ==================== SUPORTE ====================
router.use("/support", supportRoutes);

// ==================== ORDENS DE SERVIÇO ====================
/**
 * GET /api/ordens-servico
 * Lista todas as ordens de serviço do cliente autenticado
 * Headers: Authorization: Bearer <token>
 */
router.get("/ordens-servico", verifyToken, listarOrdensServico);

/**
 * GET /api/ordens-servico/:id
 * Busca uma ordem de serviço específica
 * Headers: Authorization: Bearer <token>
 */
router.get("/ordens-servico/:id", verifyToken, buscarOrdemServico);

// ==================== TICKETS/ATENDIMENTOS ====================
/**
 * POST /api/tickets
 * Cria um novo ticket de atendimento
 * Headers: Authorization: Bearer <token>
 * Body: { assunto, mensagem, prioridade?, tipo?, contratoId?, loginId? }
 */
router.post("/tickets", verifyToken, criarTicket);

/**
 * GET /api/tickets
 * Lista todos os tickets do cliente autenticado
 * Headers: Authorization: Bearer <token>
 */
router.get("/tickets", verifyToken, listarTickets);

/**
 * GET /api/tickets/tipos
 * Lista os tipos de atendimento disponíveis
 */
router.get("/tickets/tipos", listarTiposAtendimento);

// ==================== SENHA ====================
/**
 * POST /api/senha/trocar
 * Troca a senha do hotsite do cliente
 * Headers: Authorization: Bearer <token>
 * Body: { senhaAtual, novaSenha, confirmarSenha }
 */
router.post("/senha/trocar", verifyToken, trocarSenha);

/**
 * POST /api/senha/recuperar
 * Solicita recuperação de senha por email
 * Body: { email }
 */
router.post("/senha/recuperar", solicitarRecuperacaoSenha);

/**
 * POST /api/senha/validar
 * Valida a força de uma senha (auxiliar para frontend)
 * Body: { senha }
 */
router.post("/senha/validar", validarForcaSenha);


// ==================== LOGINS (NOVO) ====================

// Rota dinâmica para ações: /api/logins/:id/:action
// Ex: /api/logins/4177/diagnostico
router.post("/logins/:id/:action", verifyToken, executarAcaoLogin);

// ==================== BOLETOS ====================
/**
 * POST /api/boletos/buscar-cpf
 * Busca boletos por CPF/CNPJ (endpoint público)
 * Body: { cpfCnpj }
 */
router.post("/boletos/buscar-cpf", buscarBoletosPorCpf);

/**
 * GET /api/boletos/:fatura_id/segunda-via
 * Gera segunda via de um boleto
 * Headers: Authorization: Bearer <token> (opcional)
 */
router.get("/boletos/:fatura_id/segunda-via", gerarSegundaVia);

// ==================== ROTAS DE SISTEMA ====================
/**
 * GET /api
 * Health check da API
 */
router.get("/", (_, res) =>
  res.json({
    status: "ok",
    message: "IXC API Gateway is running",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: "/api/auth",
      dashboard: "/api/dashboard",
      ordensServico: "/api/ordens-servico",
      tickets: "/api/tickets",
      senha: "/api/senha",
      boletos: "/api/boletos",
    },
  })
);

/**
 * GET /api/health
 * Health check detalhado
 */
router.get("/health", (_, res) =>
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV || "development",
  })
);

export default router;
