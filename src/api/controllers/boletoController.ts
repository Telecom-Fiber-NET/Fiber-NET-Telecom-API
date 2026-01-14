// spell:disable
// src/api/controllers/boletoController.ts
import { Request, Response } from "express";
import { z } from "zod";
import { ixcService } from "../../services/ixcService";

// Schema de validação para CPF/CNPJ
const buscarBoletoSchema = z.object({
  cpfCnpj: z
    .string()
    .min(11, "CPF/CNPJ inválido")
    .max(14, "CPF/CNPJ inválido")
    .regex(/^\d+$/, "CPF/CNPJ deve conter apenas números"),
});

/**
 * Busca boletos por CPF/CNPJ (endpoint público)
 */
export async function buscarBoletosPorCpf(req: Request, res: Response) {
  try {
    // 1. Validar CPF/CNPJ
    const validacao = buscarBoletoSchema.safeParse(req.body);

    if (!validacao.success) {
      return res.status(400).json({
        error: "Dados inválidos",
        detalhes: validacao.error.issues.map((issue) => ({
          campo: issue.path.join("."),
          mensagem: issue.message,
        })),
      });
    }

    const { cpfCnpj } = validacao.data;

    // 2. Buscar cliente por CPF/CNPJ
    const clientes = await ixcService.buscarClientesPorCpf(cpfCnpj);

    if (!clientes || clientes.length === 0) {
      return res.status(404).json({
        error: "Nenhum cliente encontrado com este CPF/CNPJ",
      });
    }

    // 3. Buscar boletos de todos os clientes encontrados
    const todosOsBoletos = [];

    for (const cliente of clientes) {
      const faturas = await ixcService.financeiroListar(cliente.id);

      const boletosCliente = faturas
        .filter((f: any) => {
          // Filtra apenas o que interessa ao cliente (Aberto ou Parcial)
          // Status 'R' (Recebido) e 'C' (Cancelado) são ignorados nesta visualização
          return f.status === "A" || f.status === "P";
        })
        .map((fatura: any) => {
          // LÓGICA DE VALOR (Baseada no seu JSON):
          // Se for Parcial ('P') e tiver valor_aberto, usa o aberto. Senão, usa o valor total.
          const valorAExibir =
            fatura.status === "P" && Number(fatura.valor_aberto) > 0
              ? parseFloat(fatura.valor_aberto)
              : parseFloat(fatura.valor);

          return {
            id: fatura.id,
            clienteId: cliente.id,
            // Mapeamento baseado no JSON fornecido (id_contrato é o padrão do IXC)
            contrato_id: fatura.id_contrato || fatura.contrato_id,
            clienteNome: cliente.razao || cliente.fantasia,
            documento: fatura.documento || `Fat-${fatura.id}`,

            // Datas
            vencimento: fatura.data_vencimento,
            vencimentoFormatado: formatarData(fatura.data_vencimento),

            // Valores calculados
            valor: valorAExibir,
            valorFormatado: formatarValor(valorAExibir.toString()),
            valorOriginal: parseFloat(fatura.valor), // Útil se quiser mostrar "De R$ 100 por R$ 50"

            // Dados de Pagamento
            linhaDigitavel: fatura.linha_digitavel,
            pixCopiaECola: fatura.pix_txid || null, // Campo confirmado no JSON
            boleto_pdf_link: fatura.boleto || null,

            // Status e Metadados
            status: fatura.status, // A ou P
            statusDescricao:
              fatura.status === "P"
                ? "Pagamento Parcial"
                : getStatusPagamento(fatura.data_vencimento),
            diasVencimento: calcularDiasVencimento(fatura.data_vencimento),
          };
        });

      todosOsBoletos.push(...boletosCliente);
    }

    // 4. Ordenar: Vencidos primeiro (urgência), depois os futuros
    todosOsBoletos.sort((a, b) => {
      return (
        new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()
      );
    });

    // 5. Calcular resumo financeiro
    const totalEmAberto = todosOsBoletos.reduce((sum, b) => sum + b.valor, 0);
    const boletosVencidos = todosOsBoletos.filter(
      (b) => b.diasVencimento < 0
    ).length;
    const boletosAVencer = todosOsBoletos.filter(
      (b) => b.diasVencimento >= 0
    ).length;

    return res.json({
      success: true,
      cpfCnpj: formatarCpfCnpj(cpfCnpj),
      resumo: {
        totalBoletos: todosOsBoletos.length,
        totalEmAberto: totalEmAberto,
        totalEmAbertoFormatado: formatarValor(totalEmAberto.toString()),
        boletosVencidos: boletosVencidos,
        boletosAVencer: boletosAVencer,
      },
      boletos: todosOsBoletos,
      clientes: clientes.map((c) => ({
        id: c.id,
        nome: c.razao || c.fantasia,
        cpfCnpj: formatarCpfCnpj(c.cnpj_cpf),
      })),
    });
  } catch (error: unknown) {
    console.error("Erro ao buscar boletos:", error);
    if (error instanceof Error) {
      // Erro de conexão ou timeout do IXC
      if (
        error.message?.includes("IXC") ||
        error.message?.includes("connect")
      ) {
        return res.status(502).json({
          error: "Sistema financeiro indisponível temporariamente",
          detalhes: "Tente novamente em alguns instantes",
        });
      }
    }
    return res.status(500).json({ error: "Erro interno ao buscar boletos" });
  }
}

