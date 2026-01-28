import { ResponseBody } from "../base";

export type Termo = {
    id: number;
    id_contrato: number;
    id_modelo_termo: number;
    data_aceite?: string;
    ip_aceite?: string;
    status: 'P' | 'A' | 'C'; // P:Pendente, A:Aceito, C:Cancelado
    [key: string]: any;
};

export type TermoAttrs = keyof Termo;
export type TermoResponse = ResponseBody<Termo>;
