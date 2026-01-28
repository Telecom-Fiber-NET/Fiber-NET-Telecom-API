import { ResponseBody } from "../base";

export type Ticket = {
    id: number;
    protocolo?: string;
    id_circuito?: string;
    id_cliente: number;
    id_login?: number;
    id_contrato?: number;
    id_assunto?: number;
    titulo: string;
    origem_endereco?: 'M' | 'L' | 'C' | 'E';
    endereco?: string;
    latitude?: string;
    longitude?: string;
    id_wfl_processo?: number;
    id_ticket_setor?: number;
    id_responsavel_tecnico?: number;
    prioridade?: 'B' | 'N' | 'M' | 'A' | 'U';
    id_ticket_origem?: 'I' | 'T' | 'E' | 'O';
    id_usuarios?: number;
    id_resposta?: number;
    menssagem: string;
    interacao_pendente?: 'S' | 'N';
    su_status?: 'S' | 'N';
    id_evento_status_processo?: number;
    status?: 'A' | 'T' | 'F' | 'C';
    id_su_diagnostico?: number;
    atualizar_cliente?: 'S' | 'N';
    latitude_cli?: string;
    longitude_cli?: string;
    atualizar_login?: 'S' | 'N';
    latitude_login?: string;
    longitude_login?: string;
    [key: string]: any;
};

export type TicketAttrs = keyof Ticket;
export type TicketResponse = ResponseBody<Ticket>;
