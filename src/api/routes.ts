// spell:disable
import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";

// Controllers
import {
  buscarBoletosPorCpf,
  buscarPixBoleto,
  gerarSegundaVia,
} from "./controllers/boletoController";
import { handleChat } from "./controllers/chatController"; // <--- ADICIONADO
import { executarAcaoLogin } from "./controllers/loginsController";
import {
  buscarOrdemServico,
  listarOrdensServico,
} from "./controllers/ordensServicoController";
import {
  solicitarRecuperacaoSenha,
  trocarSenha,
  validarForcaSenha,
} from "./controllers/senhaController";
import {
  criarTicket,
  listarTickets,
  listarTiposAtendimento,
} from "./controllers/ticketsController";
import authRoutes from "./routes/authRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import { supportRoutes } from "./routes/supportRoutes";

const router = Router();

// ==================== AUTENTICAÇÃO ====================
router.use("/auth", authRoutes);

// ==================== DASHBOARD ====================
router.use("/dashboard", dashboardRoutes);

// ==================== SUPORTE ====================
router.use("/support", supportRoutes);

// ==================== CHAT IA (NOVO) ====================
router.post("/chat", verifyToken, handleChat); // <--- ADICIONADO

// ==================== ORDENS DE SERVIÇO ====================
router.get("/ordens-servico", verifyToken, listarOrdensServico);
router.get("/ordens-servico/:id", verifyToken, buscarOrdemServico);

// ==================== TICKETS ====================
router.post("/tickets", verifyToken, criarTicket);
router.get("/tickets", verifyToken, listarTickets);
router.get("/tickets/tipos", listarTiposAtendimento);

// ==================== SENHA ====================
router.post("/senha/trocar", verifyToken, trocarSenha);
router.post("/senha/recuperar", solicitarRecuperacaoSenha);
router.post("/senha/validar", validarForcaSenha);

// ==================== LOGINS ====================
router.post("/logins/:id/:action", verifyToken, executarAcaoLogin);

// ==================== BOLETOS ====================
router.post("/boletos/buscar-cpf", buscarBoletosPorCpf);
router.get("/boletos/:fatura_id/segunda-via", gerarSegundaVia);
router.post("/boletos/:id/pix", buscarPixBoleto);

// ==================== SISTEMA ====================
router.get("/", (_, res) =>
  res.json({
    status: "ok",
    message: "IXC API Gateway is running",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  })
);

router.get("/health", (_, res) =>
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
);

export default router;
