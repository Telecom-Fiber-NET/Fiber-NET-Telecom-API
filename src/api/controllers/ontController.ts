import { Request, Response } from "express";
import * as XLSX from "xlsx";
import { coletarPotenciaONTs } from "../../services/ontService";

/**
 * GET /api/ont/potencia-planilha
 * Gera XLSX com potência das ONTs, separado por:
 *   Aba "Resumo" (contagem por OLT e por classificação)
 *   Aba por OLT (ex: "OLT_1") listando PON -> Porta -> Endereço -> Sinal -> Plano de melhoria
 */
export async function ontPotenciaPlanilha(req: Request, res: Response) {
  try {
    const { total, ontss } = await coletarPotenciaONTs();

    const wb = XLSX.utils.book_new();

    // Resumo
    const porOlt: Record<string, number> = {};
    const porClasse: Record<string, number> = {};
    for (const o of ontss) {
      porOlt[o.olt] = (porOlt[o.olt] || 0) + 1;
      porClasse[o.classificacao] = (porClasse[o.classificacao] || 0) + 1;
    }
    const resumoRows = [
      { Metrica: "Total de ONTs", Valor: total },
      { Metrica: "OTIMO (>= -22 dBm)", Valor: porClasse["OTIMO"] || 0 },
      { Metrica: "BOM (-22 a -25)", Valor: porClasse["BOM"] || 0 },
      { Metrica: "RUIM (-25 a -27)", Valor: porClasse["RUIM"] || 0 },
      { Metrica: "CRITICO (< -27)", Valor: porClasse["CRITICO"] || 0 },
      { Metrica: "SEM SINAL", Valor: porClasse["SEM_SINAL"] || 0 },
    ];
    for (const [olt, qtd] of Object.entries(porOlt)) {
      resumoRows.push({ Metrica: `OLT ${olt}`, Valor: qtd });
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumoRows), "Resumo");

    // Agrupa por OLT
    const grupos: Record<string, typeof ontss> = {};
    for (const o of ontss) {
      (grupos[o.olt] = grupos[o.olt] || []).push(o);
    }
    for (const [olt, lista] of Object.entries(grupos)) {
      // ordena por PON depois porta
      lista.sort((a, b) =>
        a.pon === b.pon ? (parseInt(a.porta) || 0) - (parseInt(b.porta) || 0) : a.pon.localeCompare(b.pon)
      );
      const rows = lista.map((o) => ({
        PON: o.pon,
        Porta_ONT: o.porta,
        "Sinal RX (dBm)": o.sinal_rx,
        "Sinal TX (dBm)": o.sinal_tx,
        Temperatura: o.temperatura,
        "Data Leitura": o.data_sinal,
        Cliente: o.cliente,
        "ID Contrato": o.id_contrato,
        Endereco: o.endereco,
        Classificacao: o.classificacao,
        "Plano de Melhoria": o.plano_melhoria,
      }));
      const nomeAba = `OLT_${olt}`.slice(0, 31);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), nomeAba);
    }

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const nome = `potencia_onts_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader("Content-Disposition", `attachment; filename="${nome}"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(buffer);
  } catch (error: any) {
    console.error("Erro ao gerar planilha de potência:", error);
    return res.status(500).json({ error: true, message: error?.message || "Erro ao gerar planilha" });
  }
}

/**
 * GET /api/ont/potencia/resumo
 * Resumo JSON (contagens) para envio no Telegram.
 */
export async function ontPotenciaResumo(req: Request, res: Response) {
  try {
    const { total, ontss } = await coletarPotenciaONTs();
    const porClasse: Record<string, number> = {};
    const ruins = ontss.filter((o) => o.classificacao === "RUIM" || o.classificacao === "CRITICO" || o.classificacao === "SEM_SINAL");
    for (const o of ontss) porClasse[o.classificacao] = (porClasse[o.classificacao] || 0) + 1;
    return res.json({
      total,
      por_classificacao: porClasse,
      atencao: ruins.length,
      ruins_exemplo: ruins.slice(0, 20).map((o) => ({
        olt: o.olt,
        pon: o.pon,
        porta: o.porta,
        rx: o.sinal_rx,
        cliente: o.cliente,
        endereco: o.endereco,
        classificacao: o.classificacao,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ error: true, message: error?.message });
  }
}
