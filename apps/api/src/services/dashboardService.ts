
import "dotenv/config";
import { DashboardData } from "../types/dashboard/DashboardData";
import { GeminiProvider } from "./ai/providers/GeminiProvider";
import { cacheGet, cacheSet } from "./cache/supabaseClient";
import { ixcService } from "./ixcService";
import { financeiroService } from "./financeiroService";
import { contratoService } from "./contratoService";
import { suporteService } from "./suporteService";
import { notaFiscalService } from "./notaFiscalService";

// Função auxiliar para formatar bytes
function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const geminiDashboardProvider = new GeminiProvider({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
  model: "gemini-1.5-flash",
});

export class DashboardService {
  constructor(private ixc = ixcService) { }

  async gerarDashboard(
    clientIds: number[],
    clientIp: string = "",
  ): Promise<DashboardData> {
    const cacheKey = `dashboard:${clientIds.join(",")}`;

    const cached = await cacheGet<DashboardData>(cacheKey);
    if (cached) {
      cached.logins = cached.logins.map((l) => ({
        ...l,
        ip_publico: clientIp,
      }));
      return cached;
    }

    const results = await Promise.all(clientIds.map(async (id) => {
      try {
        const cliente = await this.ixc.buscarClientesPorId(id);
        if (!cliente) return null;

        // Usando os novos serviços especializados
        const [contratos, faturasRaw, notasRaw, atendimentos, logins] = await Promise.all([
          contratoService.listarFormatados(id),
          this.ixc.financeiroListar(id),
          notaFiscalService.buscarHistorico(id),
          suporteService.listarAtendimentos(id),
          this.ixc.loginsListar(id)
        ]);

        const faturas = await financeiroService.processarFaturas(faturasRaw);

        // Busca termos pendentes para cada contrato
        const termosPromises = contratos.map((c: any) =>
          this.ixc.listarTermosPendentes(c.id),
        );
        const termosResults = await Promise.all(termosPromises);
        const termos = termosResults.flat();

        return {
          cliente,
          contratos,
          faturas,
          notasFiscais: notasRaw,
          logins,
          atendimentos,
          termos
        };
      } catch (error) {
        console.error(`Erro ao processar cliente ${id}:`, error);
        return null;
      }
    }));

    const dashboard: DashboardData = {
      clientes: [],
      contratos: [],
      faturas: [],
      logins: [],
      notas: [],
      notas_fiscais: [],
      ordensServico: [],
      tickets: [],
      termos: [],
      ontInfo: [],
      consumo: {
        total_download_bytes: 0,
        total_upload_bytes: 0,
        total_download: "0 Bytes",
        total_upload: "0 Bytes",
        history: { daily: [], weekly: [], monthly: [] },
      },
    };

    for (const r of results) {
      if (!r || !r.cliente) continue;

      dashboard.clientes.push({
        id: r.cliente.id,
        nome: r.cliente.razao || r.cliente.fantasia || `Cliente ${r.cliente.id}`,
        endereco: `${r.cliente.endereco || ""}${r.cliente.numero ? ", " + r.cliente.numero : ""}`,
        cpn_cnpj: r.cliente.cnpj_cpf,
      });

      // Contratos já formatados pelo ContratoService
      r.contratos.forEach((c: any) => {
        // Códigos de Bloqueio do IXC: CA (Auto), FA (Financeiro), CM (Manual), D (Desativado)
        const codStatus = String(c.status_internet || "").toUpperCase();
        const isBloqueado = ['CA', 'FA', 'CM', 'D'].includes(codStatus);
        const isPendente = codStatus === 'AA';
        
        // 🔥 LÓGICA DE ENDEREÇO (PRIORIDADE: CONTRATO > LOGIN > CLIENTE)
        let enderecoFinal = c.enderecoCompleto;
        
        // Se contrato está sem endereço, tenta Login
        if (!enderecoFinal || enderecoFinal === "Endereço não informado") {
           const loginVinculado = r.logins.find((l: any) => String(l.id_contrato) === String(c.id));
           if (loginVinculado && loginVinculado.endereco && loginVinculado.endereco.trim() !== "") {
              enderecoFinal = `${loginVinculado.endereco}, ${loginVinculado.numero || "S/N"}`;
              if (loginVinculado.bairro) enderecoFinal += ` - ${loginVinculado.bairro}`;
           }
        }

        // Se ainda estiver sem endereço, usa o do Cliente (Dono)
        if (!enderecoFinal || enderecoFinal === "Endereço não informado") {
           if (r.cliente && r.cliente.endereco) {
              enderecoFinal = `${r.cliente.endereco}, ${r.cliente.numero || "S/N"}`;
              if (r.cliente.bairro) enderecoFinal += ` - ${r.cliente.bairro}`;
           }
        }

        // Verifica se tem fatura em aberto para este contrato específico
        // r.faturas já são as faturas processadas pelo financeiroService.processarFaturas
        const faturasDoContrato = r.faturas || [];
        const temFaturaAberta = faturasDoContrato.some((f: any) => String(f.id_contrato) === String(c.id) && f.status === 'aberto');
        
        // Define se o contrato deve ser exibido em vermelho (Bloqueado OU com Pendência Financeira)
        const deveFicarVermelho = isBloqueado || temFaturaAberta;

        dashboard.contratos.push({
          id: c.id,
          plano: c.plano,
          status: codStatus, 
          status_acesso: isBloqueado ? 'BLOQUEADO' : (isPendente ? 'PENDENTE' : c.status_acesso),
          status_internet: codStatus,
          situacao: isBloqueado ? 'bloqueado' : (isPendente ? 'pendente' : 'liberado'),
          cor: deveFicarVermelho ? 'red' : c.status.color, // 🔥 FORÇA VERMELHO
          enderecoCompleto: enderecoFinal,
          pdf_link: c.pdfLink,
          temFaturaAberta: temFaturaAberta,
          isBloqueado: isBloqueado
        });
      });

      // Faturas já formatadas pelo FinanceiroService
      r.faturas.forEach((f: any) => {
        dashboard.faturas.push({
          id: f.id,
          id_contrato: f.id_contrato,
          vencimento: f.vencimento,
          valor: String(f.valor),
          valor_recebido: String(f.valor_recebido),
          data_pagamento: f.data_pagamento,
          status: f.status,
          pix_code: f.pixTxid,
          linha_digitavel: f.linhaDigitavel,
        });
      });

      // Logins e Consumo
      for (const l of r.logins) {
        const contrato = r.contratos.find((c: any) => String(c.id) === String(l.id_contrato));
        const consumoRaw = await this.ixc.getConsumoCompleto(l);
        
        dashboard.logins.push({
          raw: l.id,
          id: l.id,
          login: l.login,
          status: l.online === "S" ? "online" : "offline",
          uptime: l.tempo_conectado,
          contrato_id: parseInt(l.id_contrato),
          download_atual: l.download_atual,
          upload_atual: l.upload_atual,
          ip_privado: l.ip || l.ip_concentrador || "Não atribuído",
          ip_publico: clientIp,
          ipv4: l.ip_concentrador || l.ip || null,
          endereco: contrato ? contrato.enderecoCompleto : "Endereço não encontrado",
          plano: contrato ? contrato.plano : "Plano não encontrado",
          wifi_ssid: l.ssid_router_wifi,
          wifi_senha: l.senha_rede_sem_fio,
          wifi_ssid_5g: l.ssid_router_wifi_5ghz,
          wifi_senha_5g: l.senha_rede_sem_fio_5ghz,
          sinal: l.sinal_ultimo_atendimento,
          onu_mac: l.onu_mac,
          consumo: {
            ...consumoRaw,
            total_download: formatBytes(consumoRaw.total_download_bytes),
            total_upload: formatBytes(consumoRaw.total_upload_bytes),
          },
        });
      }

      // Atendimentos Unificados (Tickets + OS)
      r.atendimentos.forEach((a: any) => {
        if (a.tipo === 'TICKET') {
          dashboard.tickets.push({
            id: a.id,
            protocolo: a.protocolo,
            titulo: a.titulo,
            data: a.data,
            status: a.statusRaw,
            status_label: a.status.label,
            cor: a.status.color,
            podeFechar: a.podeInteragir,
            id_contrato: a.id_contrato
          } as any);
        } else {
          dashboard.ordensServico.push({
            id: a.id,
            assunto_nome: a.titulo,
            status: a.statusRaw,
            status_label: a.status.label,
            cor: a.status.color,
            data_abertura: a.data,
            data_agenda: a.dataAgendamento,
            tecnico_nome: a.tecnico,
            id_contrato: a.id_contrato
          } as any);
        }
      });

      dashboard.termos.push(...(r.termos || []));

      // Notas Fiscais
      r.notasFiscais.forEach((nf: any) => {
        dashboard.notas_fiscais.push({
          id: nf.id,
          id_contrato: nf.id_contrato,
          numero: nf.numero,
          data_emissao: nf.data_emissao,
          valor: String(nf.valor),
          status: nf.status,
          pdf_link: nf.pdf_link,
          ano: nf.ano,
          mesAno: nf.mesAno
        });
      });
    }

    // Merge de Consumo Global
    if (dashboard.logins.length > 0) {
      const dailyMap = new Map<string, { download_bytes: number; upload_bytes: number }>();
      const weeklyMap = new Map<string, { download_bytes: number; upload_bytes: number }>();
      const monthlyMap = new Map<string, { download_bytes: number; upload_bytes: number }>();

      dashboard.logins.forEach(l => {
        if (l.consumo) {
          dashboard.consumo.total_download_bytes += l.consumo.total_download_bytes || 0;
          dashboard.consumo.total_upload_bytes += l.consumo.total_upload_bytes || 0;

          l.consumo.history?.daily?.forEach(d => {
            const current = dailyMap.get(d.data) || { download_bytes: 0, upload_bytes: 0 };
            dailyMap.set(d.data, {
              download_bytes: current.download_bytes + (d.download_bytes || 0),
              upload_bytes: current.upload_bytes + (d.upload_bytes || 0)
            });
          });

          l.consumo.history?.weekly?.forEach(w => {
            const current = weeklyMap.get(w.data) || { download_bytes: 0, upload_bytes: 0 };
            weeklyMap.set(w.data, {
              download_bytes: current.download_bytes + (w.download_bytes || 0),
              upload_bytes: current.upload_bytes + (w.upload_bytes || 0)
            });
          });

          l.consumo.history?.monthly?.forEach(m => {
            const current = monthlyMap.get(m.mes_ano) || { download_bytes: 0, upload_bytes: 0 };
            monthlyMap.set(m.mes_ano, {
              download_bytes: current.download_bytes + (m.download_bytes || 0),
              upload_bytes: current.upload_bytes + (m.upload_bytes || 0)
            });
          });
        }
      });

      dashboard.consumo.history.daily = Array.from(dailyMap.entries()).map(([data, vals]) => ({ data, ...vals })).sort((a, b) => a.data.localeCompare(b.data));
      dashboard.consumo.history.weekly = Array.from(weeklyMap.entries()).map(([data, vals]) => ({ data, ...vals })).sort((a, b) => a.data.localeCompare(b.data));
      dashboard.consumo.history.monthly = Array.from(monthlyMap.entries()).map(([mes_ano, vals]) => ({ mes_ano, ...vals })).sort((a, b) => a.mes_ano.localeCompare(b.mes_ano));
      dashboard.consumo.total_download = formatBytes(dashboard.consumo.total_download_bytes);
      dashboard.consumo.total_upload = formatBytes(dashboard.consumo.total_upload_bytes);
    }

    // Gerar Insights com Gemini
    try {
      const prompt = `Aja como Assistente Fiber Net. Gere 3 dicas curtas em JSON para este dashboard: ${JSON.stringify(dashboard.faturas.slice(0,2), null, 1)}`;
      const aiResponse = await geminiDashboardProvider.chat([{ role: "user", content: prompt }]);
      dashboard.ai_insights = [{ id: "ai-insights", ...JSON.parse(aiResponse.content) } as any];
    } catch (e) { dashboard.ai_insights = []; }

    await cacheSet(cacheKey, dashboard, 1);
    return dashboard;
  }
}
