import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService, ReportFilterDto } from './reports.service';

@ApiTags('Relatórios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('clients')
  @ApiOperation({ summary: 'Relatório de Clientes (inclui Número do Contrato)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'rp', required: false })
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'qtype', required: false })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'csv'] })
  async getClientsReport(@Query() query: ReportFilterDto, @Res({ passthrough: true }) res: Response) {
    if (query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="relatorio-clientes.csv"');
    }
    return this.reportsService.getClientsReport(query);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Relatório Financeiro / Inadimplência (inclui Número do Contrato)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'rp', required: false })
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'qtype', required: false })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'csv'] })
  async getInvoicesReport(@Query() query: ReportFilterDto, @Res({ passthrough: true }) res: Response) {
    if (query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="relatorio-inadimplencia.csv"');
    }
    return this.reportsService.getInvoicesReport(query);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Relatório de Chamados / Suporte (OS) (inclui Número do Contrato)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'rp', required: false })
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'qtype', required: false })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'csv'] })
  async getTicketsReport(@Query() query: ReportFilterDto, @Res({ passthrough: true }) res: Response) {
    if (query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="relatorio-chamados.csv"');
    }
    return this.reportsService.getTicketsReport(query);
  }
}
