import { ixcService, IxcService } from "../services/ixcService";
import { chatbotConversationStore } from "../chatbot/conversationStore";
import { calculateBlockedDays, classifyBlockedCustomer } from "./rules";
import { BlockedCustomerSummary, ReactivationRegistrationInput } from "./types";

export class ReactivationService {
  constructor(private readonly ixc: IxcService = ixcService) {}

  async listBlockedCustomers(): Promise<BlockedCustomerSummary[]> {
    const rows = await this.ixc.listarContratosBloqueados();
    return rows.map((row: any) => {
      const blockDate = row.data_bloqueio || row.data_bloqueio_confianca || row.data_suspensao || null;
      const blockedDays = calculateBlockedDays(blockDate);
      return {
        customerId: Number(row.id_cliente),
        contractId: Number(row.id),
        name: row.razao || row.cliente || row.nome_cliente || "Cliente",
        plan: row.descricao_plano || row.plano || row.contrato,
        blockDate,
        value: Number(row.valor || row.valor_plano || 0) || undefined,
        blockedDays,
        bucket: classifyBlockedCustomer(blockedDays),
        state: "BLOCKED",
      };
    });
  }

  async getCustomerReactivation(customerId: number): Promise<any> {
    const [customer, contracts, invoices, logins] = await Promise.all([
      this.ixc.buscarClientePorId(customerId),
      this.ixc.buscarContratosPorIdCliente(customerId),
      this.ixc.financeiroListar(customerId),
      this.ixc.loginsListar(customerId),
    ]);

    return { customer, contracts, invoices, logins };
  }

  async register(input: ReactivationRegistrationInput): Promise<{ success: true }> {
    await chatbotConversationStore.addEvent({ type: "reativacao_registrada", ...input });
    return { success: true };
  }
}

export const reactivationService = new ReactivationService();
