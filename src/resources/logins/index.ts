import { QueryBase, QueryBody } from "../base";
import { Login, LoginAttrs, LoginResponse } from "./types";

const resourceName = "radusuarios";

/**
 * Classe para gerenciar logins de conexão (radusuarios).
 */
export class Logins extends QueryBase {
    constructor(config: { token: string; baseUrl: string; }) {
        super(config);
    }

    /**
     * Lista/Filtra logins.
     */
    async listar(
        attr: { [K in LoginAttrs]?: string | number | boolean },
        oper: '>' | '<' | '=' | 'like' = '=',
        page: number = 1,
        sortAttr: LoginAttrs = 'id',
        sortorder: 'desc' | 'asc' = 'desc'
    ): Promise<Login[]> {
        const key = Object.keys(attr)[0] as LoginAttrs;
        const value = attr[key];

        const query: QueryBody = {
            qtype: `radusuarios.${key}`,
            query: String(value),
            oper,
            page: page.toString(),
            sortname: `radusuarios.${String(sortAttr)}`,
            sortorder,
        };

        const response = await this.request<LoginResponse>(resourceName, query);
        return response.registros || [];
    }

    /**
     * Limpa o MAC address de um login de conexão.
     */
    async limparMac(id: number): Promise<any> {
        return this.update(resourceName, id, { mac: '' });
    }

    /**
     * Desconecta a sessão de um usuário.
     */
    async desconectarSessao(id: number): Promise<any> {
        // Esta é uma rota especial no IXC
        return this.update(resourceName, id, { acao: 'desconectar' });
    }
    
    /**
     * Obtém um diagnóstico em tempo real do login.
     */
    async obterDiagnostico(id: number): Promise<Login> {
         // O diagnóstico geralmente é uma leitura (GET), mas no IXC pode ser um POST para o mesmo ID
        const response = await this.request<LoginResponse>(resourceName, {
            qtype: 'radusuarios.id',
            query: String(id),
            oper: '=',
            page: '1',
            sortname: 'radusuarios.id',
            sortorder: 'asc'
        });
        return response.registros[0];
    }
}
