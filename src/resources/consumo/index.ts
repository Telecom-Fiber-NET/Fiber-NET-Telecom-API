import { QueryBase, QueryBody } from '../base';
import { ConsumoDiario, ConsumoMensal, ConsumoGeral, ConsumoHistory, Consumo } from './types';
import { Login } from '../logins/types'; // Import Login type

/**
 * Recurso para interagir com os dados de consumo de internet (radusuarios) da API IXC.
 */
export class ConsumoResource extends QueryBase {
    private resourceName = "radusuarios"; // Base para radusuarios_consumo_d, _m, etc.

    /**
     * Busca o consumo diário para um login específico.
     * @param loginId ID do login (radusuario)
     * @param page Página da requisição (string)
     * @param rp Resultados por página (string)
     * @returns Lista de ConsumoDiario
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
        const response = await this.request<any>(`${this.resourceName}_consumo_d`, query);
        // Assumindo que a API retorna um array de objetos com download_bytes, upload_bytes e data
        return response.registros.map((registro: any) => ({
            data: registro.data,
            download_bytes: parseFloat(registro.download_bytes),
            upload_bytes: parseFloat(registro.upload_bytes),
        }));
    }

    /**
     * Busca o consumo mensal para um login específico.
     * @param loginId ID do login (radusuario)
     * @param page Página da requisição (string)
     * @param rp Resultados por página (string)
     * @returns Lista de ConsumoMensal
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
        const response = await this.request<any>(`${this.resourceName}_consumo_m`, query);
        // Assumindo que a API retorna um array de objetos com download_bytes, upload_bytes e mes_ano
        return response.registros.map((registro: any) => ({
            mes_ano: registro.mes_ano,
            download_bytes: parseFloat(registro.download_bytes),
            upload_bytes: parseFloat(registro.upload_bytes),
        }));
    }

    /**
     * Agrega todos os dados de consumo para um login específico.
     * @param loginData Objeto Login contendo id, upload_atual e download_atual.
     * @returns Objeto Consumo completo
     */
    public async getConsumoCompleto(loginData: Login): Promise<Consumo> {
        const [diario, mensal] = await Promise.all([
            this.buscarConsumoDiario(loginData.id),
            this.buscarConsumoMensal(loginData.id),
        ]);

        const history: ConsumoHistory = {
            daily: diario,
            monthly: mensal,
        };

        return {
            total_download_bytes: parseFloat(loginData.download_atual || '0'),
            total_upload_bytes: parseFloat(loginData.upload_atual || '0'),
            history: history,
        };
    }
}
