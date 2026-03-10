import { ResponseBody } from "../base";

export type Contrato = {
    id: number;
    id_cliente: number;
    id_vendedor?: number;
    id_filial: number;
    id_tipo_contrato?: number;
    id_modelo_contrato?: number;
    id_plano_venda?: number;
    id_carteira_cobranca?: number;
    id_vendedor_ativacao?: number;
    id_vendedor_comissao?: number;
    id_vendedor_comissao_ativacao?: number;
    id_vendedor_comissao_ativacao_aux?: number;
    id_vendedor_comissao_aux?: number;
    data?: string;
    data_ativacao?: string;
    data_cancelamento?: string;
    data_renovacao?: string;
    data_vencimento?: string;
    valor_contrato?: string;
    valor_instalacao?: string;
    status: 'A' | 'I' | 'C' | 'D' | 'S'; // A:Ativo, I:Inativo, C:Cancelado, D:Demonstração, S:Suspenso
    desbloqueio_confianca: 'S' | 'N';
    descricao_aux_plano_venda?: string;
    [key: string]: any;
};

export type ContratoAttrs = keyof Contrato;
export type ContratoResponse = ResponseBody<Contrato>;
