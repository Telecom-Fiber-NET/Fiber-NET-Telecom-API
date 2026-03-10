import { QueryBase, QueryBody, ResponseBody } from '../base';
import { OrdemServico, OrdemServicoAttrs } from './types';

const resourceName = "su_oss_chamado";

/**
 * Recurso para interagir com as Ordens de Serviço (su_oss_chamado) da API IXC.
 */
export class OrdensServicoResource extends QueryBase {
    /**
     * Lista/Filtra ordens de serviço.
     */
    async listar(
        attr: { [K in OrdemServicoAttrs]?: string | number | boolean },
        oper: '>' | '<' | '=' | 'like' = '=',
        page: number = 1,
        sortAttr: OrdemServicoAttrs = 'id',
        sortorder: 'desc' | 'asc' = 'desc'
    ): Promise<OrdemServico[]> {
        const key = Object.keys(attr)[0] as OrdemServicoAttrs;
        const value = attr[key];

        const query: QueryBody = {
            qtype: `${resourceName}.${key}`,
            query: String(value),
            oper,
            page: page.toString(),
            sortname: `${resourceName}.${String(sortAttr)}`,
            sortorder,
        };

        const response = await this.request<ResponseBody<OrdemServico>>(resourceName, query);
        return response.registros || [];
    }

    /**
     * Cria uma nova ordem de serviço.
     */
    public async criar(payload: Partial<OrdemServico>): Promise<{ id: number; message: string }> {
        return this.create<Partial<OrdemServico>, any>(resourceName, payload);
    }

    /**
     * Atualiza uma ordem de serviço existente.
     */
    public async editar(id: number, payload: Partial<OrdemServico>): Promise<{ id: number; message: string }> {
        return this.update<Partial<OrdemServico>, any>(resourceName, id, payload);
    }

    /**
     * Remove uma ordem de serviço.
     */
    public async deletar(id: number): Promise<{ message: string }> {
        return this.remove<any>(resourceName, id);
    }

    /**
     * Gera o protocolo de uma ordem de serviço.
     */
    public async gerarProtocolo(id: number): Promise<{ protocolo: string }> {
        return this.performRequest<{ protocolo: string }>(`${resourceName}/gerar_protocolo_ordem_servico`, {
            method: 'POST',
            headers: this.commonHeaders,
            body: JSON.stringify({ id }),
        });
    }
}
