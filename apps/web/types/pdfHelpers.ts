/**
 * Converte uma string Base64 em um PDF e abre em uma nova aba ou baixa.
 * @param base64Data String retornada pela API
 * @param fileName Nome sugerido para o arquivo
 * @param mode 'view' para abrir no navegador, 'download' para baixar direto
 */
export const handlePdfBase64 = (
    base64Data: string,
    fileName: string = 'contrato.pdf',
    mode: 'view' | 'download' = 'view'
) => {
    try {
        const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
        
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        const fileURL = window.URL.createObjectURL(blob);

        if (mode === 'view') {
            window.open(fileURL, '_blank');
        } else {
            const link = document.createElement('a');
            link.href = fileURL;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        setTimeout(() => window.URL.revokeObjectURL(fileURL), 100);
    } catch (error) {
        console.error('Erro ao processar PDF:', error);
    }
};