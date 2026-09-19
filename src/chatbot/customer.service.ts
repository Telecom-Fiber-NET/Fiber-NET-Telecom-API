import { ixcService, IxcService } from "../services/ixcService";
import { Contrato } from "../types/ixc.types";
import { ChatbotCustomer } from "./types";
import { normalizePhone } from "./utils";

export class ChatbotCustomerService {
  constructor(private readonly ixc: IxcService = ixcService) {}

  async findCustomerByPhone(phone: string): Promise<ChatbotCustomer | null> {
    const normalized = normalizePhone(phone);
    const clientes = await this.ixc.buscarClientesPorTelefone(normalized);
    const cliente = clientes[0];
    if (!cliente) return null;

    const [contracts, invoices, logins] = await Promise.all([
      this.ixc.buscarContratosPorIdCliente(cliente.id),
      this.ixc.financeiroListar(cliente.id),
      this.ixc.loginsListar(cliente.id),
    ]);

    const activeContract = this.selectActiveContract(contracts);
    return {
      id: Number(cliente.id),
      name: cliente.razao || cliente.fantasia,
      phone: cliente.celular || cliente.fone_comercial,
      contracts,
      activeContract,
      plan: activeContract?.descricao_plano || activeContract?.descricao_aux_plano_venda,
      status: cliente.status,
      invoices,
      logins,
    };
  }

  private selectActiveContract(contracts: Contrato[]): Contrato | undefined {
    return contracts.find((contract) => contract.status === "A") || contracts[0];
  }
}

export const chatbotCustomerService = new ChatbotCustomerService();
