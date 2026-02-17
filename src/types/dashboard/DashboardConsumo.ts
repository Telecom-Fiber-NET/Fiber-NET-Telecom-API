export interface DashboardConsumoHistoryItem {
    data: string;
    download_bytes: number;
    upload_bytes: number;
}

export interface DashboardConsumo {
    total_download_bytes: number;
    total_upload_bytes: number;
    total_download: string;
    total_upload: string;

    history: {
        daily: DashboardConsumoHistoryItem[];
        weekly: DashboardConsumoHistoryItem[];
        monthly: Array<{
            mes_ano: string;
            download_bytes: number;
            upload_bytes: number;
        }>;
    };
}
