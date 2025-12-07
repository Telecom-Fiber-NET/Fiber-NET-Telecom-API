export type Contrato = {
    id: number;
    id_cliente: number;
    login: string;
    status: string;
    desbloqueio_confianca: 'S' | 'N';
    descricao_aux_plano_venda?: string;
};

export type ContratoAttrs = keyof Contrato;

export type ContratoResponse = {
    registros: Contrato[];
};
