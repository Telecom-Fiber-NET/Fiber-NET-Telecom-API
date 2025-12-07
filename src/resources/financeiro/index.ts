import { QueryBase, QueryBody } from "../base";
import { Financeiro, FinanceiroAttrs, FinanceiroResponse } from "./types";

const resourceName = "fn_areceber";

/**
 * Classe para gerenciar o financeiro (contas a receber).
 */
// FIX: Renamed class to 'Financeiros' (plural) to follow the convention of other resource classes 
// (e.g., Clientes, Contratos) and to resolve the naming conflict with the 'Financeiro' type import.
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
}