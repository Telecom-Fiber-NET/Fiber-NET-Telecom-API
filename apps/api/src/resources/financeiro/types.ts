import { ResponseBody } from "../base";

export declare type Financeiro = {
    id: number;
    id_saida?: string;
    data_emissao: string;
    valor: string;
    obs?: string;
    status?: 'A' | 'R' | 'P' | 'C'; // A:A receber, R:Recebido, P:Parcial, C:Cancelado
    valor_recebido?: string;
    liberado?: string;
    id_cliente: number;
    data_vencimento: string;
    documento?: string;
    tipo_recebimento?: 'Boleto' | 'Cheque' | 'Cartão' | 'Dinheiro' | 'Depósito' | 'Gateway' | 'Débito' | 'Fatura' | 'ArrecadacaoRecebimento' | 'Transferencia' | 'Pix';
    id_conta: number;
    valor_aberto?: string;
    id_carteira_cobranca?: number;
    filial_id: number;
    data_cancelamento?: string;
    valor_cancelado?: string;
    id_remessa?: string;
    previsao: 'N' | 'S' | 'M'; // N:Competência, S:Caixa, M:Manual
    nn_boleto?: string;
    tipo_conta?: string;
    id_cobranca?: string;
    status_cobranca?: string;
    gateway_link?: string;
    libera_periodo?: 'S' | 'N';
    id_mot_cancelamento?: number;
    pagamento_valor?: string;
    pagamento_data?: string;
    id_nota_gerada?: string;
    id_im_imovel?: string;
    impresso?: 'S' | 'N';
    duplicata?: string;
    id_sip?: string;
    boleto?: string;
    gerencianet_token?: string;
    tipo_renegociacao?: 'R' | 'N';
    id_renegociacao?: string;
    id_renegociacao_novo?: string;
    forma_recebimento?: 'M' | 'R';
    arquivo_remessa_baixado?: 'S' | 'N';
    linha_digitavel?: string;
    pix_txid?: string;
    [key: string]: any;
};

export declare type FinanceiroResponse = ResponseBody<Financeiro>;
export declare type FinanceiroAttrs = keyof Financeiro;
