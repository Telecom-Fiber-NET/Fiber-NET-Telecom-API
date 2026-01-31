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
  constructor(private ixc = ixcService) {}

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
        endereco: `${r.cliente.endereco || ""}${
          r.cliente.numero ? ", " + r.cliente.numero : ""
        }`,
        cpn_cnpj: r.cliente.cnpj_cpf,
      });

      r.contratos.forEach((c: any) =>
        dashboard.contratos.push({
          id: c.id,
          plano: c.descricao_aux_plano_venda,
          status: c.status,
          pdf_link: `/contrato/${c.id}`,
        }),
      );

      r.faturas.forEach((f: any) =>
        dashboard.faturas.push({
          id: f.id,
          vencimento: f.data_vencimento || f.vencimento,
          valor: f.valor,
          valor_recebido:
            f.valor_recebido || f.valor_pago || f.pagamento_valor || 0,
          status: f.status === "A" ? "aberto" : "pago",
          pix_code: f.pix_txid,
          linha_digitavel: f.linha_digitavel,
        }),
      );

      r.logins.forEach((l: any) =>
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
          ip_privado: l.ip || "Não atribuído", // IP vindo do cadastro do IXC
          ip_publico: clientIp, // IP detectado da requisição
        }),
      );

      dashboard.ordensServico.push(...r.ordens);
      dashboard.tickets = dashboard.tickets || [];
      dashboard.tickets.push(...(r.tickets || []));
      dashboard.termos = dashboard.termos || [];
      dashboard.termos.push(...(r.termos || []));
      dashboard.ontInfo.push(...r.ontInfo);
    }

    // ... (cálculo de consumo mantém-se igual) ...
    const allLogins = dashboard.logins;
    if (allLogins.length > 0) {
      const consumoPromises = allLogins.map((ln: any) =>
        this.ixc.getConsumoCompleto(ln),
      );
      const consumoResults = await Promise.all(consumoPromises);
      for (const c of consumoResults) {
        dashboard.consumo.total_download_bytes += c.total_download_bytes || 0;
        dashboard.consumo.total_upload_bytes += c.total_upload_bytes || 0;
        dashboard.consumo.history.daily.push(...(c.history?.daily || []));
        dashboard.consumo.history.monthly.push(...(c.history?.monthly || []));
      }
      dashboard.consumo.total_download = formatBytes(
        dashboard.consumo.total_download_bytes,
      );
      dashboard.consumo.total_upload = formatBytes(
        dashboard.consumo.total_upload_bytes,
      );
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
      dashboard.notas = [{ id: "ai-insights", ...parsedAi } as any];
    } catch (e) {
      dashboard.notas = [];
    }

    await cacheSet(cacheKey, dashboard, 60);

    return dashboard;
  }
}
