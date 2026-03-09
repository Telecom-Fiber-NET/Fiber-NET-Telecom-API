import "dotenv/config";
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { ixcLogger } from '../utils/logger';
import { ixcService } from '../services/ixcServiceClass'; // Import ixcServiceClass

// Placeholder for JWT_SECRET - will be read from env in actual implementation
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dev_key';

interface AuthenticatedRequest extends IncomingMessage {
    userId?: string;
}

/**
 * Authenticates a WebSocket connection using a JWT token from the URL.
 * @param req The incoming HTTP request.
 * @returns The customerId if authentication is successful, otherwise throws an error.
 */
export const authenticateWebSocket = (req: IncomingMessage): string => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
        ixcLogger.warn('WebSocket authentication failed: No token provided');
        throw new Error('Unauthorized: No token provided');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        (req as AuthenticatedRequest).userId = decoded.id;
        ixcLogger.info('Token authenticated', { userId: decoded.id });
        return decoded.id;
    } catch (err) {
        ixcLogger.warn('WebSocket authentication failed: Invalid token', { error: (err as Error).message });
        throw new Error('Unauthorized: Invalid token');
    }
};

/**
 * Builds the customer context for the AI.
 * This is a placeholder and should be implemented to fetch real customer data.
 * @param customerId The ID of the customer.
 * @returns A promise resolving to the customer context object.
 */
export const buildCustomerContext = async (customerId: string): Promise<any> => {
    ixcLogger.info('Building customer context for AI', { customerId });

    try {
        const customerIdNum = parseInt(customerId);
        if (isNaN(customerIdNum)) {
            throw new Error(`Invalid customerId: ${customerId}`);
        }

        const cliente = await ixcService.buscarClientePorId(customerIdNum);
        const faturas = await ixcService.financeiroListar(customerIdNum);
        const logins = await ixcService.loginsListar(customerIdNum);

        const openInvoicesCount = faturas.filter(f => f.status === 'A').length;
        const activeConnectionsCount = logins.filter(l => l.status === 'A').length;

        return {
            customerId: customerIdNum,
            customerName: cliente?.razao || cliente?.fantasia || 'Cliente Desconhecido',
            customerEmail: cliente?.hotsite_email,
            openInvoices: openInvoicesCount,
            totalInvoices: faturas.length,
            activeConnections: activeConnectionsCount,
            totalConnections: logins.length,
            // Add more relevant customer data as needed
        };
    } catch (error) {
        ixcLogger.error('Failed to build customer context', { customerId, error: (error as Error).message });
        return {
            customerId,
            customerName: 'Cliente Desconhecido',
            error: 'Failed to retrieve full customer context',
        };
    }
};
