import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import GradientBackground from '../components/GradientBackground';
import Header from '../components/Header';
import InvoiceModal from '../components/InvoiceModal';
import { apiService } from '../services/apiService';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await apiService.login({
        email: email.trim(),
        password: senha,
      });

      if (data.token) {
        if (data.user?.ids_vinculados?.length > 0) {
          apiService.setProfileId(data.user.ids_vinculados[0]);
        }
        navigate('/dashboard');
      } else {
        setError(data.message || 'Credenciais inválidas');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GradientBackground>
      <FloatingWhatsApp />
      <Header onInvoiceClick={() => setIsInvoiceModalOpen(true)} />
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />

      <div className="flex min-h-screen items-center justify-center px-4 py-12 pt-24">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
            <div className="text-center">
              <img
                src="https://vempraconnect.com.br/wp-content/uploads/2023/10/Logo-01.png"
                alt="Connect Telecom"
                className="h-16 w-auto mx-auto mb-4"
              />
              <h2 className="text-3xl font-bold text-connect-dark">
                Área do Cliente
              </h2>
              <p className="mt-2 text-gray-600">
                Acesse sua conta para gerenciar seus serviços
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-center">
                  <i className="fas fa-exclamation-circle text-red-500 mr-3"></i>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-envelope text-gray-400"></i>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    required
                    className="block w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-connect-orange focus:border-connect-orange transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="senha" className="block text-sm font-semibold text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-lock text-gray-400"></i>
                  </div>
                  <input
                    id="senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    className="block w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-connect-orange focus:border-connect-orange transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-connect-blue transition-colors"
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <i className={`fas ${mostrarSenha ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
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
                    <span>Entrando...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt"></i>
                    <span>Entrar</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-gray-200 space-y-3">
              <button
                onClick={() => setIsInvoiceModalOpen(true)}
                className="block w-full text-center text-connect-blue hover:text-connect-orange font-medium transition-colors"
              >
                <i className="fas fa-file-invoice mr-2"></i>
                Emitir 2ª via de boleto
              </button>
              <a
                href="https://vempraconnect.com.br/fale-conosco/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-gray-600 hover:text-connect-orange text-sm transition-colors"
              >
                <i className="fas fa-question-circle mr-2"></i>
                Esqueceu sua senha?
              </a>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-white text-sm">
              Ainda não é cliente?{' '}
              <a
                href="https://wa.me/556434347600"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-connect-accent hover:underline"
              >
                Assine agora pelo WhatsApp
              </a>
            </p>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
};

export default Login;
