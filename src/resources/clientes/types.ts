export type Cliente = {
    id: number;
    cnpj_cpf: string;
    razao: string;
    fantasia: string;
    fone: string;
    email: string;
    senha?: string;
    hotsite_email?: string;
    endereco?: string;
    numero?: string;
};

export type ClienteAttrs = keyof Cliente;

export type ClienteResponse = {
    registros: Cliente[];
};
