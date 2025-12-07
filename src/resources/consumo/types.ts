export type ConsumoDiario = {
    data: string; // Ex: "2025-11-24"
    download_bytes: number;
    upload_bytes: number;
};

export type ConsumoMensal = {
    mes_ano: string; // Ex: "2025-11"
    download_bytes: number;
    upload_bytes: number;
};

export type ConsumoGeral = {
    total_download_bytes: number;
    total_upload_bytes: number;
    // Pode incluir outros campos como média diária, etc.
};

export type ConsumoHistory = {
    daily: ConsumoDiario[];
    monthly: ConsumoMensal[];
    // Pode incluir weekly, annual se a API IXC fornecer
};

export type Consumo = {
    total_download_bytes: number;
    total_upload_bytes: number;
    history: ConsumoHistory;
};
