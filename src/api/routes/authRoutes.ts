import "dotenv/config";
import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { ixcService } from "../../services/ixcService";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  console.log("--- NOVO LOGIN ---");
  console.log("Raw Body:", JSON.stringify(req.body));
  
  // Aceita 'password' ou 'senha' para compatibilidade com o Frontend
  const email = req.body.email;
  const password = req.body.password || req.body.senha;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }

  try {
    // 1. Busca o cliente "principal" no IXC pelo email para validar a senha
    const clientePrincipal = await ixcService.buscarClientePorEmail(email);
    console.log("Cliente Principal:", clientePrincipal);

    // 2. Verifica se encontrou
    if (!clientePrincipal) {
      return res.status(401).json({ error: "Cliente não encontrado" });
    }

    // 3. Valida a senha (com fallback para 'senha' antigo)
    const hotsite_senha = (clientePrincipal as any).hotsite_senha;
    const senha_legada = (clientePrincipal as any).senha;
    
    // Fallback robusto: Prioriza hotsite_senha se existir e não for vazia, senão usa senha_legada
    const senhaValida = (hotsite_senha && String(hotsite_senha).trim() !== "") 
      ? hotsite_senha 
      : senha_legada;

    console.log(`Debug Login:`, {
      email,
      hotsite_senha: hotsite_senha || "VAZIO",
      senha_legada: senha_legada || "VAZIO",
      senha_escolhida_para_validar: senhaValida,
      match: senhaValida === password,
    });

    if (!senhaValida || senhaValida !== password) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    // ==================================================================
    // NOVA LÓGICA: Unificação por CPF/CNPJ
    // ==================================================================

    let todosIds: number[] = [clientePrincipal.id];
    let nomeUsuario = clientePrincipal.razao || clientePrincipal.fantasia;

    // Se o cliente tiver CPF/CNPJ cadastrado
    if (clientePrincipal.cnpj_cpf) {
      try {
        console.log(
          `Buscando contratos vinculados ao CPF: ${clientePrincipal.cnpj_cpf}`,
        );

        // Busca todos os clientes com o mesmo documento
        const clientesVinculados = await ixcService.buscarClientesPorCpf(
          clientePrincipal.cnpj_cpf,
        );

        if (clientesVinculados && clientesVinculados.length > 0) {
          // Extrai os IDs de todos os cadastros encontrados
          todosIds = clientesVinculados.map((c) => c.id);

          console.log(
            `Login unificado com sucesso. IDs encontrados: ${todosIds.join(
              ", ",
            )}`,
          );
        }
      } catch (err) {
        console.error("Erro ao buscar clientes vinculados por CPF:", err);
        // Se der erro na busca extra, segue apenas com o ID principal para não travar o login
      }
    }

    // 4. Gera o token JWT com TODOS os IDs encontrados
    const token = jwt.sign(
      {
        ids: todosIds, // Agora o array contém [id1, id2, id3...]
        email: clientePrincipal.email || email,
      },
      process.env.JWT_SECRET || "secret_padrao_seguro",
      { expiresIn: "5m" },
    );

    return res.json({
      token,
      user: {
        id: clientePrincipal.id,
        ids_vinculados: todosIds,
        nome: nomeUsuario,
        cnpj_cpf: clientePrincipal.cnpj_cpf,
        email: clientePrincipal.email,
      },
    });
  } catch (error) {
    console.error("Erro interno no login:", error);
    return res.status(500).json({ error: "Erro ao processar login" });
  }
});

export default router;
