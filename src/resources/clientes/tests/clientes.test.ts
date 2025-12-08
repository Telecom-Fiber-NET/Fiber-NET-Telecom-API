const { describe, it, expect, jest, beforeEach, afterEach } = require('@jest/globals');
import { QueryBase } from "../../base";
import { Clientes } from "..";

jest.mock('../../base');

describe('Clientes', () => {
    let instance: Clientes;
    let mockRequest: any;
    let mockUpdate: any;

    beforeEach(() => {
        instance = new Clientes({
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

    describe('alterarSenhaHotsite', () => {
        it('deve chamar o método update com os parâmetros corretos', async () => {
            const clienteId = 123;
            const novaSenha = 'newPassword123';
            await instance.alterarSenhaHotsite(clienteId, novaSenha);

            expect(mockUpdate).toHaveBeenCalledWith('cliente', clienteId, { senha: novaSenha });
        });
    });
});
