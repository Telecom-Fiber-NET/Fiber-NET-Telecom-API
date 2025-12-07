// src/api/controllers/senhaController.ts
import { Request, Response } from "express";
import { z } from "zod";
import { ixcService } from "../../services/ixcService";

// Schema de validação para troca de senha
const trocarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Senha atual é obrigatória"),
    novaSenha: z
      .string()
      .min(8, "A nova senha deve ter no mínimo 8 caracteres")
      .max(50, "A nova senha deve ter no máximo 50 caracteres")
      .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
      .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
      .regex(/[0-9]/, "A senha deve conter pelo menos um número"),
    confirmarSenha: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

/**
 * Troca a senha do hotsite do cliente
 */
export async function trocarSenha(req: any, res: Response) {
  try {
    // 1. Validar dados
    const validacao = trocarSenhaSchema.safeParse(req.body);

    if (!validacao.success) {
      return res.status(400).json({
        error: "Dados inválidos",
        detalhes: validacao.error.issues.map((e) => ({
          campo: e.path.join("."),
          mensagem: e.message,
        })),
      });
    }

    const { senhaAtual, novaSenha } = validacao.data;
    const clienteId = req.user?.ids?.[0];
    const email = req.user?.email;

    if (!clienteId || !email) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    // 2. Buscar cliente
    const cliente = await ixcService.buscarClientesPorId(clienteId);
    if (!cliente) {
      return res.status(404).json({
        error: "Cliente não encontrado",
      });
    }

    // 3. Verificar senha atual
    // ATENÇÃO: O IXC armazena senhas em texto plano (problema de segurança deles)
    if (cliente.senha !== senhaAtual) {
      return res.status(401).json({
        error: "Senha atual incorreta",
      });
    }

    // 4. Verificar se a nova senha é diferente da atual
    if (senhaAtual === novaSenha) {
      return res.status(400).json({
        error: "A nova senha deve ser diferente da senha atual",
      });
    }

    // 5. Atualizar senha no IXC
    await ixcService.alterarSenhaHotsite(clienteId, novaSenha);

    // 6. Log de auditoria (em produção, salvar em banco)
    console.log(
      `[AUDITORIA] Senha alterada - Cliente: ${clienteId} - Data: ${new Date().toISOString()}`
    );

    return res.json({
      success: true,
      message: "Senha alterada com sucesso!",
      aviso: "Utilize a nova senha em seu próximo acesso.",
    });
  } catch (error: any) {
    console.error("Erro ao trocar senha:", error);

    // Tratamento de erros específicos
    if (error.message?.includes("IXC")) {
      return res.status(502).json({
        error: "Erro ao comunicar com o sistema",
        detalhes:
          "Não foi possível alterar a senha. Tente novamente em alguns instantes.",
      });
    }

    return res.status(500).json({
      error: "Erro ao alterar senha",
      detalhes: "Ocorreu um erro interno. Por favor, contate o suporte.",
    });
  }
}

/**
 * Solicita recuperação de senha por email
 */
export async function solicitarRecuperacaoSenha(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email é obrigatório",
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Email inválido",
      });
    }

    // Buscar cliente por email
    const cliente = await ixcService.buscarClientePorEmail(email);

    // Por segurança, sempre retornar sucesso (não revelar se o email existe)
    if (!cliente) {
      return res.json({
        success: true,
        message:
          "Se o email estiver cadastrado, você receberá instruções para recuperação de senha.",
      });
    }

    // TODO: Implementar envio de email com token de recuperação
    // Por enquanto, apenas log
    console.log(
      `[RECUPERAÇÃO] Solicitação para: ${email} - Cliente: ${cliente.id}`
    );

    return res.json({
      success: true,
      message:
        "Se o email estiver cadastrado, você receberá instruções para recuperação de senha.",
    });
  } catch (error) {
    console.error("Erro ao solicitar recuperação de senha:", error);
    return res.status(500).json({
      error: "Erro ao processar solicitação",
    });
  }
}

/**
 * Valida força da senha (endpoint auxiliar para frontend)
 */
export async function validarForcaSenha(req: Request, res: Response) {
  const { senha } = req.body;

  if (!senha) {
    return res.status(400).json({ error: "Senha não fornecida" });
  }

  let forca = 0;
  let feedback: string[] = [];

  // Critérios de validação
  if (senha.length >= 8) forca += 1;
  else feedback.push("Mínimo 8 caracteres");

  if (/[A-Z]/.test(senha)) forca += 1;
  else feedback.push("Adicione letras maiúsculas");

  if (/[a-z]/.test(senha)) forca += 1;
  else feedback.push("Adicione letras minúsculas");

  if (/[0-9]/.test(senha)) forca += 1;
  else feedback.push("Adicione números");

  if (/[^A-Za-z0-9]/.test(senha)) forca += 1;
  else feedback.push("Adicione caracteres especiais (!@#$%...)");

  const niveis = ["Muito fraca", "Fraca", "Razoável", "Forte", "Muito forte"];
  const nivel = niveis[forca - 1] || "Muito fraca";

  return res.json({
    nivel,
    forca,
    maxForca: 5,
    porcentagem: (forca / 5) * 100,
    valida: forca >= 3,
    feedback,
  });
}
