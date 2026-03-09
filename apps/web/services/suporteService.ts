// src/services/suporteService.ts
import { apiService } from "./apiService";

export interface AtendimentoFormatado {
  id: number | string;
  tipo: 'TICKET' | 'VISITA';
  protocolo: string;
  titulo: string;
  data: string;
  status: {
    label: string;
    color: string;
  };
  statusRaw: string;
  descricao: string;
  podeInteragir: boolean;
  id_contrato: number | string | null;
  dataAgendamento?: string;
  tecnico?: string;
}

export class SuporteService {
  /**
   * Consolida OS e Tickets em uma única lista
   */
  async listarAtendimentos(idCliente: number | string, idContrato?: number | string): Promise<AtendimentoFormatado[]> {
    // Simulando busca do dashboardData para manter performance
    const dashboard = await apiService.getDashboard();
    
    const tickets = (dashboard.tickets || []).map(t => this.normalizarTicket(t));
    const os = (dashboard.ordensServico || []).map(o => this.normalizarOS(o));

    const lista = [...tickets, ...os];

    // Ordena pelo mais recente
    return lista.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  public normalizarTicket(t: any): AtendimentoFormatado {
    return {
      id: t.id,
      tipo: 'TICKET',
      protocolo: t.protocolo || String(t.id),
      titulo: t.assunto || "Atendimento",
      data: t.data_abertura || t.data,
      status: this.traduzirStatus(t.status),
      statusRaw: t.status,
      descricao: t.mensagem || t.assunto || "",
      podeInteragir: !['Fechado', 'Cancelado', 'F', 'C'].includes(t.status),
      id_contrato: t.id_contrato || t.contrato_id || null
    };
  }

  public normalizarOS(o: any): AtendimentoFormatado {
    return {
      id: o.id,
      tipo: 'VISITA',
      protocolo: String(o.protocolo || o.id),
      titulo: o.assunto || "Visita Técnica",
      data: o.data_abertura || o.data,
      status: this.traduzirStatus(o.status),
      statusRaw: o.status,
      descricao: o.mensagem || "",
      podeInteragir: false,
      id_contrato: o.id_contrato || o.contrato_id || null,
      dataAgendamento: o.data_agenda,
      tecnico: o.tecnico
    };
  }

  private traduzirStatus(status: string) {
    const s = String(status).toLowerCase();
    const mapa: any = {
      'aberto': { label: 'Aberto', color: 'blue' },
      'a': { label: 'Aberto', color: 'blue' },
      'em andamento': { label: 'Em Andamento', color: 'orange' },
      'p': { label: 'Em Andamento', color: 'orange' },
      'finalizado': { label: 'Finalizado', color: 'green' },
      'fechado': { label: 'Finalizado', color: 'green' },
      'f': { label: 'Finalizado', color: 'green' },
      'cancelado': { label: 'Cancelado', color: 'gray' },
      'c': { label: 'Cancelado', color: 'gray' }
    };
    return mapa[s] || { label: status || 'Em Análise', color: 'blue' };
  }
}

export const suporteService = new SuporteService();
