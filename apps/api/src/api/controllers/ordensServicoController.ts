// src/api/controllers/ordensServicoController.ts
import { Request, Response } from "express";
import { ixcService } from "../../services/ixcService";
import { z } from "zod";

/**
 * Lista ordens de serviço do cliente autenticado
 */
export async function listarOrdensServico(req: any, res: Response) {
  try {
    const clienteId = req.user?.ids?.[0];

    if (!clienteId) {
      return res.status(400).json({
        error: "Cliente não identificado no token",
      });
    }

    const ordens = await ixcService.ordensServicoListar(clienteId);

    // Formata a resposta para o frontend
    const ordensFormatadas = ordens.map((ordem: any) => ({
      id: ordem.id,
      protocolo: ordem.protocolo,
      tipo: ordem.tipo,
      assunto: ordem.id_assunto || "Não especificado",
      mensagem: ordem.mensagem,
      status: formatarStatus(ordem.status),
      statusCor: getStatusColor(ordem.status),
      dataAbertura: formatarData(ordem.data_abertura),
      dataFechamento: ordem.data_fechamento
        ? formatarData(ordem.data_fechamento)
        : null,
      endereco: `${ordem.endereco || ""}, ${ordem.bairro || ""} - ${
        ordem.cidade || ""
      }`.trim(),
      resposta: ordem.mensagem_resposta || null,
      podeAvaliar: ordem.status === "F" || ordem.status === "C", // Fechado ou Cancelado
    }));

    return res.json({
      success: true,
      total: ordensFormatadas.length,
      ordens: ordensFormatadas,
    });
  } catch (error) {
    console.error("Erro ao listar ordens de serviço:", error);
    return res.status(500).json({
      error: "Erro ao buscar ordens de serviço",
    });
  }
}

/**
 * Busca uma ordem de serviço específica
 */
export async function buscarOrdemServico(req: any, res: Response) {
  try {
    const { id } = req.params;
    const clienteId = req.user?.ids?.[0];

    if (!clienteId) {
      return res.status(400).json({
        error: "Cliente não identificado",
      });
    }

    const ordens = await ixcService.ordensServicoListar(clienteId);
    const ordem = ordens.find((o: any) => o.id === id);

    if (!ordem) {
      return res.status(404).json({
        error: "Ordem de serviço não encontrada",
      });
    }

    return res.json({
      success: true,
      ordem: {
        id: ordem.id,
        protocolo: ordem.protocolo,
        tipo: ordem.tipo,
        assunto: ordem.id_assunto,
        mensagem: ordem.mensagem,
        status: formatarStatus(ordem.status),
        statusCor: getStatusColor(ordem.status),
        dataAbertura: formatarData(ordem.data_abertura),
        dataInicio: ordem.data_inicio ? formatarData(ordem.data_inicio) : null,
        dataFinal: ordem.data_final ? formatarData(ordem.data_final) : null,
        dataFechamento: ordem.data_fechamento
          ? formatarData(ordem.data_fechamento)
          : null,
        endereco: `${ordem.endereco}, ${ordem.bairro} - ${ordem.cidade}`,
        latitude: ordem.latitude,
        longitude: ordem.longitude,
        resposta: ordem.mensagem_resposta || "Aguardando atendimento",
      },
    });
  } catch (error) {
    console.error("Erro ao buscar ordem de serviço:", error);
    return res.status(500).json({
      error: "Erro ao buscar ordem de serviço",
    });
  }
}

// Funções auxiliares
function formatarStatus(status: string): string {
  const statusMap: Record<string, string> = {
    A: "Aberto",
    T: "Em Atendimento",
    F: "Fechado",
    C: "Cancelado",
    P: "Pendente",
    E: "Em Execução",
  };
  return statusMap[status] || status;
}

function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    A: "warning", // Amarelo
    T: "info", // Azul
    F: "success", // Verde
    C: "danger", // Vermelho
    P: "warning",
    E: "primary",
  };
  return colorMap[status] || "secondary";
}

function formatarData(data: string): string {
  if (!data) return "";
  const d = new Date(data);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
