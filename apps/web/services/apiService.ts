// src/services/apiService.ts
import { API_BASE_URL, ENDPOINTS } from "../config";
import {
  Contrato,
  CreateTicketPayload,
  DashboardResponse,
  Fatura,
  Login,
  LoginResponse,
  OrdemServico,
  Ticket
} from "../types/api";

class ApiService {
  private readonly authTokenKey = "authToken";
  private readonly userDataKey = "userData";

  private readonly profileIdKey = "profileId";

  public getBaseUrl(): string {
    return API_BASE_URL;
  }

  private getAuthToken(): string | null {
    return sessionStorage.getItem(this.authTokenKey);
  }

  private setAuthToken(token: string): void {
    sessionStorage.setItem(this.authTokenKey, token);
  }

  public getProfileId(): string | null {
    return sessionStorage.getItem(this.profileIdKey);
  }

  public setProfileId(id: string | null): void {
    if (id) {
      sessionStorage.setItem(this.profileIdKey, id);
    } else {
      sessionStorage.removeItem(this.profileIdKey);
    }
  }

  private clearAuthToken(): void {
    sessionStorage.removeItem(this.authTokenKey);
    sessionStorage.removeItem(this.userDataKey);
    sessionStorage.removeItem(this.profileIdKey);
  }

  private getHeaders(): HeadersInit {
    const token = this.getAuthToken();
    const profileId = this.getProfileId();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (profileId) {
      headers["X-Profile-ID"] = profileId;
    }
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const cleanBase = API_BASE_URL.endsWith("/")
      ? API_BASE_URL.slice(0, -1)
      : API_BASE_URL;
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${cleanBase}${cleanEndpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const text = await response.text();
      let data: any;

      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = {};
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          this.logout();
        }
        const errorMessage = data?.error || data?.message || `Erro ${response.status}`;
        throw new Error(errorMessage);
      }

