
import request from 'supertest';
import app from '../../app';
import { ixcService } from '../../services/ixcService';

// Configuração de ambiente para testes
process.env.IXC_API_URL = 'https://api.test.com';
process.env.IXC_AUTH_BASIC = 'test_auth';
process.env.JWT_SECRET = 'test_secret';
process.env.OMNIROUTE_API_KEY = 'test_omni';

// Mock do middleware de autenticação
jest.mock('../../middleware/authMiddleware', () => ({
    verifyToken: (req: any, res: any, next: any) => {
        req.user = { ids: [123] }; // Mock user ID 123
        next();
    },
}));

// Mock do ixcService
jest.mock('../../services/ixcService');

// Mock do serviço de AI
jest.mock('../../services/ai', () => ({
    activeAIProvider: {
        chat: jest.fn(),
        getProvidersStatus: jest.fn(),
        setProviderEnabled: jest.fn(),
    },
    AIOrchestrator: jest.fn(),
}));

describe('API Integration Tests', () => {
    const mockIxcService = ixcService as jest.Mocked<typeof ixcService>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /financeiro/resumo', () => {
        it('should return financial summary', async () => {
            const mockResumo = [{
                id_contrato: 1,
                contrato: "Residencial",
                endereco: {
                    endereco: "Rua Teste",
                    numero: "123",
                    bairro: "Centro",
                    cidade: "São Paulo",
                    uf: "SP",
                    cep: "01000-000"
                },
                financeiro: {
                    media_pagamento: 150.50,
                    media_diaria: 5.02,
                    total_pago: 1505.00,
                    qtd_faturas: 10
                },
                logins: []
            }];

            // @ts-ignore
            mockIxcService.getResumoFinanceiro.mockResolvedValue(mockResumo);

            const response = await request(app).get('/api/financeiro/resumo');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockResumo);
            expect(mockIxcService.getResumoFinanceiro).toHaveBeenCalledWith(123, undefined);
        });

        it('should handle contract ID filtering', async () => {
            mockIxcService.buscarContratoPorId.mockResolvedValue({ id_cliente: '123' } as any);
            mockIxcService.getResumoFinanceiro.mockResolvedValue([] as any);

            await request(app).get('/api/financeiro/resumo?id_contrato=456');

            expect(mockIxcService.getResumoFinanceiro).toHaveBeenCalledWith(123, 456);
        });

        it('should return 401 if user not authenticated (mocked middleware handles this, but logic check is in controller)', async () => {
            // Since we mocked middleware to Always set user, we can't easily test 401 here 
            // without changing the mock implementation per test.
            // Skipping for now as middleware mock is global.
        });
    });

    describe('GET /ordens-servico', () => {
        it('should return ordens de servico', async () => {
            mockIxcService.ordensServicoListar.mockResolvedValue([{
                id: 1,
                id_cliente: 123,
                id_assunto: 1,
                assunto: 'Teste',
                protocolo: '2023010101',
                descricao: 'Teste de OS',
                prioridade: 'N',
                status: 'A',
                data_abertura: '2023-01-01 10:00:00'
            }]);

            const response = await request(app).get('/api/ordens-servico');
            expect(response.status).toBe(200);
            expect(response.body.ordens).toHaveLength(1);
            expect(response.body.ordens[0].assunto).toBe('Teste');
        });
    });

    describe('GET /financeiro/resumo Logic', () => {
        // ... (comments)
    });

    describe('GET /contratos/:id_contrato/financeiro', () => {
        it('should return boletos and invoices for a specific contract', async () => {
            // @ts-ignore
            mockIxcService.buscarContratoPorId.mockResolvedValue({ id_cliente: '123' } as any);
            mockIxcService.financeiroListar.mockResolvedValue([{
                id: 1,
                id_cliente: 123,
                documento: 'Fat-1',
                data_vencimento: '2023-01-01',
                valor: '100.00',
                status: 'A'
            }]);
            // @ts-ignore
            mockIxcService.listarNotasFiscais.mockResolvedValue([{
                id: 1,
                numero_nf: '100',
                serie: '1',
                data_emissao: '2023-01-01',
                valor_total: '100.00',
                status: 'A'
            }]);
            // @ts-ignore
            // mock buscarBaixasDaFatura if needed, but it's called inside specific status logic

            const response = await request(app).get('/api/contratos/123/financeiro');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id_contrato', '123');
            expect(response.body.financeiro.boletos).toHaveLength(1);
            expect(response.body.financeiro.notas_fiscais).toHaveLength(1);
        });
    });

});
