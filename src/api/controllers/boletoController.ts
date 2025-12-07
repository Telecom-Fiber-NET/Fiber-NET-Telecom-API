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

      // Filtrar apenas boletos em aberto ou vencidos
      const boletosCliente = faturas
        .filter((f: any) => f.status === "A") // Apenas abertos
        .map((fatura: any) => ({
          id: fatura.id,
          clienteId: cliente.id,
          clienteNome: cliente.razao || cliente.fantasia,
          documento: fatura.documento,
          vencimento: fatura.data_vencimento,
          vencimentoFormatado: formatarData(fatura.data_vencimento),
          valor: parseFloat(fatura.valor),
          valorFormatado: formatarValor(fatura.valor),
          linhaDigitavel: fatura.linha_digitavel,
          pixCopiaECola: fatura.pix_txid || null,
          boleto_pdf_link: fatura.boleto || null,
          status: getStatusPagamento(fatura.data_vencimento),
          statusCor: getStatusCor(fatura.data_vencimento),
          diasVencimento: calcularDiasVencimento(fatura.data_vencimento),
        }));

      todosOsBoletos.push(...boletosCliente);
    }

    // 4. Ordenar por data de vencimento (mais recentes primeiro)
    todosOsBoletos.sort((a, b) => {
      return (
        new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime()
      );
    });

    // 5. Calcular resumo
    const totalEmAberto = todosOsBoletos.reduce((sum, b) => sum + b.valor, 0);
    const boletosVencidos = todosOsBoletos.filter(
      (b) => b.status === "Vencido"
    );
    const boletosAVencer = todosOsBoletos.filter(
      (b) => b.status === "A Vencer"
    );

    return res.json({
      success: true,
      cpfCnpj: formatarCpfCnpj(cpfCnpj),
      resumo: {
        totalBoletos: todosOsBoletos.length,
        totalEmAberto: totalEmAberto,
        totalEmAbertoFormatado: formatarValor(totalEmAberto.toString()),
        boletosVencidos: boletosVencidos.length,
        boletosAVencer: boletosAVencer.length,
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

    // Tratamento específico para erros conhecidos
    if (error instanceof Error) {
      if (error.message?.includes("IXC")) {
        return res.status(502).json({
          error: "Erro ao comunicar com o sistema",
          detalhes: "Tente novamente em alguns instantes",
        });
      }
    }

    return res.status(500).json({
      error: "Erro ao buscar boletos",
    });
  }
}

/**
 * Gera segunda via de boleto
 */
export async function gerarSegundaVia(req: any, res: Response) {
  try {
    const { fatura_id } = req.params;
    const clienteId = req.user?.ids?.[0]; // Para rotas autenticadas

    if (!fatura_id) {
      return res.status(400).json({
        error: "ID da fatura é obrigatório",
      });
    }

    // Se for uma rota autenticada, verificar se a fatura pertence ao cliente
    if (clienteId) {
      const faturas = await ixcService.financeiroListar(clienteId);
      const fatura = faturas.find((f: any) => f.id === parseInt(fatura_id));

      if (!fatura) {
        return res.status(403).json({
          error: "Fatura não pertence a este cliente",
        });
      }
    }

    // Buscar dados da fatura
    // Nota: O IXC geralmente já retorna o link do boleto na listagem
    // Se precisar gerar nova via, usar endpoint específico do IXC

    return res.json({
      success: true,
      message: "Segunda via gerada com sucesso",
      boleto: {
        id: fatura_id,
        // Adicionar link do PDF ou dados do boleto
      },
    });
  } catch (error) {
    console.error("Erro ao gerar segunda via:", error);
    return res.status(500).json({
      error: "Erro ao gerar segunda via do boleto",
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
