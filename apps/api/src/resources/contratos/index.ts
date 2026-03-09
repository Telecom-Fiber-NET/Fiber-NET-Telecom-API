import { QueryBase, QueryBody, ResponseBody } from '../base';
import { Contrato, ContratoAttrs } from './types';

const resourceName = "cliente_contrato";

/**
 * Recurso para interagir com os Contratos (cliente_contrato) da API IXC.
 */
export class ContratosResource extends QueryBase {
    /**
     * Lista/Filtra contratos.
     */
    async listar(
        attr: { [K in ContratoAttrs]?: string | number | boolean },
        oper: '>' | '<' | '=' | 'like' = '=',
        page: number = 1,
        sortAttr: ContratoAttrs = 'id',
        sortorder: 'desc' | 'asc' = 'desc'
    ): Promise<Contrato[]> {
        const key = Object.keys(attr)[0] as ContratoAttrs;
        const value = attr[key];

        const query: QueryBody = {
            qtype: `${resourceName}.${key}`,
            query: String(value),
            oper,
            page: page.toString(),
            sortname: `${resourceName}.${String(sortAttr)}`,
            sortorder,
        };

        const response = await this.request<ResponseBody<Contrato>>(resourceName, query);
        return response.registros || [];
    }

    /**
     * Cria um novo contrato.
     */
    public async criar(payload: Partial<Contrato>): Promise<{ id: number; message: string }> {
        return this.create<Partial<Contrato>, any>(resourceName, payload);
    }

    /**
     * Atualiza um contrato existente.
     */
    public async editar(id: number, payload: Partial<Contrato>): Promise<{ id: number; message: string }> {
        return this.update<Partial<Contrato>, any>(resourceName, id, payload);
    }

    /**
     * Remove um contrato.
     */
    public async deletar(id: number): Promise<{ message: string }> {
        return this.remove<any>(resourceName, id);
    }

    /**
     * Solicita o desbloqueio de confiança para um contrato.
     */
    async desbloqueioConfianca(id: number): Promise<any> {
        return this.update(resourceName, id, { desbloqueio_confianca: 'S' });
    }
}

// Export default para compatibilidade com testes
export default ContratosResource;
