import NodeCache from "node-cache";
import { ixcLogger } from "./logger";

/**
 * SISTEMA DE CACHE INTELIGENTE
 * 
 * Implementa cache em memória com TTL configurável
 * para reduzir chamadas à API do IXC
 */

// ============================================================================
// CONFIGURAÇÃO DO CACHE
// ============================================================================

interface CacheConfig {
  stdTTL: number; // Tempo padrão em segundos
  checkperiod: number; // Intervalo de verificação de expiração
  useClones: boolean; // Se deve clonar objetos ao armazenar/recuperar
  deleteOnExpire: boolean; // Se deve deletar automaticamente ao expirar
}

const defaultConfig: CacheConfig = {
  stdTTL: 300, // 5 minutos
  checkperiod: 120, // 2 minutos
  useClones: false, // Melhor performance
  deleteOnExpire: true,
};

// ============================================================================
// INSTÂNCIA DO CACHE
// ============================================================================

class CacheManager {
  private cache: NodeCache;
  private enabled: boolean;

  constructor(config: Partial<CacheConfig> = {}) {
    this.cache = new NodeCache({
      ...defaultConfig,
      ...config,
    });
    
    this.enabled = process.env.CACHE_ENABLED !== "false";

    // Listeners de eventos
    this.setupEventListeners();
  }

  /**
   * Configura listeners para monitoramento
   */
  private setupEventListeners() {
    this.cache.on("set", (key, value) => {
      ixcLogger.debug(`Cache SET: ${key}`);
    });

    this.cache.on("del", (key, value) => {
      ixcLogger.debug(`Cache DEL: ${key}`);
    });

    this.cache.on("expired", (key, value) => {
      ixcLogger.debug(`Cache EXPIRED: ${key}`);
    });

    this.cache.on("flush", () => {
      ixcLogger.info("Cache FLUSH: Todos os itens removidos");
    });
  }

  /**
   * Armazena um valor no cache
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    if (!this.enabled) return false;

    try {
      const success = this.cache.set(key, value, ttl || 0);
      
      if (success) {
        ixcLogger.debug(`Cache armazenado: ${key}`, {
          ttl: ttl || defaultConfig.stdTTL,
        });
      }
      
      return success;
    } catch (error) {
      ixcLogger.error("Erro ao armazenar no cache", error, { key });
      return false;
    }
  }

  /**
   * Recupera um valor do cache
   */
  get<T>(key: string): T | undefined {
    if (!this.enabled) return undefined;

    try {
      const value = this.cache.get<T>(key);
      
      if (value !== undefined) {
        ixcLogger.debug(`Cache HIT: ${key}`);
      } else {
        ixcLogger.debug(`Cache MISS: ${key}`);
      }
      
      return value;
    } catch (error) {
      ixcLogger.error("Erro ao recuperar do cache", error, { key });
      return undefined;
    }
  }

  /**
   * Verifica se uma chave existe no cache
   */
  has(key: string): boolean {
    return this.enabled && this.cache.has(key);
  }

  /**
   * Remove uma chave do cache
   */
  del(key: string): number {
    if (!this.enabled) return 0;

    try {
      return this.cache.del(key);
    } catch (error) {
      ixcLogger.error("Erro ao deletar do cache", error, { key });
      return 0;
    }
  }

  /**
   * Remove múltiplas chaves
   */
  delMany(keys: string[]): number {
    if (!this.enabled) return 0;

    try {
      return this.cache.del(keys);
    } catch (error) {
      ixcLogger.error("Erro ao deletar múltiplas chaves", error, { keys });
      return 0;
    }
  }

  /**
   * Limpa todo o cache
   */
  flush(): void {
    try {
      this.cache.flushAll();
      ixcLogger.info("Cache completamente limpo");
    } catch (error) {
      ixcLogger.error("Erro ao limpar cache", error);
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      ksize: this.cache.getStats().ksize,
      vsize: this.cache.getStats().vsize,
    };
  }

  /**
   * Lista todas as chaves
   */
  keys(): string[] {
    return this.cache.keys();
  }

  /**
   * Obtém o TTL restante de uma chave
   */
  getTtl(key: string): number | undefined {
    return this.cache.getTtl(key);
  }

  /**
   * Ativa ou desativa o cache
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    ixcLogger.info(`Cache ${enabled ? "ativado" : "desativado"}`);
  }
}

// ============================================================================
// ESTRATÉGIAS DE CACHE ESPECÍFICAS
// ============================================================================

/**
 * Gera chave de cache para clientes
 */
export function clienteCacheKey(identifier: string | number): string {
  return `cliente:${identifier}`;
}

/**
 * Gera chave de cache para contratos
 */
export function contratoCacheKey(clienteId: number): string {
  return `contratos:${clienteId}`;
}

/**
 * Gera chave de cache para faturas
 */
export function faturasCacheKey(clienteId: number): string {
  return `faturas:${clienteId}`;
}

/**
 * Gera chave de cache para logins
 */
export function loginsCacheKey(clienteId: number): string {
  return `logins:${clienteId}`;
}

/**
 * Gera chave de cache para consumo
 */
export function consumoCacheKey(loginId: number): string {
  return `consumo:${loginId}`;
}

// ============================================================================
// WRAPPER COM RETRY E CACHE
// ============================================================================

/**
 * Função auxiliar que tenta buscar do cache primeiro,
 * se não encontrar executa a função e cacheia o resultado
 */
export async function cacheOrFetch<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Tentar recuperar do cache
  const cached = cacheManager.get<T>(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // Se não está no cache, buscar
  ixcLogger.debug(`Executando fetch para ${cacheKey}`);
  const result = await fetchFn();

  // Armazenar no cache
  cacheManager.set(cacheKey, result, ttl);

  return result;
}

/**
 * Invalida cache relacionado a um cliente
 */
export function invalidateClienteCache(clienteId: number): void {
  const keysToDelete = [
    clienteCacheKey(clienteId),
    contratoCacheKey(clienteId),
    faturasCacheKey(clienteId),
    loginsCacheKey(clienteId),
  ];

  cacheManager.delMany(keysToDelete);
  ixcLogger.info(`Cache invalidado para cliente ${clienteId}`);
}

// ============================================================================
// CONFIGURAÇÕES DE TTL POR TIPO DE DADO
// ============================================================================

export const CacheTTL = {
  CLIENTE: 600, // 10 minutos - dados mudam raramente
  CONTRATO: 600, // 10 minutos
  FATURA: 300, // 5 minutos - dados financeiros mais dinâmicos
  LOGIN: 180, // 3 minutos
  CONSUMO: 60, // 1 minuto - dados em tempo real
  ONT: 120, // 2 minutos
  TICKET: 300, // 5 minutos
};

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================

export const cacheManager = new CacheManager({
  stdTTL: parseInt(process.env.CACHE_TTL || "300"),
});

// ============================================================================
// EXPORTS
// ============================================================================

export default cacheManager;