import { EventEmitter } from 'events';
import { ixcLogger } from '../utils/logger';
import { monitorNetwork, checkBillingDueDates, getScheduledMaintenances } from '../integrations';

export class ProactiveMonitor extends EventEmitter {
  private interval: NodeJS.Timeout | null = null;
  private monitorRunning: boolean = false;

  constructor() {
    super();
    ixcLogger.info('ProactiveMonitor initialized');
  }

  start(): void {
    if (this.monitorRunning) {
      ixcLogger.warn('ProactiveMonitor is already running.');
      return;
    }

    this.monitorRunning = true;
    ixcLogger.info('ProactiveMonitor started.');

    // Monitorar problemas de rede
    setInterval(async () => {
      try {
        const issues = await monitorNetwork();
        for (const issue of issues) {
          this.emit(`alert:${issue.customerId}`, {
            id: crypto.randomUUID(),
            type: 'network_issue',
            priority: 'high',
            message: `Detectamos instabilidade na sua região. Nossos técnicos já estão trabalhando nisso. Previsão de normalização: ${issue.eta}`,
            actions: [
              { type: 'open_ticket', label: 'Abrir Chamado' },
              { type: 'view_status', label: 'Ver Status' },
            ],
          });
          ixcLogger.info('Emitted network issue alert', { customerId: issue.customerId });
        }
      } catch (error) {
        ixcLogger.error('Error monitoring network', { error: (error as Error).message });
      }
    }, 60000); // A cada minuto

    // Lembrete de vencimento de fatura
    setInterval(async () => {
      try {
        const dueBills = await checkBillingDueDates();
        for (const bill of dueBills) {
          this.emit(`alert:${bill.customerId}`, {
            id: crypto.randomUUID(),
            type: 'bill_reminder',
            priority: 'medium',
            message: `Sua fatura de R$ ${bill.amount} vence em ${bill.daysUntilDue} dias.`,
            actions: [
              { type: 'view_bill', label: 'Ver Fatura' },
              { type: 'pay_now', label: 'Pagar Agora' },
            ],
          });
          ixcLogger.info('Emitted bill reminder alert', { customerId: bill.customerId });
        }
      } catch (error) {
        ixcLogger.error('Error checking billing due dates', { error: (error as Error).message });
      }
    }, 3600000); // A cada hora

    // Manutenções programadas (exemplo)
    setInterval(async () => {
      try {
        const maintenances = await getScheduledMaintenances();
        for (const maintenance of maintenances) {
          this.emit(`alert:${maintenance.customerId}`, {
            id: crypto.randomUUID(),
            type: 'maintenance',
            priority: 'low',
            message: `Manutenção programada em sua região em ${maintenance.date}. Pode haver interrupção breve.`,
          });
          ixcLogger.info('Emitted scheduled maintenance alert', { customerId: maintenance.customerId });
        }
      } catch (error) {
        ixcLogger.error('Error getting scheduled maintenances', { error: (error as Error).message });
      }
    }, 12 * 3600000); // A cada 12 horas
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.monitorRunning = false;
    ixcLogger.info('ProactiveMonitor stopped.');
  }

  private async checkForAlerts(): Promise<void> {
    // This function is no longer needed as intervals are set directly in start()
    // It was part of the placeholder, but now the monitoring logic is directly within intervals.
  }
}