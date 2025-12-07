import { QueryBase, QueryBody } from "../base";
import { Contrato, ContratoAttrs, ContratoResponse } from "./types";

const resourceName = "cliente_contrato";


/**
 * Classe para gerenciar contratos.
 */
export class Contratos extends QueryBase {

    constructor(config: { token: string; baseUrl: string; }) {
        super(config);
    }

    /**
     * Filtra contratos com base em um atributo.
     */
    async filtrarContratos(
        attr: { [K in ContratoAttrs]?: string | number | boolean },
        oper: '>' | '<' | '=' | 'like' = '=',  
        page: number = 1,  
        sortAttr: ContratoAttrs = 'id_cliente',  
        sortorder: 'desc' | 'asc' = 'desc'
    ): Promise<Contrato[]> {

        const key = Object.keys(attr)[0] as ContratoAttrs;
        const value = attr[key];

        const response = await this.request<{ registros: Contrato[] }>(resourceName, {
            qtype: `contrato.${key}`,
            query: value as string,
            oper: oper,
            page: page.toString(),
            sortname: `contrato.${sortAttr as string}`,
            sortorder: sortorder
        });

        return response.registros;
    }

    /**
     * Busca um contrato pelo seu id.
     */
    async buscarContratosPorId(id: number): Promise<Contrato> {
        const query: QueryBody = {
            qtype: 'cliente_contrato.id',
            query: id.toString(),
            oper: '=',
            page: '1',
            sortname: 'cliente_contrato.id',
            sortorder: 'asc',
        };

        const response = await this.request<ContratoResponse>('v1/cliente_contrato', query);
        return response.registros[0];
    }

    /**
     * Busca contratos por id de cliente.
     */
    async buscarContratosPorIdCliente(id: number): Promise<Contrato[]> {
        const query: QueryBody = {
            qtype: 'cliente_contrato.id_cliente',
            query: id.toString(),
            oper: '=',
            page: '1',
            sortname: 'cliente_contrato.id',
            sortorder: 'asc'
        }

        const contratos = await this.request<ContratoResponse>(resourceName, query);

        if (!contratos || !contratos.registros || contratos.registros.length === 0) {
            return [];
        };

        return contratos.registros;
    }

    /**
     * Solicita o desbloqueio de confiança para um contrato.
     * @param id - O ID do contrato.
     */
    async desbloqueioConfianca(id: number): Promise<any> {
        // A API IXC para desbloqueio geralmente envolve um PUT com um campo específico.
        // Simulando a atualização do campo `desbloqueio_confianca` para 'S'.
        return this.update(resourceName, id, { desbloqueio_confianca: 'S' });
    }
}