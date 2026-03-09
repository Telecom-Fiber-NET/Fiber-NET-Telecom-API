import React, { useState } from 'react';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import GradientBackground from '../components/GradientBackground';
import Header from '../components/Header';
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

const DATE_FORMATTER_PT_BR = new Intl.DateTimeFormat('pt-BR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const parseDateInput = (value?: string) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const [datePart, timePartRaw] = raw.split(' ');
  const timePart = timePartRaw || '12:00:00';

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(datePart)) {
    const [day, month, year] = datePart.split('/').map(Number);
    const [hour, minute, second] = timePart.split(':').map((part) => Number(part || 0));
    const parsed = new Date(year, month - 1, day, hour || 12, minute || 0, second || 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second] = timePart.split(':').map((part) => Number(part || 0));
    const parsed = new Date(year, month - 1, day, hour || 12, minute || 0, second || 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const isoCandidate = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const parsed = new Date(isoCandidate);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const formatDatePtBr = (value?: string) => {
  if (!value) return '--/--/----';
  const parsed = parseDateInput(value);
  if (!parsed) return value;
  return DATE_FORMATTER_PT_BR.format(parsed);
};

export const PublicInvoice: React.FC = () => {
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
        setError('Nenhuma fatura em aberto encontrada para este CPF/CNPJ.');
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
        alert('Código PIX não disponível para esta fatura no momento.');
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
          alert('Código PIX não disponível para esta fatura.');
          return;
        }
      } catch (error) {
        alert('Erro ao gerar o código PIX para compartilhamento.');
        return;
      } finally {
        setLoadingPixId(null);
      }
    }

    if (code) {
      financeiroService.sharePixWhatsApp(code);
    }
  };

  return (
    <GradientBackground>
      <FloatingWhatsApp />
      <Header />

      <div className="flex min-h-screen items-center justify-center px-4 py-12 pt-24">
        <div className="max-w-4xl w-full space-y-6">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-connect-dark">
                2ª Via de Boleto
              </h2>
              <p className="mt-2 text-gray-600">
                Consulte e pague suas faturas em aberto
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label htmlFor="cpfCnpj" className="block text-sm font-semibold text-gray-700 mb-2">
                  CPF/CNPJ
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-id-card text-gray-400"></i>
                  </div>
                  <input
                    id="cpfCnpj"
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

            {error && (
              <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-center">
                  <i className="fas fa-exclamation-circle text-red-500 mr-3"></i>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>

          {searchPerformed && invoices.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white text-center">
                Faturas Encontradas ({invoices.length})
              </h3>

              {invoices.map((invoice) => (
                <div
                  key={invoice.id_titulo}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-file-invoice text-connect-blue text-xl"></i>
                        <h4 className="text-lg font-bold text-connect-dark">
                          Fatura #{invoice.nosso_numero}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-calendar text-gray-400"></i>
                          <span className="text-gray-600">
                            Vencimento: <strong className="text-gray-900">{formatDate(invoice.vencimento)}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="fas fa-dollar-sign text-gray-400"></i>
                          <span className="text-gray-600">
                            Valor: <strong className="text-connect-orange text-lg">{formatCurrency(invoice.valor)}</strong>
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

                      {invoice.linha_digitavel && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between gap-2">
                            <code className="text-xs text-gray-700 font-mono break-all">
                              {invoice.linha_digitavel}
                            </code>
                            <button
                              onClick={() => copyToClipboard(invoice.linha_digitavel!)}
                              className="flex-shrink-0 text-connect-blue hover:text-connect-orange transition-colors"
                              title="Copiar código"
                            >
                              <i className="fas fa-copy"></i>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 md:w-48">
                      <button
                        onClick={() => openPixModal(invoice)}
                        disabled={loadingPixId === (invoice.id || invoice.id_titulo)}
                        className="w-full bg-connect-blue hover:bg-connect-dark text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {loadingPixId === (invoice.id || invoice.id_titulo) ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fas fa-qrcode"></i>
                        )}
                        <span>{loadingPixId === (invoice.id || invoice.id_titulo) ? 'Gerando...' : 'Pagar com PIX'}</span>
                      </button>
                      <button
                        onClick={() => sharePix(invoice)}
                        disabled={loadingPixId === (invoice.id || invoice.id_titulo)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
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
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                          >
                            <i className="fas fa-barcode"></i>
                            <span>Copiar Código</span>
                          </button>
                          <button
                            onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Segue a linha digitável para pagamento:\n\n${invoice.linha_digitavel}`)}`, '_blank')}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                          >
                            <i className="fab fa-whatsapp"></i>
                            <span>Enviar Código</span>
                          </button>
                        </>
                      )}

                      {(invoice.url_2via || invoice.link_pdf) && (
                        <button
                          onClick={() => financeiroService.downloadPdf(invoice.id || invoice.id_titulo)}
                          className="w-full bg-connect-orange hover:bg-connect-orange-dark text-white font-bold py-2 px-4 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-file-pdf"></i>
                          <span>Baixar PDF</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchPerformed && invoices.length === 0 && !error && !isLoading && (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <i className="fas fa-check-circle text-green-500 text-5xl mb-4"></i>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Nenhuma fatura em aberto
              </h3>
              <p className="text-gray-600">
                Parabéns! Você não possui faturas pendentes no momento.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal PIX */}
      {pixModalOpen && selectedPix && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full relative shadow-2xl">
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
              <button onClick={() => copyToClipboard(selectedPix.code)} className="w-full bg-connect-accent hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"><i className="fas fa-copy"></i> Copiar Código PIX</button>
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
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900/90 text-white px-6 py-3 rounded-full shadow-2xl z-[150] flex items-center gap-3 backdrop-blur-sm transition-all animate-bounce">
          <i className="fas fa-check-circle text-green-400 text-xl"></i>
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </GradientBackground>
  );
};

export default PublicInvoice;
