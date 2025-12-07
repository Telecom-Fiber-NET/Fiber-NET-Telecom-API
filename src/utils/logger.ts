import winston from "winston";
import path from "path";

/**
 * CONFIGURAÇÃO DE LOGGING PROFISSIONAL
 * 
 * Níveis de log:
 * - error: Erros críticos que precisam atenção imediata
 * - warn: Avisos importantes mas não críticos
 * - info: Informações gerais de operação
 * - http: Logs de requisições HTTP
 * - debug: Informações detalhadas para debug
 */

// ============================================================================
// FORMATAÇÃO CUSTOMIZADA
// ============================================================================

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ["message", "level", "timestamp"] }),
  winston.format.printf(({ level, message, timestamp, metadata }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Adicionar metadata se existir
    if (metadata && Object.keys(metadata).length > 0) {
      log += `\n${JSON.stringify(metadata, null, 2)}`;
    }
    
    return log;
  })
);

// Formato para produção (JSON)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ============================================================================
// TRANSPORTES (ONDE OS LOGS VÃO)
// ============================================================================

const transports: winston.transport[] = [
  // Console - sempre ativo em desenvolvimento
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      customFormat
    ),
  }),

  // Arquivo de erros
  new winston.transports.File({
    filename: path.join("logs", "error.log"),
    level: "error",
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // Arquivo de todos os logs
  new winston.transports.File({
    filename: path.join("logs", "combined.log"),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // Arquivo específico para IXC API
  new winston.transports.File({
    filename: path.join("logs", "ixc-api.log"),
    level: "info",
    maxsize: 5242880, // 5MB
    maxFiles: 3,
  }),
];

// ============================================================================
// CRIAÇÃO DO LOGGER
// ============================================================================

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: process.env.NODE_ENV === "production" 
    ? productionFormat 
    : customFormat,
  transports,
  exitOnError: false,
});

// ============================================================================
// FUNÇÕES AUXILIARES ESPECÍFICAS
// ============================================================================

/**
 * Log de requisição HTTP
 */
export function logRequest(method: string, url: string, data?: any) {
  logger.http("Requisição HTTP", {
    method,
    url,
    data: data ? sanitizeData(data) : undefined,
  });
}

/**
 * Log de resposta HTTP
 */
export function logResponse(
  method: string,
  url: string,
  statusCode: number,
  duration: number
) {
  logger.http("Resposta HTTP", {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
  });
}

/**
 * Log de erro com contexto
 */
export function logError(
  message: string,
  error: Error | unknown,
  context?: Record<string, any>
) {
  logger.error(message, {
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    ...context,
  });
}

/**
 * Log de operação do IXC
 */
export function logIxcOperation(
  operation: string,
  status: "start" | "success" | "error",
  details?: Record<string, any>
) {
  const level = status === "error" ? "error" : "info";
  
  logger.log(level, `IXC ${operation}`, {
    operation,
    status,
    ...details,
  });
}

/**
 * Remove informações sensíveis dos logs
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== "object") return data;

  const sanitized = { ...data };
  const sensitiveFields = ["senha", "password", "token", "authorization"];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "***REDACTED***";
    }
  }

  return sanitized;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default logger;

/**
 * Logger específico para IXC Service
 */
export const ixcLogger = {
  info: (message: string, meta?: any) => {
    logger.info(`[IXC] ${message}`, meta);
  },
  
  error: (message: string, error: Error | unknown, meta?: any) => {
    logError(`[IXC] ${message}`, error, meta);
  },
  
  warn: (message: string, meta?: any) => {
    logger.warn(`[IXC] ${message}`, meta);
  },
  
  debug: (message: string, meta?: any) => {
    logger.debug(`[IXC] ${message}`, meta);
  },
  
  operation: (operation: string, status: "start" | "success" | "error", details?: any) => {
    logIxcOperation(operation, status, details);
  },
};