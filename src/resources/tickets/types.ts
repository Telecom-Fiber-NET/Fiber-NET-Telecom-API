export type TicketCreatePayload = {
    protocolo?: string; // Id do protocolo
    id_circuito?: string;
    id_cliente: string; // Id do cliente
    id_login?: string;
    id_contrato?: string;
    id_assunto?: string;
    titulo: string; // Descrição do assunto
    origem_endereco?: 'M' | 'L' | 'C' | 'E'; // M: Manual, L: Login, C: Cliente, E: Estrutura
    endereco?: string;
    latitude?: string;
    longitude?: string;
    id_wfl_processo?: string;
    id_ticket_setor?: string;
    id_responsavel_tecnico?: string;
    prioridade?: 'B' | 'N' | 'M' | 'A' | 'U'; // Baixa, Normal, Média, Alta, Urgente
    id_ticket_origem?: 'I' | 'T' | 'E' | 'O'; // I: Interno, T: Telefone, E: Email, O: Outros
    id_usuarios?: string;
    id_resposta?: string;
    menssagem: string; // Mensagem de Obs
    interacao_pendente?: 'S' | 'N';
    su_status?: 'S' | 'N';
    id_evento_status_processo?: string;
    status?: 'A' | 'T' | 'F' | 'C'; // A: Aberto, T: Em Atendimento, F: Fechado, C: Cancelado
    id_su_diagnostico?: string;
    atualizar_cliente?: 'S' | 'N';
    latitude_cli?: string;
    longitude_cli?: string;
    atualizar_login?: 'S' | 'N';
    latitude_login?: string;
    longitude_login?: string;
};

export type TicketCreateResponse = {
    id: string; // ID do ticket criado
    // Outros campos que a API possa retornar após a criação
};