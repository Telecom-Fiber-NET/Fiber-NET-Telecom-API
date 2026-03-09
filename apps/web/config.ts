// src/config.ts

export const getApiBaseUrl = () => {
  // In a real environment, this might toggle based on domain
  return "http://localhost:3001/api";
  // return "https://api.centralfiber.online/api";

};

export const API_BASE_URL = getApiBaseUrl();

export const ENDPOINTS = {
  LOGIN: `/auth/login`,
  DASHBOARD: `/dashboard`,
  RECOVERY: `/senha/recuperar`,
  VALIDATE_PASSWORD: `/senha/validar`,
  CHANGE_PASSWORD: `/senha/trocar`,
  
  // Financeiro
  INVOICES: `/faturas`,
  GET_PIX: (id: number | string) => `/faturas/${id}/pix`,
  GET_SEGUNDA_VIA: (id: number | string) => `/faturas/${id}/segunda-via`,
  GET_NOTA_FISCAL: (id: number | string) => `/financeiro/notas/${id}/imprimir`,
  FINANCIAL_SUMMARY: `/financeiro/resumo`,
  
  // Contratos & Logins
  AUTO_UNLOCK: (id: number | string) => `/contratos/${id}/desbloqueio`,
  WIFI_GESTION: (id: number | string) => `/logins/${id}/wifi`,
  LOGIN_ACTION: (id: string | number, action: string) => `/logins/${id}/${action}`,
  CONSUMPTION_MONTHLY: (id: number | string) => `/logins/${id}/consumo/mensal`,
  DIGITAL_SIGN: (id: number | string) => `/contratos/${id}/assinar-digital`,
  
  // Atendimento
  TICKETS: `/tickets`,
  TICKET_TYPES: `/tickets/tipos`,
  SERVICE_ORDERS: `/ordens-servico`,
  AI_CHAT: `/chat`,
  
  // Legacy/Other
  SERVICE_STATUS: `/status`,
  SPEEDTEST_RUN: `/speedtest`,
};
