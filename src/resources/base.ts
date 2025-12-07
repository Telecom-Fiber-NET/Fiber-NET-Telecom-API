/**
 * Configurações para autenticação e URL base da API.
 */
export type Config = {
    token: string,
    baseUrl: string,
};

/**
 * Estrutura de resposta da API para listagens.
 * 
 * @template T - Tipo dos registros retornados.
 */
export declare type ResponseBody<T> = {
    page: string,
    total: number,
    registros: T[],
}

/**
 * Estrutura de consulta para requisições de listagem à API.
 */
export declare type QueryBody = {
    qtype: string,
    query: string,
    oper: '>' | '<' | '=' | 'like',
    page: string,
    rp?: string,
    sortname: string,
    sortorder: 'desc' | 'asc',
}

/**
 * Classe base para realizar requisições à API.
 */
export abstract class QueryBase {
    private apiKey: string;
    private baseUrl: string;
    private commonHeaders: Record<string, string>;

    constructor(config: Config) {
        this.apiKey = config.token;
        this.baseUrl = config.baseUrl;
        const token = `Basic ${this.apiKey}`;
        this.commonHeaders = {
            'Content-Type': 'application/json',
            'Authorization': token,
        };
    }

    private async performRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        console.log('IXC API Request URL:', url);
        console.log('IXC API Request Options:', options);

        return fetch(url, options).then(async response => {
            console.log('IXC API Response Status:', response.status);
            console.log('IXC API Response Status Text:', response.statusText);
            console.log('IXC API Response Headers:', response.headers);

            const contentType = response.headers.get('content-type');
            if (!response.ok) {
                if (contentType && contentType.indexOf('application/json') !== -1) {
                    const err = await response.json();
                    console.error('IXC API Error Response (JSON):', err);
                    throw new Error((err as Error).message || 'API Error');
                } else {
                    const text = await response.text();
                    console.error('IXC API Error Response (Non-JSON):', text);
                    throw new Error(response.statusText || 'API Error');
                }
            }
            
            if (contentType && (contentType.indexOf('application/json') !== -1 || contentType.indexOf('text/x-json') !== -1)) {
                return response.text().then(text => text ? JSON.parse(text) : {});
            } else {
                const text = await response.text();
                console.error('A API IXC retornou uma resposta inesperada (não-JSON):', text);
                throw new Error('A API IXC retornou uma resposta inesperada.');
            }
        });
    }

    public async request<T>(endpoint: string, query: QueryBody): Promise<T> {
        return this.performRequest<T>(endpoint, {
            method: "POST", // IXC uses POST for GET operations, as GET with body is not supported by fetch
            headers: { ...this.commonHeaders, 'ixcsoft': 'listar' },
            body: JSON.stringify(query),
        });
    }

    public async create<T, U>(endpoint: string, data: T): Promise<U> {
        return this.performRequest<U>(endpoint, {
            method: 'POST',
            headers: this.commonHeaders,
            body: JSON.stringify(data),
        });
    }

    public async update<T, U>(endpoint: string, id: number, data: T): Promise<U> {
        return this.performRequest<U>(`${endpoint}/${id}`, {
            method: 'PUT',
            headers: this.commonHeaders,
            body: JSON.stringify(data),
        });
    }
    
    public async remove<T>(endpoint: string, id: number): Promise<T> {
        return this.performRequest<T>(`${endpoint}/${id}`, {
            method: 'DELETE',
            headers: this.commonHeaders,
        });
    }
}