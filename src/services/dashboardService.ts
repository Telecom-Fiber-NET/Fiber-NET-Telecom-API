import "dotenv/config";
import { DashboardData } from "../types/dashboard/DashboardData";
import { activeAIProvider } from "./ai"; // Import activeAIProvider
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

// O DashboardService agora usará o provedor ativo (que pode ser o OmniRoute via Orquestrador)

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
        const cliente = await this.ixc.buscarClientePorId(id);
        if (!cliente) return null;

        const contratos = await this.ixc.buscarContratosPorIdCliente(id);
        const faturas = await this.ixc.financeiroListar(id);
        const logins = await this.ixc.loginsListar(id);
        const ordensRaw = await this.ixc.ordensServicoListar(id);
        const ticketsRaw = await this.ixc.ticketsListar(id);
        const notasRaw = await this.ixc.listarNotasFiscais(id);

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
          logins,
          ordens,
          tickets,
          termos,
          ontInfo,
          notas: notasRaw,
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
        console.log(`[DEBUG] Contrato ${c.id} status IXC: ${c.status}`);

        let mappedStatus = "inativo";
        if (["A", "H", "F", "E"].includes(c.status)) mappedStatus = "ativo";
        else if (["C", "D"].includes(c.status)) mappedStatus = "cancelado";
        else if (["N", "B"].includes(c.status)) mappedStatus = "bloqueado";
        else if (c.status === "AA") mappedStatus = "aguardando_assinatura";
        else if (c.status === "P") mappedStatus = "pre_contrato";

        dashboard.contratos.push({
          id: c.id,
          id_cliente: c.id_cliente,
          plano: c.plano || c.descricao_aux_plano_venda || "Plano Fiber",
          status: mappedStatus,
          pdf_link: `/contrato/${c.id}`,
        });
      });

      const hoje = new Date();
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();

      // 1. Filtrar faturas por Trava Forte
      const faturasAbertasNormais = r.faturas.filter((f: any) => {
        if (f.status !== "A") return false;
        const dataVenc = new Date(f.data_vencimento || f.vencimento);
        return (dataVenc.getFullYear() < anoAtual) || 
               (dataVenc.getFullYear() === anoAtual && dataVenc.getMonth() <= mesAtual);
      });

      const podeMostrarProximoMes = faturasAbertasNormais.length === 0;

      r.faturas.forEach((f: any) => {
        const dataVenc = new Date(f.data_vencimento || f.vencimento);
        const mesVenc = dataVenc.getMonth();
        const anoVenc = dataVenc.getFullYear();

        // Trava Forte: Só mostra se (é deste mês ou anterior) OU se já está pago
        const isFutura = (anoVenc > anoAtual) || (anoVenc === anoAtual && mesVenc > mesAtual);
        
        if (isFutura && f.status === "A") {
          // NOVA REGRA: Se não tem nada vencido/atual, mostra o do próximo mês (apenas +1)
          const isProximoMes = (anoVenc === anoAtual && mesVenc === mesAtual + 1) || 
                               (anoVenc === anoAtual + 1 && mesAtual === 11 && mesVenc === 0);
          
          if (!podeMostrarProximoMes || !isProximoMes) {
            return; // Pula boletos futuros
          }
        }

        const valorRecebido = f.valor_recebido || f.valor_pago || f.pagamento_valor || "0";
        const valorNum = parseFloat(f.valor);
        const valorRecebidoNum = parseFloat(valorRecebido.toString());

        const valorExibir = (f.status !== "A" && valorRecebidoNum > 0)
          ? valorRecebidoNum.toString()
          : f.valor;

        dashboard.faturas.push({
          id: f.id,
          id_cliente: f.id_cliente,
          id_contrato: f.id_contrato,
          vencimento: f.data_vencimento || f.vencimento,
          valor: valorExibir,
          valor_recebido: valorRecebido.toString(),
          data_pagamento: f.data_pagamento || f.pagamento_data || undefined,
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
          ipv4: l.ip_concentrador || l.ip || undefined,
          endereco,
          plano,
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
      dashboard.notas.push(...(r.notas || []));
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

      const aiResponse = await activeAIProvider.chat([
        { role: "user", content: prompt },
      ]);
      const parsedAi = JSON.parse(aiResponse.content);
      dashboard.ai_analysis = parsedAi;
    } catch (e) {
      dashboard.ai_analysis = undefined;
    }

    await cacheSet(cacheKey, dashboard, 60);

    return dashboard;
  }
}
