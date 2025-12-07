export type LoginAttrs = 'id' | 'login' | 'id_cliente' | 'online' | 'sinal_ultimo_atendimento' | 'tempo_conectado' | 'id_contrato';

export type Login = {
    id: number;
    login: string;
    id_cliente: number;
    online: 'S' | 'N';
    sinal_ultimo_atendimento: string;
    tempo_conectado: string;
    id_contrato: number;
    upload_atual: string; // Adicionado
    download_atual: string; // Adicionado
    ip?: string;
    // Adicione outros campos relevantes para o login, se houver
};

export type LoginResponse = {
    registros: Login[];
    total: number;
};