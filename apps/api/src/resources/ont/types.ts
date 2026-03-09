export type OntInfo = {
    id: string;
    id_login: string;
    serial_number?: string; // Assumindo que pode haver um número de série
    modelo?: string; // Modelo da ONT
    status?: string; // Status da ONT (ex: online, offline)
    sinal_rx?: string; // Sinal de recepção
    sinal_tx?: string; // Sinal de transmissão
    potencia_ont?: string; // Potência da ONT
    ultima_atualizacao?: string;
    // Adicione outros campos relevantes conforme a resposta real da API
};