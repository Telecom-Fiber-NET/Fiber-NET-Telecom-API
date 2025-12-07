import { QueryBase, QueryBody } from '../base';
import { NotaImprimirResponse } from './types';

/**
 * Recurso para interagir com as Notas (imprimir_nota) da API IXC.
 */
export class NotasResource extends QueryBase {
    private resourceName = "imprimir_nota";

    /**
     * Imprime uma nota específica, retornando o documento em base64.
     * @param id ID da nota/venda.
     * @param base64 Se 'S', retorna o documento em base64.
     * @returns O documento da nota em base64.
     */
    public async imprimirNota(id: number, base64: 'S' | 'N' = 'S'): Promise<NotaImprimirResponse> {
        const query: QueryBody = {
            qtype: 'id', // Assumindo que o qtype para buscar por ID é 'id'
            query: id.toString(),
            oper: '=',
            page: '1',
            rp: '1', // Apenas um registro
            sortname: 'id',
            sortorder: 'desc',
            // Adiciona o parâmetro base64 diretamente na query, se a API aceitar assim
            // Ou pode ser um parâmetro de URL, dependendo da API
            // Para este caso, vamos assumir que é um parâmetro de query
            base64: base64, // IXC API expects this as a query parameter
        } as any; // Cast to any to allow 'base64' property

        const response = await this.request<any>(this.resourceName, query);
        // Assumindo que a API retorna o base64 diretamente no corpo ou em um campo específico
        // Se a API retornar um objeto com um campo 'base64_document', ajuste aqui
        return { base64_document: response.base64_document || response.registros?.[0]?.base64_document || response.conteudo_base64 || response.conteudo };
    }
}
