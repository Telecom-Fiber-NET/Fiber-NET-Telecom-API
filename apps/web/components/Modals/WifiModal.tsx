import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import Button from '../Button';

interface WifiModalProps {
  isOpen: boolean;
  onClose: () => void;
  loginId: number | string;
  currentSsid: string;
}

const WifiModal: React.FC<WifiModalProps> = ({ isOpen, onClose, loginId, currentSsid }) => {
  const [ssid, setSsid] = useState(currentSsid);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSsid(currentSsid);
      setPassword('');
      setError('');
    }
  }, [isOpen, currentSsid]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssid || !password) {
      setError('Por favor, preencha o nome da rede e a nova senha.');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.updateWifi(loginId, ssid, password);
      alert('Wi-Fi atualizado com sucesso! Pode levar alguns minutos para aplicar.');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar o Wi-Fi. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full relative shadow-2xl animate-scaleIn">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <i className="fas fa-times text-xl"></i>
        </button>
        
        <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
          <div className="bg-blue-50 text-connect-blue w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner">
            <i className="fas fa-wifi"></i>
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-800">Alterar Wi-Fi</h3>
            <p className="text-xs text-gray-500">Configure o nome e senha da sua rede</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-start gap-2">
            <i className="fas fa-exclamation-circle mt-0.5"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Nome da Rede (SSID)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-network-wired text-gray-400"></i>
              </div>
              <input
                type="text"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-connect-blue focus:border-transparent transition-all"
                placeholder="Ex: Minha Casa 5G"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Nova Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-lock text-gray-400"></i>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-connect-blue focus:border-transparent transition-all"
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} fullWidth className="!bg-gray-100 !text-gray-600 hover:!bg-gray-200">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-circle-notch fa-spin"></i> Salvando...
                </span>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WifiModal;