      return data as T;
    } catch (error: any) {
      console.error(`[ApiService] Erro em ${endpoint}:`, error);
      throw error;
    }
  }

  async login(credentials: { email: string; password: string }): Promise<LoginResponse> {
    const payload = {
      email: credentials.email,
      password: credentials.password
    };

    const data = await this.request<LoginResponse>(ENDPOINTS.LOGIN, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (data.token) {
      this.setAuthToken(data.token);
      sessionStorage.setItem(this.userDataKey, JSON.stringify(data.user));
      window.dispatchEvent(new Event("auth-change"));
    }

    return data;
  }

  async validateSession(): Promise<boolean> {
    const token = this.getAuthToken();
    if (!token) return false;
    
    try {
      // Small optimization: if we have a token, we consider it valid for the guard
      // The actual request will redirect if it's expired (401 handled in request())
      return true;
    } catch (e) {
      return false;
    }
  }

  async logout() {
    this.clearAuthToken();
    window.dispatchEvent(new Event("auth-change"));
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  async getDashboard(): Promise<DashboardResponse> {
    const rawData = await this.request<any>(ENDPOINTS.DASHBOARD, { method: "GET" });

    // Mapping new API structure to UI expectations
    const faturas: Fatura[] = (rawData.faturas || []).map((f: any) => {
      // O Backend já envia o status mapeado: "aberto", "pago", "cancelado"
      // Vamos apenas garantir que está em lowercase para o frontend
      const mappedStatus = String(f.status || "aberto").toLowerCase();
      
      return {
        ...f,
        id: f.id,
        vencimento: f.vencimento,
        data_vencimento: f.vencimento,
        valor: f.valor,
        valor_recebido: f.valor_recebido,
        data_pagamento: f.data_pagamento,
        valor_atualizado: f.valor_atualizado || f.valor,
        juros: f.juros || "0.00",
        multa: f.multa || "0.00",
        status: mappedStatus,
        linha_digitavel: f.linha_digitavel
      };
    });

    const logins: Login[] = (rawData.logins || []).map((l: any) => ({
      ...l,
      login: l.login,
      status: l.status,
      online: String(l.status).toLowerCase() === "online" ? "S" : "N",
      uptime: l.uptime,
      tempo_conectado: l.uptime || this.formatUptime(l.uptime_seconds),
      ipv4: l.ipv4 || l.ip_publico || "---",
      ip_privado: l.ip_privado,
      ip_publico: l.ip_publico,
      sinal: l.sinal,
      onu_mac: l.onu_mac,
      wifi_ssid: l.wifi_ssid,
      wifi_senha: l.wifi_senha,
      total_download: l.consumo?.total_download || l.total_download || "0 GB",
      total_upload: l.consumo?.total_upload || l.total_upload || "0 GB",
      consumo: l.consumo,
      history: l.consumo?.history || l.history || { daily: [], weekly: [], monthly: [] }
    }));

    const contratos: Contrato[] = (rawData.contratos || []).map((c: any) => ({
      ...c,
      id: c.id,
      plano: c.plano || "Plano Connect",
      status: c.status || "A",
      desbloqueio_confianca: c.desbloqueio_confianca || "N"
    }));

    const ordensServico: OrdemServico[] = (rawData.ordensServico || []).map((os: any) => ({
      ...os,
      id: String(os.id)
    }));

    const tickets: Ticket[] = (rawData.tickets || []).map((t: any) => ({
      ...t,
      id: String(t.id),
      podeFechar: t.status !== "Fechado"
    }));

    const globalConsumo = rawData.consumo_global || rawData.consumo || {
      total_download: "0 GB",
      total_upload: "0 GB",
      history: { daily: [], weekly: [], monthly: [] }
    };

    return {
      clientes: rawData.clientes || [],
      contratos,
      faturas,
      logins,
      ordensServico,
      tickets,
      consumo_global: globalConsumo,
      consumo: globalConsumo, // Backward compatibility
      ai_analysis: rawData.ai_analysis
    };
  }

  async getPublicInvoices(cpfCnpj: string): Promise<{ success: boolean; data: any[]; message?: string }> {
    return this.request(`${ENDPOINTS.INVOICES}?cpf_cnpj=${cpfCnpj}`, { method: "GET" });
  }

  async getPixCode(faturaId: string | number): Promise<{ pix_code: string; qr_code: string }> {
    return this.request<{ pix_code: string; qr_code: string }>(ENDPOINTS.GET_PIX(faturaId), { method: "GET" });
  }

  async getSegundaVia(faturaId: string | number): Promise<{ success: boolean; base64_document?: string; message?: string }> {
    return this.request<{ success: boolean; base64_document?: string; message?: string }>(ENDPOINTS.GET_SEGUNDA_VIA(faturaId), { method: "GET" });
  }

  async unlockContract(contractId: number | string): Promise<any> {
    return this.request(ENDPOINTS.AUTO_UNLOCK(contractId), { method: "POST" });
  }

  async updateWifi(loginId: number | string, ssid: string, password: string): Promise<any> {
    return this.request(ENDPOINTS.WIFI_GESTION(loginId), {
      method: "POST",
      body: JSON.stringify({ ssid, password })
    });
  }

  async createTicket(payload: CreateTicketPayload): Promise<any> {
    return this.request(ENDPOINTS.TICKETS, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async getTickets(): Promise<Ticket[]> {
    return this.request<Ticket[]>(ENDPOINTS.TICKETS, { method: "GET" });
  }

  async getTicketTypes(): Promise<any> {
    return this.request(ENDPOINTS.TICKET_TYPES, { method: "GET" });
  }

  async sendChatMessage(message: string): Promise<any> {
    return this.request(ENDPOINTS.AI_CHAT, {
      method: "POST",
      body: JSON.stringify({ message })
    });
  }

  async getContractFinancial(contractId: number | string): Promise<any> {
    return this.request(`/contratos/${contractId}/financeiro`, { method: "GET" });
  }

  async getContratoPdf(contractId: number | string): Promise<{ base64_document: string }> {
    return this.request(`/contratos/${contractId}/pdf`, { method: "POST" });
  }

  async assinarDigital(contractId: number | string): Promise<any> {
    return this.request(ENDPOINTS.DIGITAL_SIGN(contractId), { method: "POST" });
  }

  async loginAction(id: string | number, action: string): Promise<any> {
    return this.request(ENDPOINTS.LOGIN_ACTION(String(id), action), { method: "POST" });
  }

  private formatUptime(seconds: any): string {
    const sec = Number(seconds);
    if (isNaN(sec)) return "0h";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  }
}

export const apiService = new ApiService();
