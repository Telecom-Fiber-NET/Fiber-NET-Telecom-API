import { QueryBase, QueryBody, ResponseBody } from '../base';
import { Nota, NotaAttrs, NotaImprimirResponse } from './types';

const resourceName = "vd_saida";

/**
 * Recurso para interagir com as Notas Fiscais (vd_saida) da API IXC.
 */
export class NotasResource extends QueryBase {
    /**
     * Lista/Filtra notas fiscais.
     */
    async listar(
        attr: { [K in NotaAttrs]?: string | number | boolean },
        oper: '>' | '<' | '=' | 'like' = '=',
        page: number = 1,
        sortAttr: NotaAttrs = 'id',
        sortorder: 'desc' | 'asc' = 'desc'
    ): Promise<Nota[]> {
        const key = Object.keys(attr)[0] as NotaAttrs;
        const value = attr[key];

        const query: QueryBody = {
            qtype: `${resourceName}.${key}`,
            query: String(value),
            oper,
            page: page.toString(),
            sortname: `${resourceName}.${String(sortAttr)}`,
            sortorder,
        };

        const response = await this.request<ResponseBody<Nota>>(resourceName, query);
        return response.registros || [];
    }

    /**
     * Cria uma nova nota fiscal.
     */
    public async criar(payload: Partial<Nota>): Promise<{ id: number; message: string }> {
        return this.create<Partial<Nota>, any>(resourceName, payload);
    }

    /**
     * Atualiza uma nota fiscal existente.
     */
    public async editar(id: number, payload: Partial<Nota>): Promise<{ id: number; message: string }> {
        return this.update<Partial<Nota>, any>(resourceName, id, payload);
    }

    /**
     * Remove uma nota fiscal.
     */
    public async deletar(id: number): Promise<{ message: string }> {
        return this.remove<any>(resourceName, id);
    }

    /**
     * Imprime uma nota fiscal.
     */
    public async imprimir(id: number): Promise<NotaImprimirResponse> {
        const query: QueryBody = {
            qtype: 'id',
            query: id.toString(),
            oper: '=',
            page: '1',
            rp: '1',
            sortname: 'id',
            sortorder: 'desc',
            base64: 'S',
        } as any;

        const response = await this.request<any>('imprimir_nota', query);
        return { base64_document: response.base64_document || response.registros?.[0]?.base64_document || response.conteudo_base64 || response.conteudo };
    }
}
