import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";
import { financeiroService } from "../services/financeiroService";
import { contratoService } from "../services/contratoService";
import { suporteService } from "../services/suporteService";
import { notaFiscalService } from "../services/notaFiscalService";
import ConsumptionChart from "../components/ConsumptionChart";
import FloatingWhatsApp from "../components/FloatingWhatsApp";
import GradientBackground from "../components/GradientBackground";
import Header from "../components/Header";
import WifiModal from "../components/Modals/WifiModal";
import AIChatWidget from "../components/AIChatWidget";
import Button from "../components/Button";
import { DashboardResponse } from "../types/api";

// === HELPERS DE FORMATAÇÃO ===
const formatCurrency = (val: any) => financeiroService.formatCurrency(val);
const formatDate = (date: any) => {
  if (!date) return "--/--/----";
  // Força o horário do meio-dia para evitar problemas de timezone/fuso horário
  const d = typeof date === 'string' ? new Date(date + "T12:00:00") : new Date(date);
  return new Intl.DateTimeFormat("pt-BR").format(d);
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // 1. ESTADO GLOBAL DA TELA (Fonte de Verdade)
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<string | number | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de UI/Modais
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
  const [showWifiPass, setShowWifiPass] = useState(false);
  const [isPixModalOpen, setPixModalOpen] = useState(false);
  const [activePix, setActivePix] = useState({ code: "", image: "" });
  const [isPixCopied, setIsPixCopied] = useState(false);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("aberto");

  // 2. BUSCA DE DADOS (Início do Ciclo)
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiService.getDashboard();
      
      // Adendo 1: Tratamento de IDs Múltiplos
      const contratosFormatados = contratoService.formatarContratos(res.contratos || [], res.clientes?.[0]?.endereco);
      
      setData({ ...res, contratos: contratosFormatados as any });
      setError(null);
      
      if (res.contratos?.length === 1) {
        setSelectedContractId(res.contratos[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 3. DADOS DERIVADOS (Memoization - Arquitetura de Estado Escravo)
  const contratoAtivo = useMemo(() => 
    data?.contratos.find(c => String(c.id) === String(selectedContractId)) as any, 
    [selectedContractId, data]
  );

  const loginAtivo = useMemo(() => 
    data?.logins.find(l => String(l.id_contrato || l.contrato_id) === String(selectedContractId)), 
    [selectedContractId, data]
  );

  const faturasAtivas = useMemo(() => {
    const list = data?.faturas.filter(f => String(f.id_contrato || f.contrato_id) === String(selectedContractId)) || [];
    return financeiroService.processarFaturas(list);
  }, [selectedContractId, data]);

  const chamadosAtivos = useMemo(() => {
    if (!data) return [];
    const tickets = (data.tickets || []).map(t => suporteService.normalizarTicket(t));
    const os = (data.ordensServico || []).map(o => suporteService.normalizarOS(o));
    return [...tickets, ...os]
      .filter(a => String(a.id_contrato) === String(selectedContractId))
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [selectedContractId, data]);

  const notasAtivas = useMemo(() => {
    const list = (data?.notas_fiscais || []).filter(n => String((n as any).id_contrato || (n as any).contrato_id) === String(selectedContractId));
    return notaFiscalService.formatarNotas(list);
  }, [selectedContractId, data]);

  const resumoFinanceiro = useMemo(() => financeiroService.calcularResumo(faturasAtivas), [faturasAtivas]);

  // 4. AÇÕES (Interações com API)
  const handleAction = async (action: () => Promise<any>, successMsg = "Sucesso!") => {
    try {
      await action();
      alert(successMsg);
      fetchData();
    } catch (e: any) {
      alert(e.message || "Erro na ação");
    }
  };

  const handleOpenPix = async (id: string | number) => {
    try {
      const res = await apiService.getPixCode(id);
      setActivePix({ code: res.pix_code, image: res.qr_code });
      setPixModalOpen(true);
    } catch (e) { alert("Erro ao gerar PIX"); }
  };

  const handleDownloadContrato = async (id: number | string) => {
    try {
      const res = await apiService.getContratoPdf(id);
      if (res.base64_document) {
        const base64Content = res.base64_document.includes(',') 
          ? res.base64_document.split(',')[1] 
          : res.base64_document;

        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contrato_${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (e) {
      alert("Erro ao baixar o contrato. Por favor, tente novamente.");
    }
  };

  // Adendo 2: Skeleton Loaders Profissionais
  if (isLoading) {
    return (
      <GradientBackground>
        <Header hideSecondaryAction hidePrimaryAction />
        <div className="min-h-screen pb-20 pt-24 lg:pt-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 animate-pulse">
              <div className="h-8 bg-gray-200 rounded-lg w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-100 rounded-lg w-1/4 mb-8"></div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-gray-50 rounded-3xl p-6 flex gap-6 items-center border border-gray-100">
                    <div className="w-16 h-16 bg-gray-200 rounded-2xl shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                      <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </GradientBackground>
    );
  }

  if (error) return <GradientBackground><div className="min-h-screen flex flex-col items-center justify-center text-white p-6"><i className="fas fa-exclamation-circle text-6xl mb-4"></i><h2 className="text-2xl font-black mb-4">Ops! {error}</h2><Button onClick={fetchData} variant="primary">Tentar Novamente</Button></div></GradientBackground>;

  return (
    <GradientBackground>
      <FloatingWhatsApp />
      <Header hideSecondaryAction hidePrimaryAction />
      <div className="min-h-screen pb-20 pt-24 lg:pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* MODO GESTÃO: Lista de Saúde */}
          {(data?.contratos.length || 0) > 1 && !selectedContractId ? (
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 animate-fadeIn">
              <div className="mb-8 border-b border-gray-100 pb-6">
                <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">
                  Olá, {data?.clientes?.[0]?.nome?.split(" ")[0] || "Cliente"}!
                </h2>
                <p className="text-gray-500 font-bold mt-1">Aqui estão seus {data?.contratos.length} contratos. Selecione um para gerenciar.</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {[...(data?.contratos || [])]
                  .sort((a: any, b: any) => (a.cor === 'red' ? -1 : 1))
                  .map((c: any) => (
                    <div key={c.id} onClick={() => setSelectedContractId(c.id)} className={`group border rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center cursor-pointer transition-all hover:shadow-md ${c.cor === 'red' ? 'bg-red-50/30 border-red-100 hover:bg-red-50' : 'bg-gray-50 hover:bg-blue-50 border-gray-100'}`}>
                      <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${c.cor === 'red' ? 'bg-red-500 text-white' : 'bg-green-100 text-green-500'}`}>
                          <i className={`fas ${c.cor === 'red' ? 'fa-exclamation-triangle' : 'fa-check-circle'} text-2xl`}></i>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contrato #{c.id}</p>
                          <h3 className="text-xl font-black text-gray-800 group-hover:text-connect-blue transition-colors">{c.plano}</h3>
                          <p className={`text-xs font-bold uppercase mt-0.5 ${c.cor === 'red' ? 'text-red-500' : 'text-gray-500'}`}>
                            {c.cor === 'red' ? 'Pendente de Pagamento' : c.status_acesso}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 mt-4 md:mt-0">
                        {/* Se houver faturas em aberto neste contrato, avisa na lista */}
                        {c.cor === 'red' && (
                          <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase hidden md:block animate-pulse">Fatura Pendente</span>
                        )}
                        <i className="fas fa-chevron-right text-gray-300 group-hover:text-connect-blue group-hover:translate-x-2 transition-all text-xl"></i>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            /* MODO FOCO: Visualização Detalhada do Contrato Selecionado */
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* SIDEBAR TABS */}
              <aside className="w-full lg:w-1/4 lg:sticky lg:top-28">
                <div className="bg-white shadow-2xl border border-gray-100 rounded-[2rem] p-4 space-y-2">
                  <div className="px-4 py-2 border-b border-gray-50 mb-4">
                    <button 
                      onClick={() => { setActiveTab("dashboard"); setSelectedContractId(null); }} 
                      className={`text-xs font-black uppercase flex items-center gap-2 mb-4 ${(data?.contratos.length || 0) <= 1 ? 'hidden' : 'text-connect-blue hover:text-blue-800 transition-colors'}`}
                    >
                      <i className="fas fa-arrow-left"></i> Ver todos os contratos
                    </button>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Menu do Contrato</p>
                  </div>
                  {[
                    { id: "dashboard", label: "Visão Geral", icon: "fa-columns" },
                    { id: "wifi", label: "Conexão & Wi-Fi", icon: "fa-wifi" },
                    { id: "finance", label: "Financeiro", icon: "fa-file-invoice-dollar" },
                    { id: "support", label: "Suporte Técnico", icon: "fa-headset" },
                    { id: "docs", label: "Arquivo Fiscal", icon: "fa-folder-open" },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-sm transition-all ${activeTab === tab.id ? "bg-[#002D72] text-white shadow-xl scale-[1.02]" : "text-gray-500 hover:bg-blue-50"}`}>
                      <i className={`fas ${tab.icon} w-5 text-center`}></i> {tab.label}
                    </button>
                  ))}
                  <div className="pt-4 mt-4 border-t border-gray-100">
                    <button onClick={() => { apiService.logout(); navigate('/'); }} className="w-full flex items-center gap-4 p-4 rounded-2xl font-black text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <i className="fas fa-power-off w-5 text-center"></i> Sair da Conta
                    </button>
                  </div>
                </div>
              </aside>

              {/* CONTEÚDO PRINCIPAL */}
              <main className="w-full lg:w-3/4 bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-10 min-h-[650px] animate-fadeIn">
                
                {/* ABA 1: DASHBOARD (VISÃO GERAL) */}
                {activeTab === "dashboard" && contratoAtivo && (
                  <div className="space-y-8">
                    <div className={`p-8 border-4 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 transition-colors duration-500 ${contratoAtivo.cor === 'red' ? 'border-red-100 bg-red-50/30' : 'border-green-100 bg-green-50/30'}`}>
                      <div className="flex items-center gap-6">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl shadow-lg ${contratoAtivo.cor === 'red' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                          <i className={`fas ${contratoAtivo.cor === 'red' ? 'fa-ban' : 'fa-rocket'}`}></i>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Seu Plano</p>
                          <h2 className="text-3xl font-black text-gray-800 tracking-tight uppercase">{contratoAtivo.plano}</h2>
                          <p className={`font-black uppercase text-sm mt-1 flex items-center gap-2 ${contratoAtivo.cor === 'red' ? 'text-red-600' : 'text-green-600'}`}>
                            <span className={`w-2 h-2 rounded-full ${contratoAtivo.cor === 'red' ? 'bg-red-600 animate-pulse' : 'bg-green-600'}`}></span>
                            {contratoAtivo.status_acesso}
                          </p>
                        </div>
                      </div>
                      {(contratoAtivo.isBloqueado || contratoAtivo.cor === 'red') && (
                        <button onClick={() => handleAction(() => apiService.unlockContract(contratoAtivo.id), "Contrato desbloqueado por confiança!")} className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-red-200 transition-all uppercase flex items-center gap-2">
                          <i className="fas fa-unlock"></i> Desbloqueio de Confiança
                        </button>
                      )}
                    </div>

                    {resumoFinanceiro.temVencidas && (
                      <div className="bg-orange-50 border border-orange-200 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 animate-bounce-slow">
                        <div className="flex items-center gap-4 text-orange-800">
                          <div className="bg-orange-500 text-white w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-orange-200">
                            <i className="fas fa-exclamation-triangle text-xl"></i>
                          </div>
                          <div>
                            <p className="font-black uppercase text-sm">Faturas em Atraso</p>
                            <p className="text-xs font-bold opacity-80 mt-1">Identificamos pendências. Regularize agora para evitar lentidão ou bloqueio.</p>
                          </div>
                        </div>
                        <button onClick={() => setActiveTab("finance")} className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase shadow-lg transition-colors">
                          Pagar Agora
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 p-6 rounded-3xl text-center border border-gray-100 hover:shadow-md transition-shadow">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sinal da Fibra</p>
                        <p className={`text-3xl font-black ${parseFloat(loginAtivo?.sinal || "0") < -27 ? 'text-red-500' : 'text-green-500'}`}>{loginAtivo?.sinal || '---'}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Potência dBm</p>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-3xl text-center border border-gray-100 hover:shadow-md transition-shadow">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Conexão</p>
                        <p className={`text-3xl font-black uppercase ${loginAtivo?.online === 'S' ? 'text-connect-blue' : 'text-gray-400'}`}>{loginAtivo?.online === 'S' ? 'ONLINE' : 'OFFLINE'}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Status em Tempo Real</p>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-3xl text-center border border-gray-100 hover:shadow-md transition-shadow">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Atendimentos</p>
                        <p className="text-3xl font-black text-gray-800">{chamadosAtivos.filter(a => !['F', 'C'].includes(a.statusRaw)).length}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Chamados em Aberto</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA 2: CONEXÃO & WI-FI */}
                {activeTab === "wifi" && (
                  <div className="space-y-8 animate-fadeIn">
                    {/* Adendo 4: Fallback para Contratos Recém-Nascidos */}
                    {!loginAtivo ? (
                      <div className="text-center py-24 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                          <i className="fas fa-tools text-3xl text-gray-400"></i>
                        </div>
                        <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Aguardando Instalação</h3>
                        <p className="text-gray-500 font-bold mt-2 max-w-md mx-auto">Sua conexão ainda não está ativa no sistema. Os dados técnicos aparecerão aqui após a instalação.</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className={`${loginAtivo.wifi_ssid ? 'lg:col-span-2' : 'lg:col-span-3'} bg-[#002D72] text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden transition-all duration-500`}>
                            <i className="fas fa-network-wired absolute top-0 right-0 p-8 opacity-10 text-6xl"></i>
                            <div className="relative z-10">
                              <div className="flex justify-between items-start mb-6">
                                <div>
                                  <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Login PPPoE</p>
                                  <h3 className="text-2xl font-black uppercase">{loginAtivo.login}</h3>
                                </div>
                                <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 ${loginAtivo.online === 'S' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                  <span className={`w-2 h-2 rounded-full ${loginAtivo.online === 'S' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
                                  {loginAtivo.online === 'S' ? 'ONLINE' : 'OFFLINE'}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/5">
                                  <p className="text-[8px] opacity-60 font-black uppercase mb-1">Uptime</p>
                                  <p className="text-sm font-black">{loginAtivo.uptime}</p>
                                </div>
                                <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/5">
                                  <p className="text-[8px] opacity-60 font-black uppercase mb-1">Sinal ONU</p>
                                  <p className={`text-sm font-black ${parseFloat(loginAtivo.sinal || "0") < -27 ? 'text-red-400' : 'text-green-400'}`}>
                                    {loginAtivo.sinal || '---'} {parseFloat(loginAtivo.sinal || "0") < -27 && <i className="fas fa-exclamation-triangle ml-1"></i>}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-3">
                                <button onClick={() => handleAction(() => apiService.loginAction(loginAtivo.id || loginAtivo.login, "desconectar"), "Comando de reinicialização enviado!")} className="bg-white text-connect-blue hover:bg-blue-50 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-colors shadow-lg">
                                  <i className="fas fa-sync-alt mr-2"></i> Reiniciar
                                </button>
                                <button onClick={() => handleAction(() => apiService.loginAction(loginAtivo.id || loginAtivo.login, "limpar-mac"), "Hardware resetado no servidor!")} className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-colors">
                                  Limpar MAC
                                </button>
                              </div>
                            </div>
                          </div>

                          {loginAtivo.wifi_ssid && (
                            <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between animate-fadeIn hover:shadow-md transition-shadow">
                              <div>
                                <div className="w-12 h-12 bg-blue-50 text-connect-blue rounded-2xl flex items-center justify-center mb-6">
                                  <i className="fas fa-wifi text-xl"></i>
                                </div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rede Wi-Fi (SSID)</p>
                                <p className="text-xl font-black text-gray-800 break-all mb-4">{loginAtivo.wifi_ssid}</p>
                                
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Senha</p>
                                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                  <p className="text-sm font-bold text-gray-700 font-mono tracking-widest flex-1">{showWifiPass ? loginAtivo.wifi_senha : "••••••••"}</p>
                                  <button onClick={() => setShowWifiPass(!showWifiPass)} className="text-gray-400 hover:text-connect-blue transition-colors p-2"><i className={`fas fa-eye${showWifiPass ? "-slash" : ""}`}></i></button>
                                  <button onClick={() => { navigator.clipboard.writeText(loginAtivo.wifi_senha || ""); alert("Senha copiada!"); }} className="text-gray-400 hover:text-connect-blue transition-colors p-2"><i className="fas fa-copy"></i></button>
                                </div>
                              </div>
                              <button onClick={() => setIsWifiModalOpen(true)} className="mt-6 w-full bg-connect-blue text-white hover:bg-blue-800 py-3.5 rounded-xl text-xs font-black uppercase transition-colors shadow-lg shadow-blue-100">
                                Alterar Senha
                              </button>
                            </div>
                          )}
                        </div>

                        {parseFloat(loginAtivo.sinal || "0") < -27 && (
                          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 text-yellow-800">
                              <i className="fas fa-exclamation-triangle text-3xl text-yellow-500"></i>
                              <div>
                                <p className="font-black uppercase">Sinal Fraco Detectado</p>
                                <p className="text-xs font-bold mt-1 opacity-80">A qualidade do sinal da sua fibra está abaixo do ideal. Isso pode causar lentidão.</p>
                              </div>
                            </div>
                            <button onClick={() => setActiveTab("support")} className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase transition-colors shadow-lg">Abrir Chamado</button>
                          </div>
                        )}

                        <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-xl font-black text-gray-800 uppercase tracking-tight">Tráfego de Dados</h4>
                            <div className="flex gap-6 text-right">
                              <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-1"><i className="fas fa-arrow-down text-connect-blue mr-1"></i> Download</p>
                                <p className="text-lg font-black text-gray-800">{loginAtivo.total_download || "0 GB"}</p>
                              </div>
                              <div className="w-px bg-gray-200"></div>
                              <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-1"><i className="fas fa-arrow-up text-green-500 mr-1"></i> Upload</p>
                                <p className="text-lg font-black text-gray-800">{loginAtivo.total_upload || "0 GB"}</p>
                              </div>
                            </div>
                          </div>
                          <div className="h-[250px]"><ConsumptionChart history={loginAtivo.consumo?.history} compact /></div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ABA 3: FINANCEIRO */}
                {activeTab === "finance" && (
                  <div className="space-y-8 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Histórico Financeiro</h3>
                      <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                        <button onClick={() => setInvoiceStatusFilter("aberto")} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${invoiceStatusFilter === "aberto" ? 'bg-white text-connect-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Pendentes</button>
                        <button onClick={() => setInvoiceStatusFilter("pago")} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${invoiceStatusFilter === "pago" ? 'bg-white text-connect-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Pagas</button>
                      </div>
                    </div>

                    {faturasAtivas.filter(f => f.status === invoiceStatusFilter).length === 0 ? (
                      <div className="text-center py-24 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                          <i className="fas fa-check-double text-3xl text-green-500"></i>
                        </div>
                        <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Tudo em dia!</h3>
                        <p className="text-gray-500 font-bold mt-2">Você não possui faturas nesta categoria.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {faturasAtivas.filter(f => f.status === invoiceStatusFilter).map((f, index) => (
                          <div key={f.id} className={`p-6 border rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 transition-all hover:shadow-md ${f.isVencida ? 'bg-red-50/50 border-red-100' : 'bg-white border-gray-100'}`}>
                            <div className="flex items-center gap-6 w-full">
                              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0 ${f.status === 'pago' ? 'bg-green-50 text-green-600' : (f.isVencida ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-connect-blue')}`}>
                                <i className={`fas ${f.status === 'pago' ? 'fa-check' : 'fa-barcode'}`}></i>
                              </div>
                              <div className="flex-1">
                                {index === 0 && f.status === 'aberto' && (
                                  <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded-md uppercase mb-2 ${f.isVencida ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {f.isVencida ? 'Em Atraso' : 'Próxima a vencer'}
                                  </span>
                                )}
                                {f.isVencida && (
                                  <span className="ml-2 inline-block bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase mb-2 animate-pulse">
                                    {f.dias_atraso} {f.dias_atraso === 1 ? 'Dia' : 'Dias'} de Atraso
                                  </span>
                                )}
                                <p className={`text-2xl font-black tracking-tight ${f.isVencida ? 'text-red-700' : 'text-gray-800'}`}>
                                  {f.status === 'pago' ? formatCurrency(f.valor_recebido || f.valor) : formatCurrency(f.valor_atualizado || f.valor)}
                                </p>
                                <div className="flex flex-col mt-1">
                                  <p className="text-xs font-bold text-gray-500 uppercase">
                                    {f.status === 'pago' ? `Liquidada em ${formatDate(f.data_pagamento)}` : `Vence em ${formatDate(f.vencimento)}`}
                                  </p>
                                  {f.isVencida && f.status !== 'pago' && f.valor && (
                                    <div className="mt-3 p-3 bg-red-500/5 border border-red-500/10 rounded-2xl animate-fadeIn space-y-1">
                                      <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                        <span>+ Multa (2%):</span>
                                        <span className="text-red-600">{formatCurrency(f.valor * 0.02)}</span>
                                      </div>
                                      <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                        <span>+ Juros ({f.dias_atraso} dias):</span>
                                        <span className="text-red-600">{formatCurrency(f.valor * (0.00033 * f.dias_atraso))}</span>
                                      </div>
                                      <div className="border-t border-red-100 mt-2 pt-2 flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-800 uppercase">Total Estimado:</span>
                                        <span className="text-sm font-black text-red-600">
                                          {formatCurrency(f.valor + (f.valor * 0.02) + (f.valor * (0.00033 * f.dias_atraso)))}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                              {f.status === 'aberto' ? (
                                <>
                                  <button onClick={() => handleOpenPix(f.id)} className={`flex-1 md:flex-none px-8 py-3.5 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${f.isVencida ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200' : 'bg-connect-blue hover:bg-blue-800 text-white shadow-lg shadow-blue-100'}`}>
                                    <i className="fas fa-qrcode text-sm"></i> Pagar PIX
                                  </button>
                                  <button onClick={() => financeiroService.downloadPdf(f.id)} className="p-3.5 bg-gray-50 text-gray-500 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors" title="Baixar Boleto">
                                    <i className="fas fa-file-pdf text-lg"></i>
                                  </button>
                                </>
                              ) : (
                                <button onClick={() => financeiroService.downloadPdf(f.id)} className="w-full md:w-auto px-6 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl font-black text-[10px] uppercase border border-gray-200 flex items-center justify-center gap-2 transition-colors">
                                  <i className="fas fa-receipt text-sm"></i> Comprovante
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ABA 4: SUPORTE TÉCNICO */}
                {activeTab === "support" && (
                  <div className="space-y-8 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Atendimentos e Visitas</h3>
                      <button className="bg-connect-blue text-white px-6 py-3 rounded-xl text-[10px] font-black shadow-lg shadow-blue-100 hover:-translate-y-0.5 transition-all uppercase flex items-center gap-2">
                        <i className="fas fa-plus"></i> Abrir Chamado
                      </button>
                    </div>

                    {chamadosAtivos.length === 0 ? (
                      <div className="text-center py-24 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                          <i className="fas fa-headset text-3xl text-gray-400"></i>
                        </div>
                        <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Nenhum atendimento</h3>
                        <p className="text-gray-500 font-bold mt-2">Você não possui histórico de suporte para este contrato.</p>
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-gray-100 ml-4 md:ml-6 space-y-8 pl-8 py-4">
                        {chamadosAtivos.map((atend, index) => (
                          <div key={`${atend.tipo}-${atend.id}`} className="relative group">
                            <div className={`absolute -left-[45px] w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border-4 border-white ${atend.tipo === 'TICKET' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                              <i className={`fas ${atend.tipo === 'TICKET' ? 'fa-comment-dots' : 'fa-tools'}`}></i>
                            </div>
                            
                            <div className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-lg hover:border-gray-200 transition-all">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-gray-50 pb-4">
                                <div>
                                  <div className="flex items-center gap-3 mb-1">
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${atend.tipo === 'TICKET' ? 'text-blue-600' : 'text-orange-600'}`}>
                                      {atend.tipo === 'TICKET' ? 'Atendimento Digital' : 'Visita Técnica'}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                    <span className="text-[10px] text-gray-400 font-bold">#{atend.protocolo}</span>
                                  </div>
                                  <h4 className="font-black text-gray-800 text-lg">{atend.titulo}</h4>
                                </div>
                                <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 bg-${atend.status.color}-50 text-${atend.status.color}-600 border border-${atend.status.color}-100`}>
                                  <span className={`w-1.5 h-1.5 rounded-full bg-${atend.status.color}-500`}></span>
                                  {atend.status.label}
                                </div>
                              </div>
                              
                              <p className="text-xs text-gray-600 font-medium leading-relaxed mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                {atend.descricao || "Nenhuma descrição fornecida."}
                              </p>
                              
                              <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase">
                                <div className="flex items-center gap-2">
                                  <i className="far fa-calendar-alt text-gray-300"></i>
                                  Aberto em {formatDate(atend.data)}
                                </div>
                                {atend.tecnico && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <i className="fas fa-user-hard-hat text-gray-300"></i>
                                    {atend.tecnico}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ABA 5: ARQUIVO FISCAL & CONTRATOS */}
                {activeTab === "docs" && contratoAtivo && (
                  <div className="space-y-8 animate-fadeIn">
                    <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <i className="fas fa-map-marker-alt text-connect-blue"></i>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Endereço de Instalação</p>
                        </div>
                        <h3 className="text-lg font-black text-gray-800 uppercase">
                          {contratoAtivo.enderecoCompleto || contratoAtivo.endereco || "Endereço de Instalação"}
                        </h3>
                      </div>
                      <button onClick={() => handleDownloadContrato(contratoAtivo.id)} className="w-full md:w-auto bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-sm hover:shadow-md hover:border-connect-blue transition-all flex items-center justify-center gap-2">
                        <i className="fas fa-file-signature text-sm"></i> Ver Contrato
                      </button>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2 mb-6">
                        <i className="fas fa-folder-open text-gray-300"></i> Arquivo Fiscal (NF-e)
                      </h4>
                      {notasAtivas.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-[2rem]">
                          <i className="fas fa-receipt text-4xl text-gray-300 mb-3"></i>
                          <p className="text-gray-500 font-bold">Nenhuma nota fiscal emitida ainda.</p>
                          <p className="text-xs text-gray-400 mt-1">As notas são geradas após a confirmação do pagamento.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {Object.entries(notaFiscalService.agruparPorAno(notasAtivas)).map(([ano, notas]) => (
                            <div key={ano} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors">
                                <span className="font-black text-gray-800 text-lg">Exercício {ano}</span>
                                <span className="bg-white border border-gray-200 text-gray-600 text-[10px] font-black px-3 py-1 rounded-lg uppercase shadow-sm">{notas.length} Documentos</span>
                              </div>
                              <div className="divide-y divide-gray-50">
                                {notas.map(nf => (
                                  <div key={nf.id} className="p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-blue-50/30 transition-colors group">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                                        <i className="fas fa-file-pdf"></i>
                                      </div>
                                      <div>
                                        <p className="text-sm font-black text-gray-800 group-hover:text-connect-blue transition-colors">Nota Fiscal Eletrônica</p>
                                        <div className="flex gap-3 text-[10px] text-gray-400 font-bold uppercase mt-1">
                                          <span>Nº {nf.numero}</span>
                                          <span>•</span>
                                          <span>Emissão: {formatDate(nf.dataEmissao)}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between w-full md:w-auto gap-6 md:border-l md:border-gray-100 md:pl-6">
                                      <p className="font-black text-gray-800 text-lg">{formatCurrency(nf.valor)}</p>
                                      <button onClick={() => window.open(nf.pdf_link, '_blank')} className="bg-white border border-gray-200 text-gray-500 hover:text-connect-blue hover:border-connect-blue px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2">
                                        <i className="fas fa-download"></i> Baixar
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </main>
            </div>
          )}
        </div>

        {/* MODAL PIX GLOBAL */}
        {isPixModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full relative shadow-2xl animate-scaleIn">
              <button onClick={() => setPixModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><i className="fas fa-times text-xl"></i></button>
              <h3 className="text-2xl font-black text-center mb-2 uppercase text-gray-800 tracking-tight">Pagamento PIX</h3>
              <p className="text-center text-gray-500 text-sm mb-8">Escaneie o QR Code abaixo para pagar agora</p>
              <div className="bg-white p-6 rounded-3xl mx-auto w-fit mb-8 border border-gray-100 shadow-inner">
                {activePix.image ? <img src={activePix.image.startsWith("http") ? activePix.image : `data:image/png;base64,${activePix.image}`} alt="QR Code" className="w-[200px] h-[200px] object-contain" /> : <div className="animate-pulse bg-gray-100 w-[200px] h-[200px] rounded-2xl"></div>}
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl mb-6 text-center border border-blue-100">
                <p className="text-[10px] text-connect-blue font-mono break-all">{activePix.code}</p>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(activePix.code); setIsPixCopied(true); setTimeout(() => setIsPixCopied(false), 2000); }} className="w-full bg-connect-blue text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-100 transition-all uppercase">
                {isPixCopied ? "CÓDIGO COPIADO!" : "COPIAR CÓDIGO PIX"}
              </button>
            </div>
          </div>
        )}

        {/* MODAL WIFI GLOBAL */}
        {loginAtivo && (
          <WifiModal
            isOpen={isWifiModalOpen}
            onClose={() => setIsWifiModalOpen(false)}
            loginId={loginAtivo.id || loginAtivo.login}
            currentSsid={loginAtivo.wifi_ssid || ""}
          />
        )}
      </div>
      <AIChatWidget />
    </GradientBackground>
  );
};

export default Dashboard;