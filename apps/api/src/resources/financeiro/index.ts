import { QueryBase, QueryBody } from "../base";
import { Financeiro, FinanceiroAttrs, FinanceiroResponse } from "./types";

const resourceName = "fn_areceber";

/**
 * Classe para gerenciar o financeiro (contas a receber).
 */
export class Financeiros extends QueryBase {
    constructor(config: { token: string; baseUrl: string; }) {
        super(config);
    }

    /**
     * Lista/Filtra registros financeiros.
     */
    async listar(
        attr: { [K in FinanceiroAttrs]?: string | number | boolean },
        oper: '>' | '<' | '=' | 'like' = '=',
        page: number = 1,
        sortAttr: FinanceiroAttrs = 'id',
        sortorder: 'desc' | 'asc' = 'desc'
    ): Promise<Financeiro[]> {
        const key = Object.keys(attr)[0] as FinanceiroAttrs;
        const value = attr[key];

        const query: QueryBody = {
            qtype: `fn_areceber.${key}`,
            query: String(value),
            oper,
            page: page.toString(),
            sortname: `fn_areceber.${String(sortAttr)}`,
            sortorder,
        };

        const response = await this.request<FinanceiroResponse>(resourceName, query);
        return response.registros || [];
    }

    /**
     * Cria um novo registro financeiro.
     */
    async criar(data: Partial<Financeiro>): Promise<{ id: number; message: string }> {
        return this.create<Partial<Financeiro>, any>(resourceName, data);
    }

    /**
     * Atualiza um registro financeiro existente.
     */
    async editar(id: number, data: Partial<Financeiro>): Promise<{ id: number; message: string }> {
        return this.update<Partial<Financeiro>, any>(resourceName, id, data);
    }

    /**
     * Remove um registro financeiro.
     */
    async deletar(id: number): Promise<{ message: string }> {
        return this.remove<any>(resourceName, id);
    }

    /**
     * Obtém o link do Pix para um registro financeiro.
     */
    async getPix(id_areceber: number): Promise<{ pix_code: string; pix_image: string }> {
        return this.performRequest<{ pix_code: string; pix_image: string }>(`${resourceName}/get_pix`, {
            method: 'POST',
            headers: this.commonHeaders,
            body: JSON.stringify({ id_areceber }),
        });
    }
}
