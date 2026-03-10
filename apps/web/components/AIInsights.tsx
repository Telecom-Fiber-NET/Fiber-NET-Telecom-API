import React from 'react';
import { DashboardResponse } from '../types/api';

interface ContractHealthProps {
  data: DashboardResponse;
  onViewInvoices: () => void;
  compact?: boolean;
}

const AIInsights: React.FC<ContractHealthProps> = ({ data, onViewInvoices, compact = false }) => {
  // Lógica de Status
  const contrato = data.contratos[0];
  const login = data.logins[0];
  const faturasVencidas = data.faturas.filter(f => {
      const hoje = new Date();
      const venc = new Date(f.data_vencimento);
      return f.status === 'A' && venc < hoje;
  });
  const faturasAbertas = data.faturas.filter(f => f.status === 'A');

  // Helpers de UI
  const getSinalStatus = (sinal: string) => {
    const val = parseFloat(sinal);
    if (isNaN(val)) return { label: 'Sem Leitura', color: 'text-gray-400', icon: 'fa-question-circle', bg: 'bg-gray-500/20' };
    if (val > -25) return { label: 'Sinal Ótimo', color: 'text-green-400', icon: 'fa-check-circle', bg: 'bg-green-500/20' };
    if (val > -27) return { label: 'Sinal Regular', color: 'text-yellow-400', icon: 'fa-exclamation-circle', bg: 'bg-yellow-500/20' };
    return { label: 'Sinal Crítico', color: 'text-red-400', icon: 'fa-times-circle', bg: 'bg-red-500/20' };
  };

  const sinalStatus = getSinalStatus(login?.sinal_ultimo_atendimento || "0");
  const financeiroStatus = faturasVencidas.length > 0 
    ? { label: 'Faturas Vencidas', color: 'text-red-400', icon: 'fa-exclamation-circle', msg: `${faturasVencidas.length} fatura(s) vencida(s).`, btn: true }
    : faturasAbertas.length > 0 
        ? { label: 'Fatura em Aberto', color: 'text-blue-400', icon: 'fa-info-circle', msg: 'Existe uma fatura a vencer.', btn: true }
        : { label: 'Em dia', color: 'text-green-400', icon: 'fa-check-circle', msg: 'Todas as faturas pagas.', btn: false };

  return (
    <div
      className={`bg-[#003380] rounded-xl shadow-xl text-white border border-blue-800/50 relative overflow-hidden ${compact ? "mb-4 p-4" : "mb-8 p-6"
        }`}
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

      <div className={`relative z-10 flex items-center gap-3 ${compact ? "mb-1" : "mb-2"}`}>
        <div className={`rounded-lg bg-white/10 ${compact ? "p-1.5" : "p-2"}`}>
            <i className={`fas fa-heartbeat text-white ${compact ? "text-lg" : "text-xl"}`}></i>
        </div>
        <h3 className={`font-bold tracking-wide ${compact ? "text-lg" : "text-xl"}`}>Saúde do Contrato</h3>
      </div>
      
      <div className={`relative z-10 ml-1 flex items-center gap-2 ${compact ? "mb-4" : "mb-6"}`}>
          <div className={`bg-connect-accent rounded-full ${compact ? "h-5 w-1" : "h-6 w-1"}`}></div>
          <p className={`text-blue-100 ${compact ? "text-xs max-h-10 overflow-hidden leading-5" : "text-sm"}`}>
             {data.ai_analysis?.summary || "Sua conexão apresenta excelente estabilidade. O sinal óptico está ideal."}
          </p>
      </div>

      <div className={`relative z-10 grid grid-cols-1 md:grid-cols-3 ${compact ? "gap-3" : "gap-4"}`}>
        
        {/* Card 1: Contrato */}
        <div className={`bg-[#002255]/60 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between ${compact ? "min-h-[116px] p-3" : "min-h-[140px] p-4"}`}>
            <div>
                <div className={`flex items-center gap-2 ${compact ? "mb-1.5" : "mb-2"}`}>
                    <i className={`fas fa-file-contract ${contrato?.status === 'A' ? 'text-green-400' : 'text-red-400'}`}></i>
                    <span className={`font-bold ${compact ? "text-xs" : "text-sm"}`}>Contrato {contrato?.status === 'A' ? 'Ativo' : 'Inativo'}</span>
                </div>
                <p className={`text-gray-300 leading-relaxed ${compact ? "text-[11px]" : "text-xs"}`}>
                    Plano: <span className="text-white font-medium">{contrato?.plano}</span>
                    <br/>
                    ID: {contrato?.id}
                </p>
            </div>
             <div className={compact ? "mt-2" : "mt-3"}>
                 <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${contrato?.status === 'A' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                     {contrato?.status === 'A' ? 'Regular' : 'Bloqueado'}
                 </span>
            </div>
        </div>

        {/* Card 2: Sinal (Login) */}
        <div className={`bg-[#002255]/60 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between ${compact ? "min-h-[116px] p-3" : "min-h-[140px] p-4"}`}>
            <div>
                <div className={`flex items-center gap-2 ${compact ? "mb-1.5" : "mb-2"}`}>
                    <i className={`fas ${sinalStatus.icon} ${sinalStatus.color}`}></i>
                    <span className={`font-bold ${compact ? "text-xs" : "text-sm"}`}>{sinalStatus.label}</span>
                </div>
                <p className={`text-gray-300 leading-relaxed ${compact ? "text-[11px]" : "text-xs"}`}>
                    Potência de sinal <span className="text-white font-mono font-bold">{login?.sinal_ultimo_atendimento}</span> está na faixa ideal.
                </p>
            </div>
            <div className={`w-full overflow-hidden rounded-full bg-gray-700/50 ${compact ? "mt-2 h-1" : "mt-3 h-1.5"}`}>
                <div 
                    className={`h-full ${sinalStatus.color.replace('text-', 'bg-')}`} 
                    style={{ width: '95%' }}
                ></div>
            </div>
        </div>

        {/* Card 3: Financeiro */}
        <div className={`bg-[#002255]/60 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between ${compact ? "min-h-[116px] p-3" : "min-h-[140px] p-4"}`}>
            <div>
                <div className={`flex items-center gap-2 ${compact ? "mb-1.5" : "mb-2"}`}>
                    <i className={`fas ${financeiroStatus.icon} ${financeiroStatus.color}`}></i>
                    <span className={`font-bold ${compact ? "text-xs" : "text-sm"}`}>{financeiroStatus.label}</span>
                </div>
                <p className={`text-gray-300 leading-relaxed ${compact ? "text-[11px]" : "text-xs"}`}>
                    {financeiroStatus.msg}
                </p>
            </div>
            {financeiroStatus.btn && (
                <button 
                    onClick={onViewInvoices}
                    className={`text-xs bg-connect-accent text-white rounded-full font-bold hover:bg-white hover:text-connect-blue transition-all shadow-sm w-fit ${compact ? "mt-2 px-3 py-1" : "mt-3 px-4 py-1.5"}`}
                >
                    Ver Faturas
                </button>
            )}
        </div>

      </div>
    </div>
  );
};

export default AIInsights;
