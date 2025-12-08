const { describe, it, expect, jest, beforeEach, afterEach } = require('@jest/globals');
import { QueryBase } from "../../base";
// FIX: Updated import to use the renamed 'Financeiros' class.
import { Financeiros } from "..";

jest.mock('../../base');

// FIX: Updated describe block to refer to 'Financeiros'.
describe('Financeiros', () => {
    // FIX: Updated type to use the renamed 'Financeiros' class.
    let instance: Financeiros;
    let mockRequest: any;

    beforeEach(() => {
        // FIX: Updated instantiation to use the renamed 'Financeiros' class.
        instance = new Financeiros({
            token: 'fake-token',
            baseUrl: 'https://fake-url.com',
        });
        mockRequest = jest.spyOn(QueryBase.prototype, 'request').mockResolvedValue({ registros: [] });
    });

    afterEach(() => {
        mockRequest.mockRestore();
    });

    describe('listar', () => {
        it('deve chamar a API com os parâmetros corretos para listar por cliente', async () => {
            await instance.listar({ id_cliente: 123 });

            expect(mockRequest).toHaveBeenCalledWith('fn_areceber', {
                qtype: 'fn_areceber.id_cliente',
                query: '123',
                oper: '=',
                page: '1',
                sortname: 'fn_areceber.id',
                sortorder: 'desc',
            });
        });

        it('deve retornar a lista de registros da resposta', async () => {
            const mockFaturas = [{ id: 1, valor: '100.00' }, { id: 2, valor: '150.00' }];
            mockRequest.mockResolvedValue({ registros: mockFaturas });

            const result = await instance.listar({ status: 'A' });
            expect(result).toEqual(mockFaturas);
        });

         it('deve retornar uma lista vazia se não houver registros', async () => {
            mockRequest.mockResolvedValue({ registros: [] });
            const result = await instance.listar({ id_cliente: 999 });
            expect(result).toEqual([]);
        });
    });
});