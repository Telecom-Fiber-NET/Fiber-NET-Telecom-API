// src/api/controllers/ticketsController.ts
import { Request, Response } from "express";
import { z } from "zod";
import { ixcService } from "../../services/ixcService";

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

/**
 * Schema para criação de ticket
 * Alinhado com a API do IXC Soft
 */
const criarTicketSchema = z.object({
  // Campos obrigatórios
  assunto: z
    .string()
    .min(5, "Assunto deve ter no mínimo 5 caracteres")
    .max(200, "Assunto deve ter no máximo 200 caracteres"),

  mensagem: z
    .string()
    .min(10, "Mensagem deve ter no mínimo 10 caracteres")
    .max(5000, "Mensagem deve ter no máximo 5000 caracteres"),

  // Prioridade: A=Alta, B=Baixa, N=Normal, M=Média, U=Urgente
  prioridade: z.enum(["A", "B", "N", "M", "U"]).default("N"),

  // Tipo: T=Técnico, I=Informação, O=Outros
  tipo: z.enum(["T", "I", "O"]).default("T"),

  // Campos opcionais
  contratoId: z.number().optional(),
  loginId: z.number().optional(),
});

type CriarTicketInput = z.infer<typeof criarTicketSchema>;

// ============================================================================
// MAPEAMENTO DE VALORES
// ============================================================================

const PRIORIDADE_MAP: Record<string, string> = {
  A: "Alta",
  B: "Baixa",
  N: "Normal",
  M: "Média",
  U: "Urgente",
};

const TIPO_MAP: Record<string, string> = {
  T: "Técnico",
  I: "Informação",
  O: "Outros",
};

// ============================================================================
// CONTROLLERS
// ============================================================================

/**
 * Cria um novo ticket de atendimento
 */
export async function criarTicket(req: any, res: Response) {
  try {
    // 1. Validar entrada
    const validacao = criarTicketSchema.safeParse(req.body);

    if (!validacao.success) {
      return res.status(400).json({
        error: "Dados inválidos",
        detalhes: validacao.error.issues.map((issue) => ({
          campo: issue.path.join("."),
          mensagem: issue.message,
        })),
      });
    }

    const dados = validacao.data;

    // 2. Obter ID do cliente autenticado
    const clienteId = req.user?.ids?.[0];

    if (!clienteId) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    // 3. Montar payload para o IXC
    const ticketPayload = {
      id_cliente: String(clienteId),
      id_contrato: dados.contratoId ? String(dados.contratoId) : undefined,
      id_login: dados.loginId ? String(dados.loginId) : undefined,

      // Campos principais
      titulo: dados.assunto,
      menssagem: dados.mensagem, // Sim, IXC usa "menssagem" (com dois "s")

      // Classificação
      prioridade: dados.prioridade,
      id_ticket_origem: dados.tipo,

      // Campos padrão do IXC
      id_tipo: "1", // Tipo padrão
      id_setor: "1", // Setor padrão
      status: "A", // A=Aberto
      interacao_pendente: "S", // S=Sim
    };

    // 4. Criar ticket no IXC
    const resultado = await ixcService.criarTicket(ticketPayload);

    // 5. Retornar sucesso
    return res.status(201).json({
      success: true,
      message: "Ticket criado com sucesso",
      ticket: {
        id: resultado.id,
        protocolo: resultado.protocolo,
        assunto: dados.assunto,
        prioridade: PRIORIDADE_MAP[dados.prioridade],
        tipo: TIPO_MAP[dados.tipo],
        status: "Aberto",
        dataAbertura: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error("Erro ao criar ticket:", error);

    if (error instanceof Error) {
      // Erro da API IXC
      if (error.message?.includes("IXC")) {
        return res.status(502).json({
          error: "Erro ao comunicar com o sistema de tickets",
          detalhes: "Tente novamente em alguns instantes",
        });
      }
    }

    return res.status(500).json({
      error: "Erro ao criar ticket",
    });
  }
}

/**
 * Lista tickets do cliente autenticado
 */
export async function listarTickets(req: any, res: Response) {
  try {
    const clienteId = req.user?.ids?.[0];

    if (!clienteId) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    // Buscar tickets do IXC
    // CORREÇÃO: Usar ticketsListar em vez de ordensServicoListar
    const tickets = await ixcService.ticketsListar(clienteId);

    // Formatar resposta
    const ticketsFormatados = tickets.map((ticket: any) => ({
      id: ticket.id,
      protocolo: ticket.protocolo,
      assunto: ticket.assunto || ticket.titulo,
      descricao: ticket.menssagem || ticket.descricao, // IXC usa menssagem no ticket
      status: formatarStatus(ticket.status),
      statusCor: getStatusCor(ticket.status),
      prioridadeCor: getPrioridadeCor(ticket.prioridade),
      dataAbertura: ticket.data_abertura,
      podeFechar: ['N', 'A', 'P', 'E', 'S'].includes(ticket.status), // Permite fechar se não estiver finalizado
      // dataConclusao: ticket.data_conclusao, // Pode não vir no ticket simples
    }));

    return res.json({
      success: true,
      total: ticketsFormatados.length,
      tickets: ticketsFormatados,
    });
  } catch (error) {
    console.error("Erro ao listar tickets:", error);

    return res.status(500).json({
      error: "Erro ao listar tickets",
    });
  }
}

/**
 * Busca detalhes de um ticket específico
 */
export async function buscarTicket(req: any, res: Response) {
  try {
    const { ticketId } = req.params;
    const clienteId = req.user?.ids?.[0];

    if (!clienteId) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    // Buscar ticket específico ou listar e filtrar
    // O ideal é buscar direto se tiver método, mas listar e find funciona para MVP
    const tickets = await ixcService.ticketsListar(clienteId);
    const ticket = tickets.find((t: any) => t.id === ticketId || t.id === parseInt(ticketId));

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket não encontrado",
      });
    }

    // Buscar interações
    const interacoes = await ixcService.listarInteracoesTicket(ticket.id);

    const interacoesFormatadas = interacoes.map((i: any) => ({
      id: i.id,
      data: i.data,
      mensagem: i.mensagem || i.texto || i.menssagem,
      operador: i.operador || "Sistema", // Se vier nome do operador
      origem: i.origem_endereco === "C" ? "Cliente" : "Atendente" // Ajustar conforme padrão IXC
    }));

    // Formatar resposta detalhada
    const ticketDetalhado = {
      id: ticket.id,
      protocolo: ticket.protocolo,
      assunto: ticket.assunto || ticket.titulo,
      descricao: ticket.menssagem,
      status: formatarStatus(ticket.status),
      statusCor: getStatusCor(ticket.status),
      prioridade: formatarPrioridade(ticket.prioridade),
      tipo: formatarTipo(ticket.id_ticket_origem),
      dataAbertura: ticket.data_abertura,
      dataFechamento: ticket.data_fechamento, // data_fechamento no ticket
      podeFechar: ['N', 'A', 'P', 'E', 'S'].includes(ticket.status),
      interacoes: interacoesFormatadas,
    };

    return res.json({
      success: true,
      ticket: ticketDetalhado,
    });
  } catch (error) {
    console.error("Erro ao buscar ticket:", error);

    return res.status(500).json({
      error: "Erro ao buscar ticket",
    });
  }
}

