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
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
    complemento?: string;
};

export type Contrato = {
    id: number;
    id_cliente: number;
    contrato: string;
    status: string;
    status_internet: string;
    data_assinatura: string;
    endereco: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    complemento: string;
    endereco_padrao_cliente: 'S' | 'N';
    [key: string]: any; // Allow other IXC fields
};

export type ClienteAttrs = keyof Cliente;

export type ClienteResponse = {
    registros: Cliente[];
};
