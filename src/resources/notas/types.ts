export type NotaImprimirResponse = {
    base64_document: string; // Assumindo que a API retorna o documento em base64
    // Pode haver outros metadados, se a API retornar
};

export type Nota = {
    id: string;
    // Adicione outros campos relevantes se houver uma listagem de notas
};