import { Request, Response } from "express";
import * as XLSX from "xlsx";
import { gerarRelatorioSemanal, calcularPeriodoSemana, RelatorioGuardrailsError } from "../../services/relatoriosService";

/**
 * Gera o relatório semanal em XLSX (uma aba por item) e devolve o arquivo.
 * GET /api/relatorios/semanal?forcar=1  (forcar só para teste manual)
 */
export async function relatorioSemanal(req: Request, res: Response) {
  try {
    const forcar = req.query.forcar === "1" || req.query.forcar === "true";
    const rel = await gerarRelatorioSemanal(new Date(), forcar);
    const p = rel.periodo;

    const wb = XLSX.utils.book_new();

    const cancelRows = rel.cancelamentos.itens.map((i: any) => ({
      "ID Contrato": i.id_contrato,
      Cliente: i.cliente,
      "Data Cancelamento": i.data_cancelamento,
      "Motivo": i.motivo,
      "Obs": i.obs,
      "Pago até": i.pago_ate,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cancelRows.length ? cancelRows : [{ " ": "Sem registros" }]), "Cancelamentos");

    const ativRows = rel.ativacoes.itens.map((i: any) => ({
      "ID Contrato": i.id_contrato,
      Cliente: i.cliente,
      "Data Ativação": i.data_ativacao,
      Plano: i.plano,
      Status: i.status,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ativRows.length ? ativRows : [{ " ": "Sem registros" }]), "Ativacoes");

    const osRows = rel.ordens_servico.itens.map((i: any) => ({
      "ID OS": i.id_os,
      Tipo: i.tipo,
      Cliente: i.cliente,
      Status: i.status,
      "Data Abertura": i.data_abertura,
      "Data Fechamento": i.data_fechamento,
      Tecnico: i.tecnico,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(osRows.length ? osRows : [{ " ": "Sem registros" }]), "Ordens_Servico");

    const b = rel.entrada_bancaria;
    const bancHeader: any[] = [
      { "Período": `${p.inicio} a ${p.fim}` },
      { "Total Registros": b.total_registros },
      { "Total Valor (R$)": b.total_valor.toFixed(2) },
      { "Total Valor Semana Anterior (R$)": b.total_valor_sem_anterior.toFixed(2) },
      { "Variação (%)": b.variacao_percentual === null ? "INVÁLIDO (janelas diferentes)" : b.variacao_percentual },
      { "Comparativo Válido": b.comparativo_valido ? "SIM" : "NÃO" },
      {},
    ];
    const bancRows = b.itens.map((i: any) => ({
      "ID Recebimento": i.id_recebimento,
      Cliente: i.cliente,
      "Data Baixa": i.data_baixa,
      "Forma Pagamento": i.forma_pagamento,
      "Valor (R$)": i.valor.toFixed(2),
    }));
    const bancSheet = XLSX.utils.json_to_sheet(bancHeader.concat(bancRows.length ? bancRows : [{ " ": "Sem registros" }]));
    XLSX.utils.book_append_sheet(wb, bancSheet, "Entrada_Bancaria");

    const bloqRows = rel.bloqueados_mes.itens.map((i: any) => ({
      "ID Contrato": i.id_contrato,
      Cliente: i.cliente,
      "Status Acesso": i.status_acesso,
      "Data Bloqueio": i.data_bloqueio,
      Motivo: i.motivo,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bloqRows.length ? bloqRows : [{ " ": "Sem registros" }]), "Bloqueados_Mes");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const nome = `relatorio_semanal_${p.inicio}_a_${p.fim}.xlsx`;

    res.setHeader("Content-Disposition", `attachment; filename="${nome}"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(buffer);
  } catch (error: any) {
    if (error instanceof RelatorioGuardrailsError) {
      return res.status(403).json({ error: true, guardrails: true, message: error.message });
    }
    console.error("Erro ao gerar relatório semanal:", error);
    return res.status(500).json({ error: true, message: error?.message || "Erro ao gerar relatório" });
  }
}

/**
 * Resumo JSON do relatório (para enviar no Telegram).
 * GET /api/relatorios/semanal/resumo?forcar=1
 */
export async function relatorioSemanalResumo(req: Request, res: Response) {
  try {
    const forcar = req.query.forcar === "1" || req.query.forcar === "true";
    const rel = await gerarRelatorioSemanal(new Date(), forcar);
    const b = rel.entrada_bancaria;
    const resumo = {
      periodo: rel.periodo,
      cancelamentos: rel.cancelamentos.total,
      cancelamentos_aviso: rel.cancelamentos.aviso,
      ativacoes: rel.ativacoes.total,
      ativacoes_aviso: rel.ativacoes.aviso,
      ordens_servico: rel.ordens_servico.total,
      ordens_servico_aviso: rel.ordens_servico.aviso,
      entrada_bancaria: {
        registros: b.total_registros,
        valor: b.total_valor,
        valor_semana_anterior: b.total_valor_sem_anterior,
        variacao_percentual: b.variacao_percentual,
        comparativo_valido: b.comparativo_valido,
      },
      bloqueados_mes: rel.bloqueados_mes.total,
      bloqueados_mes_aviso: rel.bloqueados_mes.aviso,
    };
    return res.json(resumo);
  } catch (error: any) {
    if (error instanceof RelatorioGuardrailsError) {
      return res.status(403).json({ error: true, guardrails: true, message: error.message });
    }
    return res.status(500).json({ error: true, message: error?.message });
  }
}
