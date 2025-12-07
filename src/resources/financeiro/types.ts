import { ResponseBody } from "../base";

export declare type Financeiro = {
    id: number;
    id_cliente: number;
    documento: string;
    data_emissao: string;
    data_vencimento: string;
    valor: string;
    status: 'A' | 'B' | 'C'; // Aberto, Baixado, Cancelado
    linha_digitavel: string;
    pix_txid: string;
    boleto: string; // Link para o PDF
    [key: string]: any; // Permite outros campos
};

export declare type FinanceiroResponse = ResponseBody<Financeiro>;
export declare type FinanceiroAttrs = keyof Financeiro;
