export type OrdemServico = {
    id: string;
    tipo: string;
    id_filial: string;
    status: string;
    id_cliente: string;
    id_assunto: string;
    mensagem: string;
    protocolo: string;
    data_abertura: string;
    data_inicio: string;
    data_final: string;
    data_fechamento: string;
    mensagem_resposta: string;
    id_contrato_kit: string; // Pode ser o ID do contrato associado
    id_login: string; // Pode ser o ID do login associado
    endereco: string;
    bairro: string;
    cidade: string;
    latitude: string;
    longitude: string;
    ultima_atualizacao: string;
    // Adicione outros campos relevantes conforme necessário
};