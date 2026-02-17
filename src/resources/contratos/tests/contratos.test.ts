const { describe, it, expect, jest, beforeEach, afterEach } = require('@jest/globals');
import ContratosResource from "..";
import { QueryBase } from "../../base";

jest.mock('../../base');

describe('ContratosResource', () => {
    let instance: ContratosResource;
    let mockRequest: any;
    let mockUpdate: any;

    beforeEach(() => {
        instance = new ContratosResource({
            token: 'fake-token',
            baseUrl: 'https://fake-url.com',
        });
        mockRequest = jest.spyOn(QueryBase.prototype, 'request').mockResolvedValue({ registros: [] });
        mockUpdate = jest.spyOn(QueryBase.prototype, 'update').mockResolvedValue({ success: true });
    });

    afterEach(() => {
        mockRequest.mockRestore();
        mockUpdate.mockRestore();
    });

    // ... testes existentes ...

    describe('desbloqueioConfianca', () => {
        it('deve chamar o método update com o payload correto', async () => {
            const contratoId = 456;
            await instance.desbloqueioConfianca(contratoId);
            expect(mockUpdate).toHaveBeenCalledWith('cliente_contrato', contratoId, { desbloqueio_confianca: 'S' });
        });
    });
});
