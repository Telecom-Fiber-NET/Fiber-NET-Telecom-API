import { QueryBase, QueryBody } from "../base";
import { Cliente, ClienteAttrs, ClienteResponse } from "./types";

const resourceName = "cliente";

/**
 * Classe para gerenciar clientes
 */
export class Clientes extends QueryBase {
    constructor(config: { token: string; baseUrl: string; }) {
        super(config);
    }
    
    /**
     * Filtra clientes com base nos atributos fornecidos.
     */
    async filtrarClientes(
        attr: { [K in ClienteAttrs]?: string | number | boolean },
        oper: '>' | '<' | '=' | 'like' = '=',  
        page: number = 1,  
        sortAttr: ClienteAttrs = 'cnpj_cpf',  
        sortorder: 'desc' | 'asc' = 'desc'
    ): Promise<Cliente[]> {

        const key = Object.keys(attr)[0] as ClienteAttrs;
        const value = attr[key];

        const response = await this.request<{ registros: Cliente[] }>(resourceName, {
            qtype: `cliente.${key}`,
            query: value as string,
            oper: oper,
            page: page.toString(),
            sortname: `cliente.${sortAttr}`,
            sortorder: sortorder,
        });

        return response.registros;
    }

    /**
     * Busca clientes com base em um CPF/CNPJ.
     */
    async buscarClientesPorCpfCnpj(cpfCnpj: string): Promise<Cliente | null> {
        const query: QueryBody = {
            qtype: 'cliente.cnpj_cpf',
            query: cpfCnpj,
            oper: '=',
            page: '1',
            sortname: 'cliente.cnpj_cpf',
            sortorder: 'asc'
        }

        const response = await this.request<ClienteResponse>(resourceName, query);
        return response.registros[0] || null;
    }

    /**
     * Busca um cliente pelo seu id.
     */
    async buscarClientesPorId(id: number): Promise<Cliente> {
        const query: QueryBody = {
            qtype: 'cliente.id',
            query: id.toString(),
            oper: '=',
            page: '1',
            sortname: 'cliente.id',
            sortorder: 'asc'
        }

        const cliente = await this.request<ClienteResponse>(resourceName, query);
        return cliente.registros[0];
    }

    /**
     * Altera a senha do hotsite (Área do Cliente) para um cliente.
     * @param id - O ID do cliente.
     * @param novaSenha - A nova senha em texto plano.
     */
    async alterarSenhaHotsite(id: number, novaSenha: string): Promise<any> {
        return this.update(resourceName, id, { senha: novaSenha });
    }
}
