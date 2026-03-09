import { ResponseBody } from "../base";

export type OrdemServico = {
    id: number;
    id_cliente?: number;
    id_login?: number;
    prioridade: 'B' | 'N' | 'A' | 'C'; // Baixa, Normal, Alta, Crítica
    id_assunto: number;
    mensagem?: string;
    data_abertura?: string;
    data_agenda?: string;
    id_tecnico?: number;
    status: 'A' | 'AN' | 'EN' | 'AS' | 'AG' | 'DS' | 'EX' | 'F' | 'RAG'; // Aberta, Análise, Encaminhada, Assumida, Agendada, Deslocamento, Execução, Finalizada, Reagendar
    id_filial: number;
    id_atendente: number;
    data_fechamento?: string;
    setor: number;
    data_inicio?: string;
    protocolo?: string;
    mensagem_resposta?: string;
    data_final?: string;
    impresso?: 'S' | 'N';
    id_ticket?: number;
    data_hora_analise?: string;
    data_hora_encaminhado?: string;
    data_hora_assumido?: string;
    data_hora_execucao?: string;
    id_wfl_param_os?: string;
    id_wfl_tarefa?: string;
    valor_total?: string;
    valor_outras_despesas?: string;
    id_contrato_kit?: number;
    valor_total_comissao?: string;
    gera_comissao?: 'S' | 'N';
    valor_unit_comissao?: string;
    melhor_horario_agenda?: 'M' | 'T' | 'N' | 'Q'; // Manhã, Tarde, Noite, Qualquer
    idx?: string;
    latitude?: string;
    longitude?: string;
    preview?: string;
    origem_endereco: 'C' | 'L' | 'CC' | 'M'; // Cliente, Login, Contrato, Manual
    endereco?: string;
    justificativa_sla_atrasado?: string;
    id_su_diagnostico?: number;
    id_cidade?: number;
    bairro?: string;
    tipo?: 'C' | 'E'; // Cliente, Estrutura própria
    id_estrutura?: number;
    origem_endereco_estrutura?: 'E' | 'M';
    liberado?: '1' | '2'; // 1:Sim, 2:Não
    data_agenda_final?: string;
    data_prazo_limite?: string;
    data_reservada?: string;
    data_reagendar?: string;
    regiao_manutencao?: string;
    data_prev_final?: string;
    origem_cadastro?: 'P' | 'SV';
    origem_change_endereco?: string;
    status_sla?: string;
    complemento?: string;
    referencia?: string;
    apartamento?: string;
    bloco?: string;
    ultima_atualizacao?: string;
    id_condominio?: number;
    dica_assinatura_digital?: string;
    [key: string]: any;
};

export type OrdemServicoAttrs = keyof OrdemServico;
export type OrdemServicoResponse = ResponseBody<OrdemServico>;
