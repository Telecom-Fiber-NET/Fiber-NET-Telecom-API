import "dotenv/config";
import { IxcConfig } from "../types/ixc.types";

/**
 * CONFIGURAÇÃO CENTRALIZADA DO IXC
 * 
 * Todas as configurações de conexão e comportamento da API IXC
 */

// ============================================================================
// VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE
// ============================================================================

function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  
  if (!value) {
    console.warn(`⚠️ Variável de ambiente ${key} não configurada`);
  }
  
  return value || "";
}

function getBaseUrl(): string {
  const url = 
    process.env.IXC_API_URL || 
    process.env.IXC_BASE_URL || 
    "";
  
  if (!url) {
    throw new Error("IXC_API_URL ou IXC_BASE_URL deve ser configurada");
  }
  
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function getToken(): string {
  const token = 
    process.env.IXC_ADMIN_TOKEN || 
    process.env.IXC_AUTH_BASIC || 
    "";
  
  if (!token) {
    throw new Error("IXC_ADMIN_TOKEN ou IXC_AUTH_BASIC deve ser configurado");
  }
  
  return token;
}

// ============================================================================
// CONFIGURAÇÃO PRINCIPAL
// ============================================================================

export const ixcConfig: IxcConfig = {
  // URL base da API
  baseUrl: getBaseUrl(),
  
  // Token de autenticação
  token: getToken(),
  
  // Timeout em milissegundos (30 segundos)
  timeout: parseInt(getEnvVar("IXC_TIMEOUT", "30000")),
  
  // Número de tentativas em caso de falha
  retries: parseInt(getEnvVar("IXC_RETRIES", "3")),
  
  // Delay entre tentativas em milissegundos
  retryDelay: parseInt(getEnvVar("IXC_RETRY_DELAY", "1000")),
  
  // Cache habilitado
  cacheEnabled: getEnvVar("CACHE_ENABLED", "true") === "true",
  
  // TTL padrão do cache em segundos
  cacheTTL: parseInt(getEnvVar("CACHE_TTL", "300")),
};

// ============================================================================
// HEADERS PADRÃO
// ============================================================================

export function getHeaders(): Record<string, string> {
  const token = ixcConfig.token.includes("Basic") 
    ? ixcConfig.token 
    : `Basic ${ixcConfig.token}`;
  
  return {
    "Content-Type": "application/json",
    Authorization: token,
    ixcsoft: "listar",
  };
}

// ============================================================================
// ENDPOINTS DA API
// ============================================================================

export const IxcEndpoints = {
  // Clientes
  CLIENTE: "cliente",
  CLIENTE_CONTRATO: "cliente_contrato",
  
  // Financeiro
  FINANCEIRO: "fn_areceber",
  
  // Técnico
  LOGINS: "radusuarios",
  ONT: "radpop_radio_cliente_fibra",
  CONSUMO_DIARIO: "radusuarios_consumo_d",
  CONSUMO_MENSAL: "radusuarios_consumo_m",
  
  // Suporte
  TICKET: "su_ticket",
  ORDEM_SERVICO: "su_oss_chamado",
  ORDEM_SERVICO_ITEM: "su_oss_chamado_item",
} as const;

// ============================================================================
// OPERADORES DE QUERY
// ============================================================================

export const QueryOperators = {
  EQUAL: "=",
  NOT_EQUAL: "!=",
  GREATER: ">",
  LESS: "<",
  GREATER_OR_EQUAL: ">=",
  LESS_OR_EQUAL: "<=",
  LIKE: "LIKE",
} as const;

// ============================================================================
// VALORES PADRÃO DE PAGINAÇÃO
// ============================================================================

export const PaginationDefaults = {
  PAGE: "1",
  RESULTS_PER_PAGE: "50",
  SORT_ORDER: "desc" as const,
} as const;

// ============================================================================
// LIMITES E TIMEOUTS
// ============================================================================

export const Limits = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  REQUEST_TIMEOUT_MS: 30000,
  MAX_RESULTS_PER_PAGE: 100,
  CACHE_TTL_SECONDS: 300,
} as const;

// ============================================================================
// VALIDAÇÃO DA CONFIGURAÇÃO
// ============================================================================

export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar URL
  if (!ixcConfig.baseUrl) {
    errors.push("Base URL não configurada");
  } else {
    try {
      new URL(ixcConfig.baseUrl);
    } catch {
      errors.push("Base URL inválida");
    }
  }

  // Validar token
  if (!ixcConfig.token) {
    errors.push("Token não configurado");
  }

  // Validar timeout
  if (ixcConfig.timeout && ixcConfig.timeout < 1000) {
    errors.push("Timeout muito baixo (mínimo 1000ms)");
  }

  // Validar retries
  if (ixcConfig.retries && ixcConfig.retries < 0) {
    errors.push("Número de retries inválido");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// INFORMAÇÕES DE AMBIENTE
// ============================================================================

export const environment = {
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  logLevel: process.env.LOG_LEVEL || "info",
};

// ============================================================================
// VALIDAR CONFIGURAÇÃO NA INICIALIZAÇÃO
// ============================================================================

const validation = validateConfig();
if (!validation.valid) {
  console.error("❌ Erro na configuração do IXC:");
  validation.errors.forEach((error) => console.error(`  - ${error}`));
  
  if (environment.isProduction) {
    throw new Error("Configuração inválida do IXC");
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ixcConfig;