/**
 * Fecha um ticket
 */
export async function fecharTicket(req: any, res: Response) {
  try {
    const { id } = req.params;
    const clienteId = req.user?.ids?.[0];
    const { mensagem } = req.body;

    if (!clienteId) return res.status(401).json({ error: "Usuário não autenticado" });

    // Validar propriedade (opcional, seria bom buscar antes)
    const tickets = await ixcService.ticketsListar(clienteId);
    const ticket = tickets.find((t: any) => t.id === id || t.id === parseInt(id));

    if (!ticket) return res.status(404).json({ error: "Ticket não encontrado" });

    if (ticket.status === 'F' || ticket.status === 'C') {
      return res.status(400).json({ error: "Ticket já está fechado ou cancelado" });
    }

    await ixcService.fecharTicket(Number(id), mensagem);

    return res.json({
      success: true,
      message: "Ticket fechado com sucesso"
    });

  } catch (error) {
    console.error("Erro ao fechar ticket:", error);
    return res.status(500).json({ error: "Erro ao fechar ticket" });
  }
}


export async function listarTiposAtendimento(req: Request, res: Response) {
  return res.json({
    success: true,
    tipos: [
      {
        id: "T",
        nome: "Telefone",
        descricao: "Problemas com telefonia",
        icone: "phone",
      },
      {
        id: "I",
        nome: "Internet",
        descricao: "Problemas com conexão de internet",
        icone: "wifi",
      },
      {
        id: "O",
        nome: "Outros",
        descricao: "Outros assuntos",
        icone: "help-circle",
      },
    ],
    prioridades: [
      { id: "B", nome: "Baixa", cor: "success" },
      { id: "N", nome: "Normal", cor: "info" },
      { id: "M", nome: "Média", cor: "warning" },
      { id: "A", nome: "Alta", cor: "danger" },
      { id: "U", nome: "Urgente", cor: "danger" },
    ],
  });
}

export default listarTiposAtendimento;

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Formata status do ticket para exibição
 */
// Mapeamento de Status
function formatarStatus(status: string): string {
  const statusMap: Record<string, string> = {
    N: "Novo",
    A: "Aberto",
    E: "Em Atendimento",
    P: "Pendente",
    F: "Fechado",
    C: "Cancelado",
    S: "Solucionado",
  };

  return statusMap[status] || status;
}

function getStatusCor(status: string): string {
  const corMap: Record<string, string> = {
    N: "info",      // Novo - Azul claro
    A: "primary",   // Aberto - Azul
    E: "warning",   // Em atendimento - Amarelo
    P: "warning",   // Pendente - Amarelo
    F: "secondary", // Fechado - Cinza
    C: "danger",    // Cancelado - Vermelho
    S: "success",   // Solucionado - Verde
  };

  return corMap[status] || "secondary";
}

/**
 * Formata prioridade para exibição
 */
function formatarPrioridade(prioridade: string): string {
  return PRIORIDADE_MAP[prioridade] || prioridade;
}

/**
 * Retorna cor da prioridade para UI
 */
function getPrioridadeCor(prioridade: string): string {
  const corMap: Record<string, string> = {
    U: "danger", // Urgente - Vermelho
    A: "danger", // Alta - Vermelho
    M: "warning", // Média - Amarelo
    N: "primary", // Normal - Azul
    B: "success", // Baixa - Verde
  };

  return corMap[prioridade] || "secondary";
}

/**
 * Formata tipo do ticket
 */
function formatarTipo(tipo: string): string {
  return TIPO_MAP[tipo] || tipo;
}

/**
 * Formata data e hora para pt-BR
 */
function formatarDataHora(dataHora: string): string {
  if (!dataHora) return "";

  const data = new Date(dataHora);
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Valida se o ticket pertence ao cliente
 */
function validarPropriedadeTicket(ticket: any, clienteId: number): boolean {
  return ticket.id_cliente === clienteId;
}

// ============================================================================
// EXPORTS ADICIONAIS
// ============================================================================

export const ticketUtils = {
  formatarStatus,
  formatarPrioridade,
  formatarTipo,
  formatarDataHora,
  getStatusCor,
  getPrioridadeCor,
  validarPropriedadeTicket,
};
