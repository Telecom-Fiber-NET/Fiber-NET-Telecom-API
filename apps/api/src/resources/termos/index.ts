import { QueryBase, QueryBody, ResponseBody } from '../base';
import { Termo, TermoAttrs } from './types';

const resourceName = "cliente_contrato_termo";

/**
 * Recurso para interagir com os Termos (cliente_contrato_termo) da API IXC.
 */
export class TermosResource extends QueryBase {
    /**
     * Lista/Filtra termos.
     */
    async listar(
        attr: { [K in TermoAttrs]?: string | number | boolean },
        oper: '>' | '<' | '=' | 'like' = '=',
        page: number = 1,
        sortAttr: TermoAttrs = 'id',
        sortorder: 'desc' | 'asc' = 'desc'
    ): Promise<Termo[]> {
        const key = Object.keys(attr)[0] as TermoAttrs;
        const value = attr[key];

        const query: QueryBody = {
            qtype: `${resourceName}.${key}`,
            query: String(value),
            oper,
            page: page.toString(),
            sortname: `${resourceName}.${String(sortAttr)}`,
            sortorder,
        };

        const response = await this.request<ResponseBody<Termo>>(resourceName, query);
        return response.registros || [];
    }

    /**
     * Cria um novo termo.
     */
    public async criar(payload: Partial<Termo>): Promise<{ id: number; message: string }> {
        return this.create<Partial<Termo>, any>(resourceName, payload);
    }

    /**
     * Atualiza um termo existente.
     */
    public async editar(id: number, payload: Partial<Termo>): Promise<{ id: number; message: string }> {
        return this.update<Partial<Termo>, any>(resourceName, id, payload);
    }

    /**
     * Remove um termo.
     */
    public async deletar(id: number): Promise<{ message: string }> {
        return this.remove<any>(resourceName, id);
    }
}
