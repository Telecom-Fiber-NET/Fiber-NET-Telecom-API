import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import { financeiroService } from '../services/financeiroService';

interface Invoice {
    id?: number;
    id_titulo: string;
    nosso_numero: string;
    data_vencimento: string;
    data_vencimento_original: string;
    valor: string;
    status: string;
    linha_digitavel?: string;
    url_2via?: string;
    link_pdf?: string;
    pix_code?: string;
    pix_qrcode?: string;
    juros?: number;
    multa?: number;
    desconto?: number;
    valor_original?: number;
    valor_atualizado?: number;
    dias_atraso?: number;
    encargos_origem?: 'api' | 'estimado';
}

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose }) => {
    const [cpfCnpj, setCpfCnpj] = useState('');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [pixModalOpen, setPixModalOpen] = useState(false);
    const [selectedPix, setSelectedPix] = useState<{ code: string; qrcode?: string } | null>(null);
    const [toastMessage, setToastMessage] = useState('');
    const [loadingPixId, setLoadingPixId] = useState<string | number | null>(null);

    const formatDate = (dateInput?: string | number | Date) => {
        if (!dateInput) return "--/--/----";
        try {
            const date = new Date(dateInput);
            if (isNaN(date.getTime())) return String(dateInput);
            return new Intl.DateTimeFormat("pt-BR").format(date);
        } catch {
            return String(dateInput);
        }
    };

    const formatCpfCnpj = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    };

    const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCpfCnpj(e.target.value);
        setCpfCnpj(formatted);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        setSearchPerformed(true);

        try {
            const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');
            const faturas = await financeiroService.buscarParaConsultaRapida(cleanCpfCnpj);
            setInvoices(faturas as any);
            if (faturas.length === 0) {
                setError('Nenhuma fatura em aberto encontrada.');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao buscar faturas. Tente novamente.');
            setInvoices([]);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        financeiroService.copyToClipboard(text);
        setToastMessage('Código copiado para a área de transferência!');
        setTimeout(() => setToastMessage(''), 3000);
    };

    const formatCurrency = (value?: number) => {
        return financeiroService.formatCurrency(value);
    };

    const handleClose = () => {
        setCpfCnpj('');
        setInvoices([]);
        setError('');
        setSearchPerformed(false);
        onClose();
    };

    const openPixModal = async (invoice: Invoice) => {
        if (invoice.pix_code) {
            setSelectedPix({ code: invoice.pix_code, qrcode: invoice.pix_qrcode });
            setPixModalOpen(true);
            return;
        }

        const id = invoice.id || invoice.id_titulo;
        setLoadingPixId(id);
        try {
            const data = await apiService.getPixCode(id);
            if (data.pix_code) {
                setInvoices((prev) =>
                    prev.map((inv) =>
                        String(inv.id || inv.id_titulo) === String(id)
                            ? { ...inv, pix_code: data.pix_code, pix_qrcode: data.qr_code }
                            : inv
                    )
                );
                setSelectedPix({ code: data.pix_code, qrcode: data.qr_code });
                setPixModalOpen(true);
            } else {
                alert('Código PIX não disponível para esta fatura.');
            }
        } catch (error) {
            alert('Erro ao gerar o código PIX. Tente novamente.');
        } finally {
            setLoadingPixId(null);
        }
    };

    const sharePix = async (invoice: Invoice) => {
        let code = invoice.pix_code;
        if (!code) {
            const id = invoice.id || invoice.id_titulo;
            setLoadingPixId(id);
            try {
                const data = await apiService.getPixCode(id);
                if (data.pix_code) {
                    code = data.pix_code;
                    setInvoices((prev) =>
                        prev.map((inv) =>
                            String(inv.id || inv.id_titulo) === String(id)
                                ? { ...inv, pix_code: data.pix_code, pix_qrcode: data.qr_code }
                                : inv
                        )
                    );
                } else {
                    alert('Código PIX não disponível.');
                    return;
                }
            } catch (error) {
                alert('Erro ao gerar o código PIX.');
                return;
            } finally {
                setLoadingPixId(null);
            }
        }

        if (code) {
            financeiroService.sharePixWhatsApp(code);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-connect-dark">
                        <i className="fas fa-file-invoice mr-2"></i>
                        Consultar 2ª Via de Boleto
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <i className="fas fa-times text-2xl"></i>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div>
                            <label htmlFor="modal-cpfCnpj" className="block text-sm font-semibold text-gray-700 mb-2">
                                Digite seu CPF ou CNPJ
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <i className="fas fa-id-card text-gray-400"></i>
                                </div>
                                <input
                                    id="modal-cpfCnpj"
                                    type="text"
                                    value={cpfCnpj}
                                    onChange={handleCpfCnpjChange}
                                    placeholder="000.000.000-00"
                                    maxLength={18}
                                    required
                                    className="block w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-connect-orange focus:border-connect-orange transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-connect-orange hover:bg-connect-orange-dark text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    <span>Buscando...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-search"></i>
                                    <span>Buscar Faturas</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                            <div className="flex items-center">
                                <i className="fas fa-exclamation-circle text-red-500 mr-3"></i>
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Invoices List */}
                    {searchPerformed && invoices.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-connect-dark">
                                Faturas Encontradas ({invoices.length})
                            </h3>

                            {invoices.map((invoice) => (
                                <div
                                    key={invoice.id_titulo}
                                    className="border-2 border-gray-200 rounded-xl p-4 hover:border-connect-orange transition-colors"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        {/* Invoice Info */}
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <i className="fas fa-file-invoice text-connect-blue"></i>
                                                <h4 className="font-bold text-connect-dark">
                                                    Fatura #{invoice.nosso_numero}
                                                </h4>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <i className="fas fa-calendar text-gray-400"></i>
                                                    <span className="text-gray-600">
                                                        Vencimento: <strong>{formatDate(invoice.vencimento)}</strong>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <i className="fas fa-dollar-sign text-gray-400"></i>
                                                    <span className="text-gray-600">
                                                        Valor: <strong className="text-connect-orange">{formatCurrency(invoice.valor)}</strong>
                                                    </span>
                                                </div>
                                            </div>

                                            {invoice.isVencida && (
                                                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs">
                                                    <div className="flex items-center justify-between text-red-800 font-bold">
                                                        <span>Total Atualizado</span>
                                                        <span>{formatCurrency(invoice.valor_atualizado || invoice.valor)}</span>
                                                    </div>
                                                    <p className="text-[10px] text-red-600 mt-1">Fatura vencida. Encargos inclusos no PIX.</p>
                                                </div>
                                            )}

                                            {invoice.labelContrato && (
                                                <div className="mt-2 text-[10px] text-gray-400 font-bold uppercase">
                                                    {invoice.labelContrato}
                                                </div>
                                            )}

                                            {/* Linha Digitável */}
                                            {invoice.linha_digitavel && (
                                                <div className="mt-2 p-2 bg-gray-50 rounded">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <code className="text-xs text-gray-700 font-mono break-all">
                                                            {invoice.linha_digitavel}
                                                        </code>
                                                        <button
                                                            onClick={() => copyToClipboard(invoice.linha_digitavel!)}
                                                            className="flex-shrink-0 text-connect-blue hover:text-connect-orange transition-colors"
                                                        >
                                                            <i className="fas fa-copy"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col gap-2 md:w-40">
                                            <button
                                                onClick={() => openPixModal(invoice)}
                                                disabled={loadingPixId === (invoice.id || invoice.id_titulo)}
                                                className="w-full bg-connect-blue hover:bg-connect-dark text-white font-bold py-2 px-4 rounded-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {loadingPixId === (invoice.id || invoice.id_titulo) ? (
                                                    <i className="fas fa-spinner fa-spin"></i>
                                                ) : (
                                                    <i className="fas fa-qrcode"></i>
                                                )}
                                                <span>{loadingPixId === (invoice.id || invoice.id_titulo) ? 'Gerando...' : 'Pagar PIX'}</span>
                                            </button>
                                            <button
                                                onClick={() => sharePix(invoice)}
                                                disabled={loadingPixId === (invoice.id || invoice.id_titulo)}
                                                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                                            >
                                                {loadingPixId === (invoice.id || invoice.id_titulo) ? (
                                                    <i className="fas fa-spinner fa-spin"></i>
                                                ) : (
                                                    <i className="fab fa-whatsapp"></i>
                                                )}
                                                <span>{loadingPixId === (invoice.id || invoice.id_titulo) ? 'Gerando...' : 'Enviar PIX'}</span>
                                            </button>

                                            {invoice.linha_digitavel && (
                                                <>
                                                    <button
                                                        onClick={() => copyToClipboard(invoice.linha_digitavel!)}
                                                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                                                    >
                                                        <i className="fas fa-barcode"></i>
                                                        <span>Código</span>
                                                    </button>
                                                    {/* <button
                                                        onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Segue a linha digitável:\n\n${invoice.linha_digitavel}`)}`, '_blank')}
                                                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                                                    >
                                                        <i className="fab fa-whatsapp"></i>
                                                        <span>Enviar</span>
                                                    </button> */}
                                                </>
                                            )}

                                            {(invoice.url_2via || invoice.link_pdf) && (
                                                <button
                                                    onClick={() => financeiroService.downloadPdf(invoice.id || invoice.id_titulo)}
                                                    className="w-full bg-connect-orange hover:bg-connect-orange-dark text-white font-bold py-2 px-4 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                                                >
                                                    <i className="fas fa-file-pdf"></i>
                                                    <span>PDF</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* No Results */}
                    {searchPerformed && invoices.length === 0 && !error && !isLoading && (
                        <div className="text-center py-8">
                            <i className="fas fa-check-circle text-green-500 text-5xl mb-4"></i>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Nenhuma fatura em aberto
                            </h3>
                            <p className="text-gray-600">
                                Parabéns! Você não possui faturas pendentes.
                            </p>
                        </div>
                    )}
                </div>

                {/* Modal PIX Interno */}
                {pixModalOpen && selectedPix && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full relative shadow-2xl border border-gray-200">
                            <button
                                onClick={() => setPixModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <i className="fas fa-times text-xl"></i>
                            </button>
                            <h3 className="text-xl font-bold text-connect-dark text-center mb-1">Pagamento via PIX</h3>
                            <p className="text-center text-gray-500 text-sm mb-6">Escaneie o QR Code ou use o Copia e Cola</p>

                            {(selectedPix.qrcode || selectedPix.code) && (
                                <div className="bg-white p-4 rounded-xl mx-auto w-fit mb-6 flex items-center justify-center border border-gray-200 shadow-inner">
                                    <img
                                        src={
                                            selectedPix.qrcode
                                                ? (selectedPix.qrcode.startsWith('data:image') || selectedPix.qrcode.includes('?') || selectedPix.qrcode.startsWith('http')
                                                    ? selectedPix.qrcode
                                                    : `data:image/png;base64,${selectedPix.qrcode}`)
                                                : `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(selectedPix.code)}`
                                        }
                                        alt="QR Code Pix"
                                        className="w-[180px] h-[180px] object-contain"
                                    />
                                </div>
                            )}

                            <div className="bg-blue-50 p-3 rounded-lg mb-4 max-h-24 overflow-y-auto border border-blue-100">
                                <p className="text-xs text-connect-blue font-mono break-all text-center">{selectedPix.code}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => copyToClipboard(selectedPix.code)} className="w-full bg-connect-accent hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"><i className="fas fa-copy"></i> Copiar Código</button>
                                <button
                                    onClick={() => {
                                        const text = `Segue o código PIX para pagamento:\n\n${selectedPix.code}`;
                                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                                    }}
                                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <i className="fab fa-whatsapp"></i>
                                    <span>Enviar PIX</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toast Notification */}
                {toastMessage && (
                    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900/90 text-white px-6 py-3 rounded-full shadow-2xl z-[150] flex items-center gap-3 backdrop-blur-sm transition-all">
                        <i className="fas fa-check-circle text-green-400 text-xl"></i>
                        <span className="font-medium">{toastMessage}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvoiceModal;
