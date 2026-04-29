// spell:disable
import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware";

// Controllers
import {
  buscarBoletosPorCpf,
  buscarPixBoleto,
  gerarSegundaVia,
  imprimirNotaFiscal,
  listarFinanceiroPorContrato,
} from "./controllers/boletoController";
import { handleChat } from "./controllers/chatController";
import {
  assinarContrato,
  executarAutoDesbloqueio,
  gerarPdfContrato,
  imprimirTermo,
  listarTermos,
  diagnosticoContrato,
} from "./controllers/contratosController";
import { getResumo } from "./controllers/financeiroController";
import {
  buscarConsumoDiario,
  buscarConsumoMensal,
  executarAcaoLogin,
} from "./controllers/loginsController";
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
  buscarTicket,
  criarTicket,
  fecharTicket,
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
router.post("/chat", verifyToken, handleChat);
router.post("/ai", verifyToken, handleChat); // Alias para o frontend

// ==================== BUSCA PUBLICA (NOVO) ====================
router.post("/buscar", buscarBoletosPorCpf);

// ==================== rota pix ====================
router.get("/pix/:id", buscarPixBoleto);

// ==================== ORDENS DE SERVIÇO ====================
router.get("/ordens-servico", verifyToken, listarOrdensServico);
router.get("/ordens-servico/:id", verifyToken, buscarOrdemServico);

// ==================== CONTRATOS E ASSINATURA ====================
router.get("/contratos/:id_contrato/termos", verifyToken, listarTermos);
router.get("/contratos/:id_contrato/financeiro", verifyToken, listarFinanceiroPorContrato);
router.get("/financeiro/resumo", verifyToken, getResumo);
router.post("/contratos/assinar/:id_termo", verifyToken, assinarContrato);
router.post("/termos/:id_termo/assinar", verifyToken, assinarContrato); // Alias frontend
router.post("/contratos/:id/pdf", verifyToken, gerarPdfContrato);
router.post("/contratos/:id/desbloqueio", verifyToken, executarAutoDesbloqueio);
router.get("/contratos/:id/diagnostico", verifyToken, diagnosticoContrato); // Nova rota frontend
router.get("/contratos/termos/:id/imprimir", verifyToken, imprimirTermo); // <--- NOVA ROTA DE IMPRESSAO DE TERMO

// ==================== TICKETS ====================
router.post("/tickets", verifyToken, criarTicket);
router.get("/tickets", verifyToken, listarTickets);
router.get("/tickets/tipos", listarTiposAtendimento);
router.get("/tickets/:ticketId", verifyToken, buscarTicket);
router.put("/tickets/:id/fechar", verifyToken, fecharTicket);
router.post("/tickets/:id/close", verifyToken, fecharTicket); // Alias frontend

// ==================== SENHA ====================
router.post("/senha/trocar", verifyToken, trocarSenha);
router.post("/auth/trocar-senha", verifyToken, trocarSenha); // Alias frontend
router.post("/senha/recuperar", solicitarRecuperacaoSenha);
router.post("/auth/recuperar-senha", solicitarRecuperacaoSenha); // Alias frontend
router.post("/senha/validar", validarForcaSenha);

// ==================== LOGINS ====================
router.post("/logins/:id/:action", verifyToken, executarAcaoLogin);
router.get("/logins/:id/consumo/diario", verifyToken, buscarConsumoDiario); // <--- NOVA ROTA CONSUMO DIARIO
router.get("/logins/:id/consumo/mensal", verifyToken, buscarConsumoMensal); // <--- NOVA ROTA CONSUMO MENSAL

// ==================== BOLETOS E NOTAS ====================

router.post("/boletos/buscar-cpf", buscarBoletosPorCpf);
router.get("/boletos/:fatura_id/segunda-via", gerarSegundaVia); // Mantém rota pública/velha se necessário, ou protege
router.get("/boletos/:id/pix", buscarPixBoleto);
router.get("/segunda-via/:fatura_id", verifyToken, gerarSegundaVia);
router.get("/financeiro/notas/:id/imprimir", verifyToken, imprimirNotaFiscal); // <--- NOVA ROTA DE NF
router.get("/notas/:id/imprimir", verifyToken, imprimirNotaFiscal); // Alias frontend

// ==================== BOLETOS PIX ====================

router.post("/faturas", buscarBoletosPorCpf);
router.get("/faturas/:id/pix", buscarPixBoleto);
router.get("/faturas/:fatura_id/segunda-via", gerarSegundaVia);

// ==================== SISTEMA ====================
router.get("/", (_, res) =>
  res.json({
    status: "ok",
    message: "IXC API Gateway is running",
    version: "2.1.0", // Bump version
    timestamp: new Date().toISOString(),
  }),
);

router.get("/health", (_, res) =>
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }),
);

export default router;
