import { ixcService } from "./ixcService";

/**
 * SERVIÇO DE RELATÓRIOS SEMANAIS (FiberNET / Kadu)
 *
 * GUARDRAILS (definidos 26/08/2026):
 *   1. Só gera em horário permitido (seg 07:00-07:30) ou com forcar=true.
 *   2. Período TRAVADO em "última semana" (seg->dom passado). Nunca aceita
 *      data externa arbitrária (evita vazar histórico fora do escopo).
 *   3. Limite de 200 registros/aba. Se passar, marca "VERIFICAR" no resumo
 *      (não silencia, não estoura).
 *   4. Comparativo bancário: as duas janelas devem ter o MESMO tamanho.
 *      Se não, variacao = null (não inventa %).
 *   5. Bloqueados: SÓ status_acesso='B' do mês vigente. Nunca lista
 *      cancelados nem ativos.
 *   6. Resumo JSON NUNCA traz CPF/CNPJ completo.
 */

export const LIMITE_REGISTROS = 200;
export const HORARIO_PERMITIDO = { dia: 1, horaInicio: 7, horaFim: 8 }; // segunda, 07:00-07:59

export class RelatorioGuardrailsError extends Error {}

export function validarExecucaoRelatorio(ref: Date = new Date(), forcar = false): void {
  if (forcar) return;
  const d = new Date(ref);
  const dia = d.getDay(); // 1 = segunda
  const hora = d.getHours();
  if (dia !== HORARIO_PERMITIDO.dia) {
    throw new RelatorioGuardrailsError(
      `GUARDRAILS: relatório só pode rodar às segundas (dia=${dia}). Use forcar=true para execução manual fora do horário.`
    );
  }
  if (hora < HORARIO_PERMITIDO.horaInicio || hora >= HORARIO_PERMITIDO.horaFim) {
    throw new RelatorioGuardrailsError(
      `GUARDRAILS: relatório só pode rodar entre ${HORARIO_PERMITIDO.horaInicio}h e ${HORARIO_PERMITIDO.horaFim}h de segunda. Use forcar=true para execução manual.`
    );
  }
}

export interface Periodo {
  inicio: string;
  fim: string;
  inicioAnt: string;
  fimAnt: string;
}

