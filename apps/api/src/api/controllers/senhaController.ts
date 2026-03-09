// src/api/controllers/senhaController.ts
import { Request, Response } from "express";
import { ixcService } from "../../services/ixcService";

/**
 * Troca a senha do hotsite (Área do Cliente)
 */
export async function trocarSenha(req: Request, res: Response) {
  try {
    const { novaSenha } = req.body;

    // O ID vem do token JWT (middleware de autenticação)
    // @ts-ignore
    const clienteId = req.user?.ids?.[0];

    if (!clienteId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    if (!novaSenha) {
      return res.status(400).json({ error: "A nova senha é obrigatória." });
    }

    // Chama o serviço que busca o cliente completo e faz o PUT com a nova senha
    await ixcService.alterarSenhaHotsite(Number(clienteId), novaSenha);

    return res.json({
      success: true,
      message: "Senha alterada com sucesso!",
    });
  } catch (error) {
    console.error("Erro no controller de senha:", error);
    return res.status(500).json({ error: "Não foi possível alterar a senha." });
  }
}

/**
 * Valida a força da senha (Auxiliar)
 */
export async function validarForcaSenha(req: Request, res: Response) {
  const { senha } = req.body;

  if (!senha || senha.length < 6) {
    return res.json({
      forte: false,
      message: "A senha deve ter pelo menos 6 caracteres.",
    });
  }

  return res.json({ forte: true, message: "Senha válida." });
}

/**
 * Solicita recuperação de senha (via E-mail/SMS)
 */
export async function solicitarRecuperacaoSenha(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "E-mail é obrigatório." });
    }

    const cliente = await ixcService.buscarClientePorEmail(email);

    if (!cliente) {
      // Por segurança, não informamos se o e-mail não existe
      return res.json({
        success: true,
        message: "Se o e-mail estiver cadastrado, você receberá instruções.",
      });
    }

    // AQUI: Implementar lógica de envio de e-mail ou integração com IXC
    // Como o IXC não tem endpoint nativo fácil para "recuperar senha" via API externa,
    // geralmente enviamos um e-mail próprio ou geramos um ticket.

    console.log(
      `[Recuperação] Solicitação para ${email} (Cliente ID: ${cliente.id})`
    );

    return res.json({
      success: true,
      message: "Se o e-mail estiver cadastrado, você receberá instruções.",
    });
  } catch (error) {
    console.error("Erro ao solicitar recuperação:", error);
    return res.status(500).json({ error: "Erro ao processar solicitação." });
  }
}
