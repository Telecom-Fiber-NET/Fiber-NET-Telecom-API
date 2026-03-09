
import { ixcService } from "./ixcService";

export interface AtendimentoFormatado {
  id: number;
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
  id_contrato: number | null;
  dataAgendamento?: string;
  tecnico?: string;
}

export class SuporteService {
  /**
   * Consolida OS e Tickets em uma única lista
   */
  async listarAtendimentos(idCliente: number, idContrato?: number): Promise<AtendimentoFormatado[]> {
    const [tickets, os] = await Promise.all([
      ixcService.ticketsListar(idCliente, idContrato),
      ixcService.ordensServicoListar(idCliente, idContrato)
    ]);

    const lista = [
      ...tickets.map(t => this.normalizarTicket(t)),
      ...os.map(o => this.normalizarOS(o))
    ];

    return lista.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  private normalizarTicket(t: any): AtendimentoFormatado {
    return {
      id: parseInt(t.id),
      tipo: 'TICKET',
      protocolo: t.protocolo || String(t.id),
      titulo: t.assunto_nome || t.titulo || "Atendimento",
      data: t.data_abertura || t.data,
      status: this.traduzirStatus(t.status),
      statusRaw: t.status,
      descricao: t.menssagem || t.assunto || "",
      podeInteragir: !['F', 'C'].includes(t.status),
      id_contrato: t.id_contrato ? parseInt(t.id_contrato) : null
    };
  }

  private normalizarOS(o: any): AtendimentoFormatado {
    return {
      id: parseInt(o.id),
      tipo: 'VISITA',
      protocolo: String(o.id),
      titulo: o.assunto_nome || "Visita Técnica",
      data: o.data_abertura || o.data,
      status: this.traduzirStatus(o.status),
      statusRaw: o.status,
      descricao: o.problema_relatado || o.observacao || "",
      podeInteragir: false,
      id_contrato: o.id_contrato ? parseInt(o.id_contrato) : null,
      dataAgendamento: o.data_agenda,
      tecnico: o.tecnico_nome
    };
  }

  private traduzirStatus(status: string) {
    const mapa: any = {
      'A': { label: 'Aberto', color: 'blue' },
      'P': { label: 'Em Andamento', color: 'orange' },
      'F': { label: 'Finalizado', color: 'green' },
      'C': { label: 'Cancelado', color: 'gray' },
      'EN': { label: 'Encaminhado', color: 'purple' },
      'S': { label: 'Em Análise', color: 'blue' }
    };
    return mapa[status] || { label: 'Pendente', color: 'gray' };
  }
}

export const suporteService = new SuporteService();
