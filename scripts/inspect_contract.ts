
import { ixcService } from '../src/services/ixcService';

async function run() {
    try {
        const contracts = await ixcService.buscarContratosPorIdCliente(1);
        const logins = await ixcService.loginsListar(1);

        if (contracts.length > 0) {
            console.log('Contract Keys:', Object.keys(contracts[0]));
            // Check for any field containing 'endereco' or 'id_'
            const addressKeys = Object.keys(contracts[0]).filter(k => k.includes('endereco') || k.startsWith('id_'));
            console.log('Contract Address/ID Keys:', addressKeys);

            // Log values for these keys
            const relevantValues = {};
            addressKeys.forEach(k => relevantValues[k] = contracts[0][k]);
            console.log('Contract Values:', relevantValues);
        }

        if (logins.length > 0) {
            console.log('Login Keys:', Object.keys(logins[0]));
            // Check for address in login
            const loginAddressKeys = Object.keys(logins[0]).filter(k => k.includes('endereco') || k.startsWith('id_'));
            const relevantLoginValues = {};
            loginAddressKeys.forEach(k => relevantLoginValues[k] = logins[0][k]);
            console.log('Login Address/ID Values:', relevantLoginValues);
        } else {
            console.log('No logins found.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
