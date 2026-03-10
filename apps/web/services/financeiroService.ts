// src/services/financeiroService.ts
import { Fatura } from "../types/api";
import { apiService } from "./apiService";

export class FinanceiroService {
  /**
   * Busca faturas para o Modal Público (Apenas CPF/CNPJ)
   */
  async buscarParaConsultaRapida(cpfCnpj: string) {
    const response = await apiService.getPublicInvoices(cpfCnpj);
    if (!response.success || !response.data) {
      throw new Error(response.message || "Faturas não encontradas");
    }
    return this.processarFaturas(response.data, "aberto");
  }

  /**
   * Lógica Central de Processamento (O cérebro do financeiro)
   */
  public processarFaturas(faturas: any[], filtroStatus?: "aberto" | "pago" | "cancelado") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return faturas
      .map(f => {
        const dataVenc = new Date(f.vencimento || f.data_vencimento);
        dataVenc.setHours(0, 0, 0, 0);
        
        // Mapeamento Robusto de Status (Backend já deve enviar mapeado, mas reforçamos aqui)
        const rawStatus = String(f.status).toLowerCase();
        let statusMapeado: "aberto" | "pago" | "cancelado" = "aberto";

        if (["r", "pago", "recebido"].includes(rawStatus)) {
          statusMapeado = "pago";
        } else if (["c", "cancelado"].includes(rawStatus)) {
          statusMapeado = "cancelado";
        } else if (["a", "p", "v", "aberto", "vencido", "parcial"].includes(rawStatus)) {
          statusMapeado = "aberto";
        }

        const diffTime = today.getTime() - dataVenc.getTime();
        const diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isVencida = dataVenc < today && statusMapeado === "aberto";

        return {
          id: f.id || f.id_titulo,
          id_contrato: f.id_contrato || f.contrato_id,
          vencimento: f.vencimento || f.data_vencimento,
          valor: typeof f.valor === 'number' ? f.valor : parseFloat(String(f.valor).replace(/[^\d.-]/g, "") || "0"),
          valor_atualizado: f.valor_atualizado ? (typeof f.valor_atualizado === 'number' ? f.valor_atualizado : parseFloat(String(f.valor_atualizado).replace(/[^\d.-]/g, "") || "0")) : undefined,
          valor_recebido: typeof f.valor_recebido === 'number' ? f.valor_recebido : (f.valor_recebido ? parseFloat(String(f.valor_recebido).replace(/[^\d.-]/g, "") || "0") : 0),
          status: statusMapeado,
          isVencida: isVencida,
          dias_atraso: isVencida ? diasAtraso : 0,
          linhaDigitavel: f.linha_digitavel || f.linhaDigitavel || "",
          pix_code: f.pix_code || f.pixTxid || f.qrcode || "",
          qr_code: f.qr_code || f.imagem || "",
          labelContrato: f.labelContrato || f.contrato_descricao || `Contrato #${f.id_contrato || f.contrato_id}`,
          data_pagamento: f.data_pagamento || null,
          juros: f.juros || (f.valor_atualizado && f.valor_atualizado > f.valor ? (f.valor_atualizado - f.valor).toFixed(2) : "0.00"),
          multa: f.multa
        };
      })
      .filter(f => f.status !== "cancelado")
      .filter(f => !filtroStatus || f.status === filtroStatus)
      .sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime());
  }

  /**
   * Consolida Totais (Útil para o Card de Resumo)
   */
  calcularResumo(faturas: any[]) {
    const abertas = faturas.filter(f => f.status === "aberto");
    return {
      totalAberto: abertas.reduce((acc, f) => acc + (f.valor_atualizado || f.valor), 0),
      qtdAbertas: abertas.length,
      proximoVencimento: abertas[0]?.vencimento || null,
      temVencidas: abertas.some(f => f.isVencida)
    };
  }

  formatCurrency(value?: string | number) {
    const val = typeof value === "string" ? parseFloat(value.replace(/[^\d.-]/g, "")) : value;
    if (val === undefined || val === null || isNaN(val)) return "--";
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  async downloadPdf(id: number | string) {
    try {
      const response = await apiService.getSegundaVia(id);
      
      if (response.base64_document) {
        // Remove possíveis prefixos data:application/pdf;base64,
        const base64Content = response.base64_document.includes(',') 
          ? response.base64_document.split(',')[1] 
          : response.base64_document;

        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fatura_${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return true;
      }
      
      throw new Error("Documento não disponível");
    } catch (e) {
      console.error("Erro ao baixar PDF:", e);
      alert("Erro ao baixar o boleto. Por favor, tente novamente.");
      return false;
    }
  }

  isOverdue(dateStr: string) {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateStr);
    return dueDate < today;
  }

  sharePixWhatsApp(pixCode: string) {
    const text = `Segue o código PIX para pagamento:\n\n${pixCode}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  }

  copyToClipboard(text: string): Promise<void> {
    return navigator.clipboard.writeText(text);
  }
}

export const financeiroService = new FinanceiroService();
