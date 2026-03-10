import { QueryBase, QueryBody, ResponseBody } from '../base';
import { Ticket, TicketAttrs } from './types';

const resourceName = "su_ticket";

/**
 * Recurso para interagir com os Tickets (su_ticket) da API IXC.
 */
export class TicketsResource extends QueryBase {
    /**
     * Lista/Filtra tickets.
     */
    async listar(
        attr: { [K in TicketAttrs]?: string | number | boolean },
        oper: '>' | '<' | '=' | 'like' = '=',
        page: number = 1,
        sortAttr: TicketAttrs = 'id',
        sortorder: 'desc' | 'asc' = 'desc'
    ): Promise<Ticket[]> {
        const key = Object.keys(attr)[0] as TicketAttrs;
        const value = attr[key];

        const query: QueryBody = {
            qtype: `${resourceName}.${key}`,
            query: String(value),
            oper,
            page: page.toString(),
            sortname: `${resourceName}.${String(sortAttr)}`,
            sortorder,
        };

        const response = await this.request<ResponseBody<Ticket>>(resourceName, query);
        return response.registros || [];
    }

    /**
     * Cria um novo ticket de suporte.
     */
    public async criar(payload: Partial<Ticket>): Promise<{ id: number; message: string }> {
        return this.create<Partial<Ticket>, any>(resourceName, payload);
    }

    /**
     * Atualiza um ticket existente.
     */
    public async editar(id: number, payload: Partial<Ticket>): Promise<{ id: number; message: string }> {
        return this.update<Partial<Ticket>, any>(resourceName, id, payload);
    }

    /**
     * Remove um ticket.
     */
    public async deletar(id: number): Promise<{ message: string }> {
        return this.remove<any>(resourceName, id);
    }
}
