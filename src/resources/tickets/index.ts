import { QueryBase } from '../base';
import { TicketCreatePayload, TicketCreateResponse } from './types';

/**
 * Recurso para interagir com os Tickets (su_ticket) da API IXC.
 */
export class TicketsResource extends QueryBase {
    private resourceName = "su_ticket";

    /**
     * Cria um novo ticket de suporte.
     * @param payload Os dados para a criação do ticket.
     * @returns A resposta da API após a criação do ticket.
     */
    public async criarTicket(payload: TicketCreatePayload): Promise<TicketCreateResponse> {
        const response = await this.create<TicketCreatePayload, any>(this.resourceName, payload);
        // Assumindo que a API retorna o ID do ticket criado diretamente ou em um campo 'id'
        return { id: response.id || response.registros?.[0]?.id || response.retorno_id };
    }
}
