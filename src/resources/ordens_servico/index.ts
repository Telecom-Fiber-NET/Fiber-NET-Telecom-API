import { QueryBase, QueryBody } from '../base';
import { OrdemServico } from './types';

/**
 * Recurso para interagir com as Ordens de Serviço (su_oss_chamado) da API IXC.
 */
export class OrdensServicoResource extends QueryBase {
    private resourceName = "su_oss_chamado";

    /**
     * Lista ordens de serviço para um cliente específico.
     * @param idCliente ID do cliente.
     * @param page Página da requisição (string).
     * @param rp Resultados por página (string).
     * @param sortname Campo para ordenação.
     * @param sortorder Ordem de classificação ('asc' ou 'desc').
     * @returns Lista de Ordens de Serviço.
     */
    public async listarOrdensServico(
        idCliente: number,
        page: string = '1',
        rp: string = '1000',
        sortname: string = 'su_oss_chamado.id',
        sortorder: 'asc' | 'desc' = 'desc'
    ): Promise<OrdemServico[]> {
        const query: QueryBody = {
            qtype: 'id_cliente',
            query: idCliente.toString(),
            oper: '=',
            page: page,
            rp: rp,
            sortname: sortname,
            sortorder: sortorder,
        };
        const response = await this.request<any>(this.resourceName, query);
        return response.registros.map((registro: any) => ({
            id: registro.id,
            tipo: registro.tipo,
            id_filial: registro.id_filial,
            status: registro.status,
            id_cliente: registro.id_cliente,
            id_assunto: registro.id_assunto,
            mensagem: registro.mensagem,
            protocolo: registro.protocolo,
            data_abertura: registro.data_abertura,
            data_inicio: registro.data_inicio,
            data_final: registro.data_final,
            data_fechamento: registro.data_fechamento,
            mensagem_resposta: registro.mensagem_resposta,
            id_contrato_kit: registro.id_contrato_kit,
            id_login: registro.id_login,
            endereco: registro.endereco,
            bairro: registro.bairro,
            cidade: registro.cidade,
            latitude: registro.latitude,
            longitude: registro.longitude,
            ultima_atualizacao: registro.ultima_atualizacao,
        }));
    }
}
