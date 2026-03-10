import "dotenv/config";
import { DashboardData } from "../types/dashboard/DashboardData";
import { GeminiProvider } from "./ai/providers/GeminiProvider"; // Import GeminiProvider
import { cacheGet, cacheSet } from "./cache/supabaseClient";
import { ixcService } from "./ixcService";

// Função auxiliar para formatar bytes (mantida)
function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const geminiDashboardProvider = new GeminiProvider({
  apiKey: process.env.GOOGLE_API_KEY || "",
  model: "gemini-2.5-flash", // Usar o modelo flash para análise de dashboard (mais barato)
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

    const promises = clientIds.map(async (id) => {
      try {
        const cliente = await this.ixc.buscarClientesPorId(id);
        if (!cliente) return null;

        const contratos = await this.ixc.buscarContratosPorIdCliente(id);
        const faturas = await this.ixc.financeiroListar(id);
        const notasFiscais = await this.ixc.listarNotasFiscais(id);
        const logins = await this.ixc.loginsListar(id);
        const ordensRaw = await this.ixc.ordensServicoListar(id);
        const ticketsRaw = await this.ixc.ticketsListar(id);

        // Mapeia OS com nomes de assuntos
        const ordens = await Promise.all(
          ordensRaw.map(async (os: any) => {
            let assuntoNome = "";

            // 1. Tenta buscar o nome do assunto via relacionamento
            if (os.id_assunto) {
              try {
                const assunto = await this.ixc.buscarAssuntoOS(os.id_assunto);
                if (assunto && assunto.assunto) {
                  assuntoNome = assunto.assunto;
                }
              } catch (e) {
                // Silencia erro para não quebrar o dashboard, usa fallback
              }
            }

            // 2. Se não achou no relacionamento, tenta campo assunto da própria OS
            if (!assuntoNome && os.assunto) {
              assuntoNome = os.assunto;
            }

            // 3. Se ainda vazio, tenta o Tipo da OS
            if (!assuntoNome && os.tipo) {
              assuntoNome = os.tipo; // Ex: 'Manutenção', 'Instalação'
            }

            // 4. Fallback final
            if (!assuntoNome) {
              assuntoNome = "Ordem de Serviço";
            }

            return {
              ...os,
              assunto_nome: assuntoNome,
              resolucao: os.mensagem_resposta || os.mensagem || "",
            };
          }),
        );
        // Mapeia Tickets com nomes de assuntos
        const tickets = await Promise.all(
          ticketsRaw.map(async (t: any) => {
            const assunto = t.id_assunto
              ? await this.ixc.buscarAssuntoTicket(t.id_assunto)
              : null;
            return {
              ...t,
              assunto_nome: assunto
                ? assunto.assunto
                : t.titulo || "Atendimento",
              resolucao: t.resposta || t.menssagem || "",
            };
          }),
        );

        // Busca termos pendentes para cada contrato
        const termosPromises = contratos.map((c: any) =>
          this.ixc.listarTermosPendentes(c.id),
        );
        const termosResults = await Promise.all(termosPromises);
        const termos = termosResults.flat();

        const ontInfo = [];
        for (const l of logins) {
          const ont = await this.ixc.ontListar(l.id);
          ontInfo.push(...(ont || []));
        }

        return {
          cliente,
          contratos,
          faturas,
          notasFiscais,
          logins,
          ordens,
          tickets,
          termos,
          ontInfo,
        };
      } catch (error) {
        console.error(`Erro ao processar cliente ${id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);

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
        nome:
          r.cliente.razao || r.cliente.fantasia || `Cliente ${r.cliente.id}`,
        endereco: `${r.cliente.endereco || ""}${r.cliente.numero ? ", " + r.cliente.numero : ""
          }`,
        cpn_cnpj: r.cliente.cnpj_cpf,
      });

      r.contratos.forEach((c: any) => {
        // Tradução do Status de Acesso baseada no esquema do IXC
        const statusInternetMap: any = {
          'A': 'Ativo',
          'D': 'Desativado',
          'CM': 'Bloqueio Manual',
          'CA': 'Bloqueio Automático',
          'FA': 'Financeiro em Atraso',
          'AA': 'Aguardando Assinatura'
        };

        // --- LÓGICA DE VÍNCULO INTELIGENTE ---
        // 1. Busca logins que pertencem a este contrato (por ID ou por Nome de Login)
        const loginsDesteContrato = r.logins.filter((l: any) => {
          const idMatch = String(l.id_contrato) === String(c.id);
          const nameMatch = l.login && c.login && String(l.login).toLowerCase().includes(String(c.login).toLowerCase());
          return idMatch || nameMatch;
        });

        // 2. Verifica se algum desses logins está bloqueado (CA, FA, CM)
        const loginBloqueado = loginsDesteContrato.find((l: any) => 
          ['CA', 'FA', 'CM', 'D'].includes(String(l.status_internet || l.status).toUpperCase())
        );

        // 3. Define o status final: Se o login estiver bloqueado, o contrato herda o bloqueio
        const statusFinalInternet = loginBloqueado 
          ? (loginBloqueado.status_internet || loginBloqueado.status) 
          : (c.status_internet || 'A');

        const isBloqueado = ['CA', 'FA', 'CM', 'D'].includes(statusFinalInternet);
        const isPendente = statusFinalInternet === 'AA';

        dashboard.contratos.push({
          id: c.id,
          plano: c.descricao_aux_plano_venda,
          status: c.status, // Status Geral (A, I, etc)
          status_acesso: statusInternetMap[statusFinalInternet] || 'Desconhecido',
          status_internet: statusFinalInternet, 
          situacao: isBloqueado ? 'bloqueado' : (isPendente ? 'pendente' : 'liberado'),
          cor: isBloqueado ? 'red' : (isPendente ? 'orange' : 'green'),
          pdf_link: `/contrato/${c.id}`,
        });
      });

      r.faturas.forEach((f: any) => {
        const valorRecebido = f.valor_recebido || f.valor_pago || f.pagamento_valor || "0";
        const valorNum = parseFloat(f.valor);
        const valorRecebidoNum = parseFloat(valorRecebido.toString());

        // Se estiver pago (status diferente de 'A'), e tivermos valor recebido, usamos ele como valor principal
        // para evitar mostrar juros teóricos em faturas já liquidadas.
        const valorExibir = (f.status !== "A" && valorRecebidoNum > 0)
          ? valorRecebidoNum.toString()
          : f.valor;

        dashboard.faturas.push({
          id: f.id,
          vencimento: f.data_vencimento || f.vencimento,
          valor: valorExibir,
          valor_recebido: valorRecebido.toString(),
          data_pagamento: f.data_pagamento || f.pagamento_data || null,
          status: f.status === "A" ? "aberto" : "pago",
          pix_code: f.pix_txid,
          linha_digitavel: f.linha_digitavel,
        });
      });

      for (const l of r.logins) {
        // Encontra o contrato deste login para pegar endereço e plano
        const contrato = r.contratos.find((c: any) => String(c.id) === String(l.id_contrato));
        const endereco = contrato
          ? `${contrato.endereco || ""}${contrato.numero ? ", " + contrato.numero : ""}`
          : "Endereço não encontrado";
        const plano = contrato ? contrato.descricao_aux_plano_venda : "Plano não encontrado";

        // Busca consumo para este login específico
        const consumoRaw = await this.ixc.getConsumoCompleto(l);
        const consumo: DashboardData['consumo'] = { // Use DashboardData['consumo'] for type safety
          ...consumoRaw,
          total_download: formatBytes(consumoRaw.total_download_bytes),
          total_upload: formatBytes(consumoRaw.total_upload_bytes),
        };

        dashboard.logins.push({
          raw: l.id,
          id: l.id,
          login: l.login,
          status: l.online === "S" ? "online" : "offline",
          uptime: l.tempo_conectado,
          contrato_id: l.id_contrato,
          download_atual: l.download_atual,
          upload_atual: l.upload_atual,
          // --- NOVOS CAMPOS ---
          ip_privado: l.ip || l.ip_concentrador || "Não atribuído",
          ip_publico: clientIp,
          ipv4: l.ip_concentrador || l.ip || null,
          endereco,
          plano,
          // --- CAMPOS DE WIFI DO SEU IXC ---
          wifi_ssid: l.ssid_router_wifi,
          wifi_senha: l.senha_rede_sem_fio,
          wifi_ssid_5g: l.ssid_router_wifi_5ghz,
          wifi_senha_5g: l.senha_rede_sem_fio_5ghz,
          sinal: l.sinal_ultimo_atendimento,
          onu_mac: l.onu_mac,
          consumo,
        });
      }

      // Mapear tickets com campo podeFechar
      const ticketsMapped = (r.tickets || []).map((t: any) => ({
        ...t,
        podeFechar: ["N", "A", "P", "E", "S"].includes(t.status),
      }));

      dashboard.ordensServico.push(...r.ordens);
      dashboard.tickets = dashboard.tickets || [];
      dashboard.tickets.push(...ticketsMapped);
      dashboard.termos = dashboard.termos || [];
      dashboard.termos.push(...(r.termos || []));
      dashboard.ontInfo.push(...r.ontInfo);

      // --- MAPEAMENTO DE NOTAS FISCAIS ---
      if (r.notasFiscais && r.notasFiscais.length > 0) {
        dashboard.notas_fiscais = dashboard.notas_fiscais || [];
        r.notasFiscais.forEach((nf: any) => {
          dashboard.notas_fiscais!.push({
            id: nf.id,
            numero: nf.numero || nf.documento || "N/A",
            data_emissao: nf.data_emissao,
            valor: nf.valor_total || nf.valor,
            status: nf.status,
            pdf_link: `/financeiro/notas/${nf.id}/imprimir`
          });
        });
      }
    }

    // O consumo global agora realiza um merge inteligente por data/mês
    if (dashboard.logins.length > 0) {
      const dailyMap = new Map<string, { download_bytes: number; upload_bytes: number }>();
      const weeklyMap = new Map<string, { download_bytes: number; upload_bytes: number }>();
      const monthlyMap = new Map<string, { download_bytes: number; upload_bytes: number }>();

      dashboard.logins.forEach(l => {
        if (l.consumo) {
          dashboard.consumo.total_download_bytes += l.consumo.total_download_bytes || 0;
          dashboard.consumo.total_upload_bytes += l.consumo.total_upload_bytes || 0;

          // Merge Daily
          l.consumo.history?.daily?.forEach(d => {
            const current = dailyMap.get(d.data) || { download_bytes: 0, upload_bytes: 0 };
            dailyMap.set(d.data, {
              download_bytes: current.download_bytes + (d.download_bytes || 0),
              upload_bytes: current.upload_bytes + (d.upload_bytes || 0)
            });
          });

          // Merge Weekly
          l.consumo.history?.weekly?.forEach(w => {
            const current = weeklyMap.get(w.data) || { download_bytes: 0, upload_bytes: 0 };
            weeklyMap.set(w.data, {
              download_bytes: current.download_bytes + (w.download_bytes || 0),
              upload_bytes: current.upload_bytes + (w.upload_bytes || 0)
            });
          });

          // Merge Monthly
          l.consumo.history?.monthly?.forEach(m => {
            const current = monthlyMap.get(m.mes_ano) || { download_bytes: 0, upload_bytes: 0 };
            monthlyMap.set(m.mes_ano, {
              download_bytes: current.download_bytes + (m.download_bytes || 0),
              upload_bytes: current.upload_bytes + (m.upload_bytes || 0)
            });
          });
        }
      });

      // Converter Map para Array e Ordenar
      dashboard.consumo.history.daily = Array.from(dailyMap.entries())
        .map(([data, vals]) => ({ data, ...vals }))
        .sort((a, b) => a.data.localeCompare(b.data));

      dashboard.consumo.history.weekly = Array.from(weeklyMap.entries())
        .map(([data, vals]) => ({ data, ...vals }))
        .sort((a, b) => a.data.localeCompare(b.data));

      dashboard.consumo.history.monthly = Array.from(monthlyMap.entries())
        .map(([mes_ano, vals]) => ({ mes_ano, ...vals }))
        .sort((a, b) => a.mes_ano.localeCompare(b.mes_ano));

      dashboard.consumo.total_download = formatBytes(dashboard.consumo.total_download_bytes);
      dashboard.consumo.total_upload = formatBytes(dashboard.consumo.total_upload_bytes);
    }

    try {
      const prompt = `
        Aja como um Assistente Técnico Amigável da Fiber Net Telecom.
        
        SEU OBJETIVO:
        Gerar 3 dicas úteis e curtas para o cliente baseadas nos dados do dashboard.
        
        REGRAS ABSOLUTAS (PROIBIDO):
        - NÃO fale sobre "risco", "cancelamento", "churn", "atraso" ou "bloqueio".
        - NÃO use tom de alerta ou aviso. Use tom de "Curiosidade" ou "Dica".
        
        DADOS DO CLIENTE:
        ${JSON.stringify(dashboard, null, 2)}
        
        FORMATO JSON OBRIGATÓRIO:
        {
          "summary": "Uma frase de boas-vindas motivadora.",
          "insights": [
            {
              "type": "positive", 
              "title": "TÍTULO CURTO (Ex: Dica Wi-Fi, Streaming, Segurança)",
              "message": "Uma dica prática de até 15 palavras."
            }
          ]
        }
      `;

      const aiResponse = await geminiDashboardProvider.chat([
        { role: "user", content: prompt },
      ]);
      const parsedAi = JSON.parse(aiResponse.content);
      dashboard.ai_insights = [{ id: "ai-insights", ...parsedAi } as any];
    } catch (e) {
      dashboard.ai_insights = [];
    }

    await cacheSet(cacheKey, dashboard, 60);

    return dashboard;
  }
}
