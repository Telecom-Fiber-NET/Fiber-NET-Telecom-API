import { Request, Response } from "express";
import { GeminiService } from "../../services/ai/gemini";
import { ixcService } from "../../services/ixcService";

// Função auxiliar para formatar bytes
function formatBytes(bytes: number, decimals = 2) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export async function handleChat(req: Request, res: Response) {
  try {
    const { message } = req.body;

    // 1. Recupera e converte o ID do usuário
    // @ts-ignore
    const userIdRaw = req.user?.ids?.[0];
    const userId = Number(userIdRaw);

    if (!userId || isNaN(userId)) {
      return res.status(401).json({ error: "Usuário não identificado." });
    }

    if (!message) {
      return res.status(400).json({ error: "Mensagem vazia." });
    }

    // 2. Busca dados frescos do cliente para dar contexto à IA
    const [clientes, contratos, faturas, logins] = await Promise.all([
      ixcService.buscarClientesPorId(userId),
      ixcService.buscarContratosPorIdCliente(userId),
      ixcService.financeiroListar(userId),
      ixcService.loginsListar(userId),
    ]);

    // 3. Busca dados de consumo reais (se houver login)
    let consumoDados = { total_download: "0", total_upload: "0" };
    if (logins && logins.length > 0) {
      try {
        const consumoReal = await ixcService.getConsumoCompleto(logins[0]);
        consumoDados = {
          total_download: formatBytes(consumoReal.total_download_bytes),
          total_upload: formatBytes(consumoReal.total_upload_bytes),
        };
      } catch (e) {
        console.warn("Falha ao buscar consumo para o chat:", e);
      }
    }

    // 4. Monta o pacote de dados para a IA
    const clientData = {
      clientes: [clientes],
      contratos,
      faturas,
      logins,
      consumo: consumoDados,
    };

    // 5. Envia para a IA processar
    const responseText = await GeminiService.chat(message, clientData);

    return res.json({ text: responseText });
  } catch (error) {
    console.error("Erro no chat:", error);
    return res.status(500).json({ error: "Erro ao processar mensagem." });
  }
}
