import { QueryBase, QueryBody } from '../base';
import { OntInfo } from './types';

/**
 * Recurso para interagir com as informações da ONT (radpop_radio_cliente_fibra) da API IXC.
 */
export class OntResource extends QueryBase {
    private resourceName = "radpop_radio_cliente_fibra";

    /**
     * Lista informações da ONT para um login específico.
     * @param idLogin ID do login.
     * @param page Página da requisição (string).
     * @param rp Resultados por página (string).
     * @param sortname Campo para ordenação.
     * @param sortorder Ordem de classificação ('asc' ou 'desc').
     * @returns Lista de informações da ONT.
     */
    public async listarOntInfo(
        idLogin: number,
        page: string = '1',
        rp: string = '1000',
        sortname: string = 'radpop_radio_cliente_fibra.id',
        sortorder: 'asc' | 'desc' = 'desc'
    ): Promise<OntInfo[]> {
        const query: QueryBody = {
            qtype: 'id_login',
            query: idLogin.toString(),
            oper: '=',
            page: page,
            rp: rp,
            sortname: sortname,
            sortorder: sortorder,
        };
        const response = await this.request<any>(this.resourceName, query);
        return response.registros.map((registro: any) => ({
            id: registro.id,
            id_login: registro.id_login,
            serial_number: registro.serial_number, // Assumindo que existe este campo
            modelo: registro.modelo, // Assumindo que existe este campo
            status: registro.status, // Assumindo que existe este campo
            sinal_rx: registro.sinal_rx, // Assumindo que existe este campo
            sinal_tx: registro.sinal_tx, // Assumindo que existe este campo
            potencia_ont: registro.potencia_ont, // Assumindo que existe este campo
            ultima_atualizacao: registro.ultima_atualizacao,
            // Mapeie outros campos relevantes aqui
        }));
    }
}
