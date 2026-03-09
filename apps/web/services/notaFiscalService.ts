// src/services/notaFiscalService.ts
import { NotaFiscal } from "../types/api";

export interface NotaFiscalFormatada {
  id: number | string;
  numero: string;
  valor: number;
  dataEmissao: string;
  ano: string;
  status: string;
  pdf_link: string;
  id_contrato: number | string | null;
}

export class NotaFiscalService {
  /**
   * Formata lista de Notas Fiscais
   */
  formatarNotas(notas: NotaFiscal[]): NotaFiscalFormatada[] {
    return (notas || []).map(nf => ({
      id: nf.id,
      numero: nf.numero || String(nf.id),
      valor: parseFloat(String(nf.valor || "0").replace(/[^\d.-]/g, "")),
      dataEmissao: nf.data_emissao || "",
      ano: nf.data_emissao ? nf.data_emissao.substring(0, 4) : "Outros",
      status: "Válida",
      pdf_link: nf.link_pdf || "",
      id_contrato: (nf as any).id_contrato || (nf as any).contrato_id || null
    })).sort((a, b) => new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime());
  }

  /**
   * Organiza as notas em um formato de "Pastas por Ano"
   */
  agruparPorAno(notas: NotaFiscalFormatada[]) {
    return notas.reduce((acc: Record<string, NotaFiscalFormatada[]>, nf) => {
      const ano = nf.ano;
      if (!acc[ano]) acc[ano] = [];
      acc[ano].push(nf);
      return acc;
    }, {});
  }
}

export const notaFiscalService = new NotaFiscalService();
