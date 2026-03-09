import { QueryBase, QueryBody, ResponseBody } from '../base';
import { Consumo, ConsumoAttrs, ConsumoDiario, ConsumoMensal } from './types';

const resourceName = "radusuarios_consumo";

/**
 * Recurso para interagir com o Consumo (radusuarios_consumo) da API IXC.
 */
export class ConsumoResource extends QueryBase {
    /**
     * Lista/Filtra consumos.
     */
    async listar(
        attr: { [K in ConsumoAttrs]?: string | number | boolean },
        oper: '>' | '<' | '=' | 'like' = '=',
        page: number = 1,
        sortAttr: ConsumoAttrs = 'id',
        sortorder: 'desc' | 'asc' = 'desc'
    ): Promise<Consumo[]> {
        const key = Object.keys(attr)[0] as ConsumoAttrs;
        const value = attr[key];

        const query: QueryBody = {
            qtype: `${resourceName}.${key}`,
            query: String(value),
            oper,
            page: page.toString(),
            sortname: `${resourceName}.${String(sortAttr)}`,
            sortorder,
        };

        const response = await this.request<ResponseBody<Consumo>>(resourceName, query);
        return response.registros || [];
    }

    /**
     * Cria um novo registro de consumo.
     */
    public async criar(payload: Partial<Consumo>): Promise<{ id: number; message: string }> {
        return this.create<Partial<Consumo>, any>(resourceName, payload);
    }

    /**
     * Atualiza um registro de consumo existente.
     */
    public async editar(id: number, payload: Partial<Consumo>): Promise<{ id: number; message: string }> {
        return this.update<Partial<Consumo>, any>(resourceName, id, payload);
    }

    /**
     * Remove um registro de consumo.
     */
    public async deletar(id: number): Promise<{ message: string }> {
        return this.remove<any>(resourceName, id);
    }

    /**
     * Busca o consumo diário para um login específico.
     */
    public async buscarConsumoDiario(loginId: number, page: string = '1', rp: string = '100'): Promise<ConsumoDiario[]> {
        const query: QueryBody = {
            qtype: 'radusuarios.id',
            query: loginId.toString(),
            oper: '=',
            page: page,
            rp: rp,
            sortname: 'data',
            sortorder: 'desc',
        };
        const response = await this.request<any>(`radusuarios_consumo_d`, query);
        return response.registros.map((registro: any) => ({
            data: registro.data,
            download_bytes: parseFloat(registro.download_bytes),
            upload_bytes: parseFloat(registro.upload_bytes),
        }));
    }

    /**
     * Busca o consumo mensal para um login específico.
     */
    public async buscarConsumoMensal(loginId: number, page: string = '1', rp: string = '100'): Promise<ConsumoMensal[]> {
        const query: QueryBody = {
            qtype: 'radusuarios.id',
            query: loginId.toString(),
            oper: '=',
            page: page,
            rp: rp,
            sortname: 'mes_ano',
            sortorder: 'desc',
        };
        const response = await this.request<any>(`radusuarios_consumo_m`, query);
        return response.registros.map((registro: any) => ({
            mes_ano: registro.mes_ano,
            download_bytes: parseFloat(registro.download_bytes),
            upload_bytes: parseFloat(registro.upload_bytes),
        }));
    }
}