export async function buscarPixBoleto(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({ error: "ID da fatura é obrigatório" });

    console.log(`[API] Buscando Pix para boleto ID: ${id}`); // LOG 1

    const dadosPix = await ixcService.buscarPixDetalhado(Number(id));

    // LOG 2: Veja o que chegou no console
    console.log("[API] Dados retornados do Service:", dadosPix);

    // Verificação robusta
    if (dadosPix && dadosPix.pix && dadosPix.pix.qrCode) {
      return res.json({
        success: true,
        pixCopiaECola: dadosPix.pix.qrCode.qrcode,
        pixImagem: dadosPix.pix.qrCode.imagemQrcode,
      });
    }

    // Se falhar, avisa no console por que falhou
    console.warn("[API] Estrutura do Pix inválida ou vazia.");

    return res
      .status(404)
      .json({ error: "Pix não disponível para este boleto." });
  } catch (error) {
    console.error("Erro crítico ao buscar pix:", error);
    return res.status(500).json({
      error: "Erro ao buscar pix",
    });
  }
}

//)

/**
 * Gera segunda via de boleto (Baixa PDF e retorna Base64)
 */
export async function gerarSegundaVia(req: Request, res: Response) {
  try {
    const { fatura_id } = req.params;

    // O middleware de autenticação popula o req.user
    // @ts-ignore
    const userIds = req.user?.ids;

    if (!fatura_id) {
      return res.status(400).json({ error: "ID da fatura é obrigatório" });
    }

    // 1. Validação de Segurança: A fatura pertence ao usuário?
    // Se estiver logado, verificamos se a fatura é dele.
    if (userIds && userIds.length > 0) {
      let pertence = false;
      // Verifica em todos os clientes vinculados ao login do usuário
      for (const idCliente of userIds) {
        const faturas = await ixcService.financeiroListar(Number(idCliente));
        // Verifica se o ID da fatura existe na lista deste cliente
        if (faturas.some((f: any) => String(f.id) === String(fatura_id))) {
          pertence = true;
          break;
        }
      }

      if (!pertence) {
        return res.status(403).json({
          error: "Acesso negado: Fatura não pertence a este usuário.",
        });
      }
    }

    // 2. Busca o Conteúdo do PDF (Base64)
    // Chama o novo método do serviço que baixa o arquivo do link do IXC
    const base64 = await ixcService.imprimirBoleto(Number(fatura_id));

    if (!base64) {
      return res.status(404).json({
        error: "O arquivo da fatura não está disponível no momento.",
      });
    }

    // 3. Retorna para o Frontend
    return res.json({
      success: true,
      base64_document: base64, // O frontend espera esta chave para gerar o download
      message: "Segunda via gerada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao gerar segunda via:", error);
    return res.status(500).json({
      error: "Erro interno ao processar a segunda via.",
    });
  }
}

// Funções auxiliares
function formatarData(data: string): string {
  if (!data) return "";
  const d = new Date(data);
  return d.toLocaleDateString("pt-BR");
}

function formatarValor(valor: string): string {
  const num = parseFloat(valor);
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarCpfCnpj(cpfCnpj: string): string {
  const limpo = cpfCnpj.replace(/\D/g, "");

  if (limpo.length === 11) {
    // CPF: 000.000.000-00
    return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  } else if (limpo.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return limpo.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  }

  return cpfCnpj;
}

function calcularDiasVencimento(vencimento: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataVenc = new Date(vencimento);
  dataVenc.setHours(0, 0, 0, 0);

  const diffTime = dataVenc.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

function getStatusPagamento(vencimento: string): string {
  const dias = calcularDiasVencimento(vencimento);

  if (dias < 0) return "Vencido";
  if (dias === 0) return "Vence Hoje";
  if (dias <= 5) return "Vence em Breve";
  return "A Vencer";
}

function getStatusCor(vencimento: string): string {
  const dias = calcularDiasVencimento(vencimento);

  if (dias < 0) return "danger"; // Vermelho
  if (dias === 0) return "danger"; // Vermelho
  if (dias <= 5) return "warning"; // Amarelo
  return "success"; // Verde
}
