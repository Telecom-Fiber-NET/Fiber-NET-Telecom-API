import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '../../services/apiService';
import { Contrato, Login } from '../../types/api';
import Button from '../Button';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contracts?: Contrato[];
  logins?: Login[];
  selectedContractId?: number | string | null;
}

const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contracts = [],
  logins = [],
  selectedContractId,
}) => {
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [contratoId, setContratoId] = useState<number | string | ''>('');
  const [loginId, setLoginId] = useState<number | string | ''>('');
  const [loading, setLoading] = useState(false);

  const loginsDoContrato = useMemo(() => {
    if (!contratoId) return logins;
    return logins.filter((login) => String(login.contrato_id) === String(contratoId));
  }, [contratoId, logins]);

  useEffect(() => {
    if (!isOpen) return;
    const initialContract = selectedContractId ?? contracts[0]?.id ?? '';
    setContratoId(initialContract);
    setLoginId('');
  }, [isOpen, selectedContractId, contracts]);

  useEffect(() => {
    if (!loginId) return;
    const loginValido = loginsDoContrato.some((login) => String(login.id) === String(loginId));
    if (!loginValido) {
      setLoginId('');
    }
  }, [loginId, loginsDoContrato]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.createTicket({
        assunto,
        mensagem,
        contratoId: contratoId ? Number(contratoId) : undefined,
      });
      onSuccess();
      onClose();
      setAssunto('');
      setMensagem('');
      setContratoId('');
      setLoginId('');
    } catch (error) {
      alert('Erro ao abrir chamado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <i className="fas fa-times text-xl"></i>
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-4">Novo Atendimento</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
            <select
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-connect-primary focus:border-connect-primary"
              required
            >
              <option value="">Selecione um motivo...</option>
              <option value="Suporte Técnico">Suporte Técnico</option>
              <option value="Financeiro">Financeiro</option>
              <option value="Comercial">Comercial</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          {contracts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contrato</label>
              <select
                value={contratoId}
                onChange={(e) => setContratoId(e.target.value ? Number(e.target.value) : '')}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-connect-primary focus:border-connect-primary"
              >
                <option value="">Selecionar automaticamente</option>
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    #{contract.id} - {contract.plano}
                  </option>
                ))}
              </select>
            </div>
          )}

          {logins.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conexão (opcional)</label>
              <select
                value={loginId}
                onChange={(e) => setLoginId(e.target.value ? Number(e.target.value) : '')}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-connect-primary focus:border-connect-primary"
              >
                <option value="">Sem login específico</option>
                {loginsDoContrato.map((login) => (
                  <option key={login.id} value={login.id}>
                    {login.login}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-connect-primary focus:border-connect-primary"
              placeholder="Descreva sua solicitação com detalhes..."
              required
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Abrir Chamado'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTicketModal;
