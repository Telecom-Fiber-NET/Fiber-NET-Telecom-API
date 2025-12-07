module.exports = {
  // Preset para TypeScript
  preset: 'ts-jest',
  
  // Ambiente de testes
  testEnvironment: 'node',
  
  // Diretório raiz dos testes
  roots: ['<rootDir>/src'],
  
  // Padrões de arquivos de teste
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // Transformação de arquivos
  transform: {
    '^.+\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  
  // Extensões de módulos
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Mapeamento de módulos (alias)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  
  // Cobertura de código
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
  ],
  
  // Diretório de cobertura
  coverageDirectory: 'coverage',
  
  // Reporters de cobertura
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Limite de cobertura
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Setup antes dos testes
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  
  // Timeout dos testes
  testTimeout: 10000,
  
  // Limpar mocks automaticamente
  clearMocks: true,
  
  // Verbose
  verbose: true,
  
  // Arquivos a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],
};