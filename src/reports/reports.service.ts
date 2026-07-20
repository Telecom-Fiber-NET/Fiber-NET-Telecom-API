import { Injectable, Logger } from '@nestjs/common';
import { IxcService } from '../ixc/ixc.service';

export interface ReportFilterDto {
  page?: string;
  rp?: string;
  query?: string;
  qtype?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  format?: 'json' | 'csv';
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly ixcService: IxcService) {}

  /**
   * Relatório de Clientes com Número do Contrato
   */
  async getClientsReport(filter: ReportFilterDto) {
    const rawClients = await this.ixcService.getClients({
      page: filter.page || '1',
      rp: filter.rp || '100',
      query: filter.query,
      qtype: filter.qtype || 'razao',
    });

    const clientsList = Array.isArray(rawClients?.registros) ? rawClients.registros : [];
    const clientIds = clientsList.map((c: any) => String(c.id)).filter(Boolean);

    let contractsMap: Record<string, string[]> = {};
    if (clientIds.length > 0) {
      try {
        const rawContracts = await this.ixcService.getContracts({
          page: '1',
          rp: '1000',
          query: clientIds.join(','),
          qtype: 'id_cliente',
        });
        const contractsList = Array.isArray(rawContracts?.registros) ? rawContracts.registros : [];
        for (const c of contractsList) {
          const cid = String(c.id_cliente);
          if (!contractsMap[cid]) contractsMap[cid] = [];
          contractsMap[cid].push(String(c.id || c.contrato));
        }
      } catch (err) {
        this.logger.warn(`Falha ao buscar contratos dos clientes: ${err.message}`);
      }
    }

    const rows = clientsList.map((c: any) => {
      const contrs = contractsMap[String(c.id)] || [];
      return {
        id_cliente: c.id,
        id_contrato: contrs.join(', ') || 'N/A',
        contratos: contrs,
        razao: c.razao,
        cnpj_cpf: c.cnpj_cpf,
        telefone: c.fone || c.celular || 'N/A',
        email: c.email || 'N/A',
        ativo: c.ativo === 'S' ? 'Sim' : 'Não',
        data_cadastro: c.data_cadastro || 'N/A',
      };
    });

    if (filter.format === 'csv') {
      return this.convertToCsv(rows);
    }

    return {
      total: rawClients?.total || rows.length,
      page: Number(filter.page || 1),
      rp: Number(filter.rp || 100),
      registros: rows,
    };
  }

  /**
   * Relatório de Inadimplência / Financeiro com Número do Contrato
   */
  async getInvoicesReport(filter: ReportFilterDto) {
    const rawInvoices = await this.ixcService.getInvoices({
      page: filter.page || '1',
      rp: filter.rp || '100',
      query: filter.query,
      qtype: filter.qtype || 'status',
    });

    const invoicesList = Array.isArray(rawInvoices?.registros) ? rawInvoices.registros : [];

    const rows = invoicesList.map((inv: any) => ({
      id_fatura: inv.id,
      id_cliente: inv.id_cliente,
      id_contrato: inv.id_contrato || inv.id_cliente_contrato || 'N/A',
      cliente_nome: inv.bilhetagem_nome || inv.nome_cliente || inv.razao || 'N/A',
      nosso_numero: inv.nosso_numero || 'N/A',
      valor: parseFloat(inv.valor || '0'),
      data_vencimento: inv.data_vencimento || 'N/A',
      status: inv.status || 'P',
      dias_atraso: inv.data_vencimento
        ? Math.max(0, Math.floor((Date.now() - new Date(inv.data_vencimento).getTime()) / (1000 * 60 * 60 * 24)))
        : 0,
    }));

    if (filter.format === 'csv') {
      return this.convertToCsv(rows);
    }

    return {
      total: rawInvoices?.total || rows.length,
      page: Number(filter.page || 1),
      rp: Number(filter.rp || 100),
      registros: rows,
    };
  }

  /**
   * Relatório de Chamados / Suporte (OS) com Número do Contrato
   */
  async getTicketsReport(filter: ReportFilterDto) {
    const rawTickets = await this.ixcService.getTickets({
      page: filter.page || '1',
      rp: filter.rp || '100',
      query: filter.query,
      qtype: filter.qtype || 'status',
    });

    const ticketsList = Array.isArray(rawTickets?.registros) ? rawTickets.registros : [];

    const rows = ticketsList.map((t: any) => ({
      id_os: t.id,
      id_cliente: t.id_cliente,
      id_contrato: t.id_contrato || t.id_cliente_contrato || 'N/A',
      protocolo: t.protocolo || 'N/A',
      assunto: t.assunto || 'N/A',
      status: t.status || 'N/A',
      prioridade: t.prioridade || 'N/A',
      data_abertura: t.data_abertura || 'N/A',
    }));

    if (filter.format === 'csv') {
      return this.convertToCsv(rows);
    }

    return {
      total: rawTickets?.total || rows.length,
      page: Number(filter.page || 1),
      rp: Number(filter.rp || 100),
      registros: rows,
    };
  }

  private convertToCsv(data: any[]): string {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map((key) => {
        const escaped = ('' + (row[key] ?? '')).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}