export function calcularPeriodoSemana(ref: Date = new Date()): Periodo {
  const hoje = new Date(ref);
  const diaSem = hoje.getDay();
  const domPassado = new Date(hoje);
  domPassado.setDate(hoje.getDate() - diaSem);
  domPassado.setHours(23, 59, 59, 0);
  const segPassado = new Date(domPassado);
  segPassado.setDate(domPassado.getDate() - 6);
  segPassado.setHours(0, 0, 0, 0);
  const domAnt = new Date(segPassado);
  domAnt.setDate(segPassado.getDate() - 1);
  domAnt.setHours(23, 59, 59, 0);
  const segAnt = new Date(domAnt);
  segAnt.setDate(domAnt.getDate() - 6);
  segAnt.setHours(0, 0, 0, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return {
    inicio: fmt(segPassado),
    fim: fmt(domPassado),
    inicioAnt: fmt(segAnt),
    fimAnt: fmt(domAnt),
  };
}

function somar(a: number, b: number): number {
  return (a || 0) + (b || 0);
}

function cortar(itens: any[], secao: string) {
  const estourou = itens.length > LIMITE_REGISTROS;
  return {
    estourou,
    aviso: estourou ? `VERIFICAR: ${secao} passou de ${LIMITE_REGISTROS} registros (mostrando ${LIMITE_REGISTROS}).` : null,
    itens: estourou ? itens.slice(0, LIMITE_REGISTROS) : itens,
  };
}

export async function relatorioCancelamentos(p: Periodo) {
  const regs = await ixcService["fetchIxc"]("cliente_contrato", {
    qtype: "cliente_contrato.data_cancelamento",
    query: p.inicio + " 00:00:00|" + p.fim + " 23:59:59",
    oper: ">=<|",
    page: "1",
    rp: String(LIMITE_REGISTROS + 1),
    sortname: "cliente_contrato.data_cancelamento",
    sortorder: "desc",
  });
  const itens = regs.map((c: any) => ({
    id_contrato: c.id,
    cliente: c.razao || c.nome || "",
    data_cancelamento: c.data_cancelamento,
    motivo: c.motivo_cancelamento,
    obs: c.obs_cancelamento,
    pago_ate: c.pago_ate_data,
  }));
  const c = cortar(itens, "Cancelamentos");
  return { periodo: p, total: itens.length, truncado: c.estourou, aviso: c.aviso, itens: c.itens };
}

export async function relatorioAtivacoes(p: Periodo) {
  const regs = await ixcService["fetchIxc"]("cliente_contrato", {
    qtype: "cliente_contrato.data_ativacao",
    query: p.inicio + "|" + p.fim,
    oper: ">=<|",
    page: "1",
    rp: String(LIMITE_REGISTROS + 1),
    sortname: "cliente_contrato.data_ativacao",
    sortorder: "desc",
  });
  const itens = regs.map((c: any) => ({
    id_contrato: c.id,
    cliente: c.razao || c.nome || "",
    data_ativacao: c.data_ativacao,
    plano: c.descricao || c.id_vd_contrato,
    status: c.status,
  }));
  const c = cortar(itens, "Ativações");
  return { periodo: p, total: itens.length, truncado: c.estourou, aviso: c.aviso, itens: c.itens };
}

export async function relatorioOS(p: Periodo) {
  const regs = await ixcService["fetchIxc"]("su_oss", {
    qtype: "su_oss.data_abertura",
    query: p.inicio + "|" + p.fim,
    oper: ">=<|",
    page: "1",
    rp: String(LIMITE_REGISTROS + 1),
    sortname: "su_oss.data_abertura",
    sortorder: "desc",
  });
  const itens = regs.map((o: any) => ({
    id_os: o.id,
    tipo: o.tipo || o.id_tipo_os,
    cliente: o.razao || o.cliente || "",
    status: o.status,
    data_abertura: o.data_abertura,
    data_fechamento: o.data_fechamento,
    tecnico: o.tecnico || o.id_tecnico,
  }));
  const c = cortar(itens, "Ordens de Serviço");
  return { periodo: p, total: itens.length, truncado: c.estourou, aviso: c.aviso, itens: c.itens };
}

export async function relatorioEntradaBancaria(p: Periodo) {
  const regs = await ixcService["fetchIxc"]("fn_areceber_baixas", {
    qtype: "fn_areceber_baixas.data_baixa",
    query: p.inicio + "|" + p.fim,
    oper: ">=<|",
    page: "1",
    rp: "500",
    sortname: "fn_areceber_baixas.data_baixa",
    sortorder: "asc",
  });
  const regsAnt = await ixcService["fetchIxc"]("fn_areceber_baixas", {
    qtype: "fn_areceber_baixas.data_baixa",
    query: p.inicioAnt + "|" + p.fimAnt,
    oper: ">=<|",
    page: "1",
    rp: "500",
    sortname: "fn_areceber_baixas.data_baixa",
    sortorder: "asc",
  });
  const valor = (r: any) => parseFloat(r.valor_recebido || r.valor || r.valor_pago || 0) || 0;
  const total = regs.reduce((s: number, r: any) => somar(s, valor(r)), 0);
  const totalAnt = regsAnt.reduce((s: number, r: any) => somar(s, valor(r)), 0);
  // GUARDRAIL 4: janelas devem ter mesmo tamanho p/ comparativo válido
  const diasAtual = Math.round((new Date(p.fim).getTime() - new Date(p.inicio).getTime()) / 86400000) + 1;
  const diasAnt = Math.round((new Date(p.fimAnt).getTime() - new Date(p.inicioAnt).getTime()) / 86400000) + 1;
  const variacao = diasAtual === diasAnt && totalAnt > 0 ? Number((((total - totalAnt) / totalAnt) * 100).toFixed(2)) : null;
  const itens = regs.map((r: any) => ({
    id_recebimento: r.id,
    cliente: r.razao || r.cliente || "",
    data_baixa: r.data_baixa,
    forma_pagamento: r.forma_pagamento || r.id_forma_pagamento,
    valor: valor(r),
  }));
  return {
    periodo: p,
    total_registros: itens.length,
    total_valor: total,
    total_valor_sem_anterior: totalAnt,
    variacao_percentual: variacao,
    comparativo_valido: variacao !== null,
    itens,
  };
}

export async function relatorioBloqueadosMes(p: Periodo) {
  const inicioMes = p.inicio.slice(0, 7) + "-01";
  const regs = await ixcService["fetchIxc"]("cliente_contrato", {
    qtype: "cliente_contrato.status_acesso",
    query: "B", // GUARDRAIL 5: SÓ bloqueados
    oper: "=",
    page: "1",
    rp: "500",
    sortname: "cliente_contrato.id",
    sortorder: "desc",
  });
  const itens = regs
    .filter((c: any) => {
      const d = c.data_inicial_suspensao || c.data || c.dt_ult_desbloq_auto;
      return d && d >= inicioMes; // GUARDRAIL 5: só do mês vigente
    })
    .map((c: any) => ({
      id_contrato: c.id,
      cliente: c.razao || c.nome || "",
      status_acesso: c.status_acesso,
      data_bloqueio: c.data_inicial_suspensao || c.data,
      motivo: c.motivo_inclusao || "",
    }));
  const c = cortar(itens, "Bloqueados do mês");
  return { mes: inicioMes.slice(0, 7), total: itens.length, truncado: c.estourou, aviso: c.aviso, itens: c.itens };
}

export async function gerarRelatorioSemanal(ref: Date = new Date(), forcar = false) {
  validarExecucaoRelatorio(ref, forcar); // GUARDRAIL 1
  const p = calcularPeriodoSemana(ref); // GUARDRAIL 2 (período travado)
  const [cancel, ativ, os, banc, bloq] = await Promise.all([
    relatorioCancelamentos(p),
    relatorioAtivacoes(p),
    relatorioOS(p),
    relatorioEntradaBancaria(p),
    relatorioBloqueadosMes(p),
  ]);
  return { periodo: p, cancelamentos: cancel, ativacoes: ativ, ordens_servico: os, entrada_bancaria: banc, bloqueados_mes: bloq };
}

