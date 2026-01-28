import { ResponseBody } from "../base";

export type Nota = {
    id: number;
    id_cliente: number;
    id_filial: number;
    data_emissao: string;
    valor_total: string;
    status: 'A' | 'C' | 'I'; // A:Aberta, C:Cancelada, I:Inutilizada
    numero?: string;
    serie?: string;
    modelo?: string;
    chave?: string;
    [key: string]: any;
};

export type NotaAttrs = keyof Nota;
export type NotaResponse = ResponseBody<Nota>;

export type NotaImprimirResponse = {
    base64_document: string;
};
