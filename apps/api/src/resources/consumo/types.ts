import { ResponseBody } from "../base";

export type Consumo = {
    id: number;
    id_login: number;
    data_inicial: string;
    data_final: string;
    download: string;
    upload: string;
    download_bytes: string;
    upload_bytes: string;
    [key: string]: any;
};

export type ConsumoAttrs = keyof Consumo;
export type ConsumoResponse = ResponseBody<Consumo>;

export type ConsumoDiario = {
    data: string;
    download_bytes: number;
    upload_bytes: number;
};

export type ConsumoMensal = {
    mes_ano: string;
    download_bytes: number;
    upload_bytes: number;
};
