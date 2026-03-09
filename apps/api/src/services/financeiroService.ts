
import { ixcService } from "./ixcService";

export interface FaturaFormatada {
  id: number;
  id_contrato: number;
  vencimento: string;
  valor: number;
  valor_nominal: number;
  valor_atualizado: number;
  valor_recebido: number;
  data_pagamento: string | null;
  status: "aberto" | "pago" | "cancelado";
  isVencida: boolean;
  dias_atraso: number;
  juros: string;
  linhaDigitavel: string;
  pixTxid: string;
  labelContrato: string;
  pdf_link: string;
  valor_aberto: number;
}

export class FinanceiroService {
  /**
   * Helper para garantir que a data esteja no formato ISO YYYY-MM-DD
   */
  private parseDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    const str = String(dateStr).trim();

    // Se já estiver no formato YYYY-MM-DD, apenas retorna a parte da data
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.split(" ")[0];
    }

    // Se estiver no formato DD/MM/YYYY
    const parts = str.split("/");
    if (parts.length === 3) {
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      const year = parts[2].split(" ")[0]; // Pega apenas o ano, ignora hora se houver
      return `${year}-${month}-${day}`;
    }

    return str.split(" ")[0];
  }

  /**
   * Processa e formata as faturas brutas do IXC com busca detalhada de baixas
   */
  async processarFaturas(faturas: any[], filtroStatus?: "aberto" | "pago" | "cancelado"): Promise<FaturaFormatada[]> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Processamento inicial síncrono para mapear campos básicos
    const faturasMapeadas = faturas.map(f => {
      const valorNum = parseFloat(f.valor || "0");
      const valorRecebidoNum = parseFloat(f.valor_recebido || f.valor_pago || "0");
      const valorAbertoNum = parseFloat(f.valor_aberto || "0");

      const dataVencStr = this.parseDate(f.data_vencimento || f.vencimento);
      const vencimentoDate = new Date(dataVencStr + "T12:00:00"); // Usa meio-dia para evitar problemas de timezone

      const diffTime = hoje.getTime() - vencimentoDate.getTime();
      const diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let status: "aberto" | "pago" | "cancelado" = "aberto";
      const statusRaw = String(f.status).toUpperCase();

      if (statusRaw === "R") {
        status = "pago";
      } else if (statusRaw === "C") {
        status = "cancelado";
      } else if (statusRaw === "P") {
        status = valorAbertoNum <= 0 && valorRecebidoNum > 0 ? "pago" : "aberto";
      } else if (statusRaw === "A" || statusRaw === "V") {
        status = "aberto";
      } else {
        status = (valorRecebidoNum >= valorNum && valorNum > 0) ? "pago" : "aberto";
      }

      const isVencida = status === "aberto" && vencimentoDate < hoje;

      // Cálculo de juros estimados se o IXC enviar valor_aberto maior que o nominal
      let jurosCalculado = "0.00";
      if (isVencida && valorAbertoNum > valorNum) {
        jurosCalculado = (valorAbertoNum - valorNum).toFixed(2);
      }

      return {
        id: parseInt(f.id),
        id_contrato: parseInt(f.id_contrato || f.id_contrato_avulso || "0"),
        vencimento: dataVencStr,
        // Valor nominal original do boleto
        valor_nominal: valorNum,
        // Valor final (com juros se aberto, ou líquido se pago)
        valor: status === "pago" ? parseFloat(f.valor_recebido || f.pagamento_valor || f.valor || "0") : (status === "aberto" && valorAbertoNum > 0 ? valorAbertoNum : valorNum),
        valor_atualizado: valorAbertoNum > 0 ? valorAbertoNum : valorNum,
        // Valor que FOI recebido (Líquido)
        valor_recebido: parseFloat(f.valor_recebido || f.pagamento_valor || "0"),
        // Data real da liquidação
        data_pagamento: this.parseDate(f.data_pagamento || f.pagamento_data || f.baixa_data || null),
        status: status,
        isVencida: isVencida,
        dias_atraso: isVencida ? diasAtraso : 0,
        juros: f.juros || f.valor_juros || jurosCalculado,
        linhaDigitavel: f.linha_digitavel || "",
        pixTxid: f.pix_txid || "",
        labelContrato: f.contrato_descricao || `Contrato #${f.id_contrato}`,
        pdf_link: `/financeiro/boleto/${f.id}/pdf`,
        valor_aberto: valorAbertoNum
      };
    });

    // 🔥 BUSCA DETALHADA DE BAIXAS (REAL VALOR PAGO E DATA)
    // Filtramos apenas as que estão pagas ou parciais para não sobrecarregar o IXC
    const faturasParaDetalhar = faturasMapeadas.filter(f => f.status === "pago" || (f.status === "aberto" && f.valor_recebido > 0));

    await Promise.all(faturasParaDetalhar.map(async (f) => {
      try {
        const baixas = await ixcService.buscarBaixasDaFatura(f.id);
        if (baixas && baixas.length > 0) {
          baixas.sort((a: any, b: any) => {
            const dataA = new Date(a.data || a.data_pagamento).getTime();
            const dataB = new Date(b.data || b.data_pagamento).getTime();
            return dataB - dataA;
          });

          // Soma o valor REAL recebido nas baixas (considerando descontos/juros aplicados no ato)
          const totalBaixado = baixas.reduce((acc: number, b: any) => acc + parseFloat(b.valor_pago || b.valor || 0), 0);

          if (totalBaixado > 0) {
            f.valor_recebido = totalBaixado;
            // Se for uma fatura totalmente paga, o "valor" a exibir deve ser o valor recebido (que reflete o desconto)
            if (f.status === "pago") {
              f.valor = totalBaixado;
            }
          }

          // Pega a data da primeira baixa como data de pagamento real
          if (!f.data_pagamento) {
            f.data_pagamento = baixas[0].data || baixas[0].data_pagamento;
          }
        }
      } catch (err) {
        console.warn(`[FinanceiroService] Erro ao buscar baixas para fatura ${f.id}`);
      }
    }));

    return faturasMapeadas
      .filter(f => !filtroStatus || f.status === filtroStatus)
      .sort((a, b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime());
  }

  /**
   * Busca faturas para consulta por CPF/CNPJ (Modal Público)
   */
  async buscarParaConsultaRapida(cpfCnpj: string) {
    const clientes = await ixcService.buscarClientesPorCpf(cpfCnpj);
    if (!clientes.length) return [];

    const faturasPromises = clientes.map(c => ixcService.financeiroListar(c.id));
    const resultados = await Promise.all(faturasPromises);

    // Para o Modal Público, geralmente mostramos apenas as abertas
    return await this.processarFaturas(resultados.flat(), "aberto");
  }

  /**
   * Realiza o desbloqueio de confiança para um contrato bloqueado
   */
  async realizarDesbloqueio(idContrato: number) {
    return await ixcService.desbloqueioConfianca(idContrato);
  }

  /**
   * Busca detalhes específicos do pagamento de uma fatura
   */
  async buscarDetalhesPagamento(idFatura: number) {
    const baixas = await ixcService.buscarBaixasDaFatura(idFatura);
    if (!baixas.length) return null;

    return baixas.map((b: any) => ({
      data: b.data,
      valor_pago: parseFloat(b.valor || "0"),
      valor_desconto: parseFloat(b.valor_desconto || "0"),
      desconto: parseFloat(b.valor_desconto || "0"),
      juros: parseFloat(b.valor_juros || "0"),
      forma_pagamento: b.historico || "Pagamento Processado"
    }));
  }

  /**
   * Calcula o resumo financeiro global ou por contrato
   */
  gerarResumo(faturas: FaturaFormatada[]) {
    const abertas = faturas.filter(f => f.status === "aberto");
    const vencidas = abertas.filter(f => f.isVencida);

    return {
      total_aberto: abertas.reduce((acc, f) => acc + f.valor, 0),
      qtd_abertas: abertas.length,
      qtd_vencidas: vencidas.length,
      tem_pendencia: vencidas.length > 0,
      proximo_vencimento: abertas.length > 0 ? abertas[abertas.length - 1].vencimento : null
    };
  }
}

export const financeiroService = new FinanceiroService();
