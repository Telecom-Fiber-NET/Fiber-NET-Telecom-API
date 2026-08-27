import { ixcService } from "./ixcService";

/**
 * SERVIÇO DE POTÊNCIA DAS ONTs (FiberNET / Kadu)
 *
 * Coleta o nível óptico (sinal_rx / sinal_tx) de todas as ONTs fibra
 * (tabela radpop_radio_cliente_fibra) e cruza com o contrato para
 * obter o ENDEREÇO do cliente. Gera planilha separada por:
 *   OLT (id_transmissor) -> PON (ponid) -> Porta (onu_numero) -> Endereço
 * com classificação de qualidade e PLANO DE MELHORIA.
 *
 * GUARDRAILS (26/08/2026):
 *   1. Só leitura (GET). NÃO altera configuração de ONT (não reboot/grava).
 *   2. Respeita limite de paginação (rp) e página até esgotar.
 *   3. Classificação de sinal por faixa padrão FTTH (rx em dBm).
 */

export interface OntInfo {
  id_ont: string;
  id_contrato: string;
  olt: string; // id_transmissor
  pon: string; // ponid (ex: 0/1/9)
  porta: string; // onu_numero
  sinal_rx: number;
  sinal_tx: number;
  temperatura: number;
  data_sinal: string;
  endereco: string;
  cliente: string;
  classificacao: "OTIMO" | "BOM" | "RUIM" | "CRITICO" | "SEM_SINAL";
  plano_melhoria: string;
}

function classificar(rx: number): { c: OntInfo["classificacao"]; p: string } {
  if (rx === 0 || rx === null || rx === undefined || Number.isNaN(rx)) {
    return { c: "SEM_SINAL", p: "ONT sem leitura óptica — verificar se está online, cabo desconectado ou ONU sem alimentação." };
  }
  if (rx >= -22) return { c: "OTIMO", p: "Sinal dentro do ideal. Nenhuma ação necessária." };
  if (rx >= -25) return { c: "BOM", p: "Sinal aceitável. Monitorar variação; se oscilar, limpar conector SC/APC." };
  if (rx >= -27) return { c: "RUIM", p: "Sinal no limite inferior. Agendar visita técnica: limpar conector, verificar emenda/dobra de fibra, medir attenuação do patch cord." };
  return { c: "CRITICO", p: "Sinal crítico (< -27 dBm). Risco de queda. Ação prioritária: realocar em PON menos saturada, trocar jumper, verificar splitter, ou retransmissão de fibra." };
}

export async function coletarPotenciaONTs(): Promise<{ total: number; ontss: OntInfo[] }> {
  const RP = 200;
  let page = 1;
  const todas: any[] = [];
  while (true) {
    const regs = await ixcService["fetchIxc"]("radpop_radio_cliente_fibra", {
      qtype: "radpop_radio_cliente_fibra.id",
      query: "0",
      oper: ">",
      page: String(page),
      rp: String(RP),
      sortname: "radpop_radio_cliente_fibra.id",
      sortorder: "asc",
    });
    if (!regs.length) break;
    todas.push(...regs);
    if (regs.length < RP) break;
    page++;
  }

  const ontss: OntInfo[] = [];
  for (const c of todas) {
    const rx = parseFloat(c.sinal_rx);
    const { c: cl, p } = classificar(rx);
    // endereço vem vazio na ONT; tenta cruzar com contrato/cliente
    let endereco = [c.endereco, c.numero, c.bairro, c.cidade].filter(Boolean).join(" ").trim();
    let cliente = c.nome || "";
    if (c.id_contrato && (!endereco || !cliente)) {
      try {
        const contr = await ixcService["fetchIxc"]("cliente_contrato", {
          qtype: "cliente_contrato.id",
          query: String(c.id_contrato),
          oper: "=",
          page: "1",
          rp: "1",
        });
        if (contr[0]) {
          cliente = contr[0].razao || contr[0].nome || cliente;
          const e = [contr[0].endereco, contr[0].numero, contr[0].bairro, contr[0].cidade].filter(Boolean).join(" ").trim();
          if (e) endereco = e;
        }
      } catch {
        /* ignora falha de cruzamento */
      }
    }
    ontss.push({
      id_ont: String(c.id),
      id_contrato: String(c.id_contrato || ""),
      olt: String(c.id_transmissor || ""),
      pon: String(c.ponid || ""),
      porta: String(c.onu_numero || ""),
      sinal_rx: rx,
      sinal_tx: parseFloat(c.sinal_tx),
      temperatura: parseFloat(c.temperatura),
      data_sinal: c.data_sinal || "",
      endereco,
      cliente,
      classificacao: cl,
      plano_melhoria: p,
    });
  }
  return { total: ontss.length, ontss };
}
