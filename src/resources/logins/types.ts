import { ResponseBody } from "../base";

export type Login = {
    id: number;
    id_cliente: number;
    id_contrato: number;
    login: string;
    senha?: string;
    online: 'S' | 'N';
    ip?: string;
    mac?: string;
    status: 'A' | 'I' | 'C'; // A:Ativo, I:Inativo, C:Cancelado
    download_atual?: string;
    upload_atual?: string;
    tempo_conectado?: string;
    sinal_ultimo_atendimento?: string;
    [key: string]: any;
};

export type LoginAttrs = keyof Login;
export type LoginResponse = ResponseBody<Login>;
