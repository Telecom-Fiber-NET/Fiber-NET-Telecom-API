import { QueryBase, QueryBody, ResponseBody } from '../base';
import { Login, LoginAttrs } from './types';

const resourceName = "radusuarios";

/**
 * Recurso para interagir com os Logins (radusuarios) da API IXC.
 */
export class LoginsResource extends QueryBase {
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
            qtype: `${resourceName}.${key}`,
            query: String(value),
            oper,
            page: page.toString(),
            sortname: `${resourceName}.${String(sortAttr)}`,
            sortorder,
        };

        const response = await this.request<ResponseBody<Login>>(resourceName, query);
        return response.registros || [];
    }

    /**
     * Cria um novo login.
     */
    public async criar(payload: Partial<Login>): Promise<{ id: number; message: string }> {
        return this.create<Partial<Login>, any>(resourceName, payload);
    }

    /**
     * Atualiza um login existente.
     */
    public async editar(id: number, payload: Partial<Login>): Promise<{ id: number; message: string }> {
        return this.update<Partial<Login>, any>(resourceName, id, payload);
    }

    /**
     * Remove um login.
     */
    public async deletar(id: number): Promise<{ message: string }> {
        return this.remove<any>(resourceName, id);
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
        return this.update(resourceName, id, { acao: 'desconectar' });
    }
}
