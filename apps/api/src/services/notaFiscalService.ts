
import { ixcService } from "./ixcService";

export interface NotaFiscalFormatada {
  id: number;
  numero: string;
  valor: number;
  dataEmissao: string;
  mesAno: string;
  ano: string;
  status: string;
  pdf_link: string;
  id_contrato: number | null;
}

export class NotaFiscalService {
  /**
   * Busca e formata o histórico de Notas Fiscais
   */
  async buscarHistorico(idCliente: number, idContrato?: number): Promise<NotaFiscalFormatada[]> {
    const notasRaw = await ixcService.listarNotasFiscais(idCliente, idContrato);

    return notasRaw.map(nf => ({
      id: parseInt(nf.id),
      numero: nf.numero || nf.documento || "N/A",
      valor: parseFloat(nf.valor_total || nf.valor || "0"),
      dataEmissao: nf.data_emissao,
      mesAno: nf.data_emissao ? nf.data_emissao.substring(0, 7) : "Sem Data",
      ano: nf.data_emissao ? nf.data_emissao.substring(0, 4) : "Outros",
      status: nf.status === 'A' ? 'Válida' : 'Cancelada',
      pdf_link: `/financeiro/notas/${nf.id}/imprimir`,
      id_contrato: nf.id_contrato ? parseInt(nf.id_contrato) : null
    })).sort((a, b) => new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime());
  }

  /**
   * Organiza as notas em um formato de "Pastas por Ano" para o Frontend
   */
  agruparPorAno(notas: NotaFiscalFormatada[]) {
    return notas.reduce((acc: any, nf) => {
      const ano = nf.ano;
      if (!acc[ano]) acc[ano] = [];
      acc[ano].push(nf);
      return acc;
    }, {});
  }
}

export const notaFiscalService = new NotaFiscalService();
