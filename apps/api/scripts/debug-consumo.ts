
import "dotenv/config";
import { ixcService } from "../src/services/ixcService";

async function debugConsumo() {
  const email = "carlos847@gmail.com";
  const password = "123456";

  console.log(`--- Iniciando debug para o email: ${email} ---`);

  // 1. Buscar cliente pelo email
  const cliente = await ixcService.buscarClientePorEmail(email);

  if (!cliente) {
    console.error("ERRO: Cliente não encontrado com este email.");
    return;
  }

  console.log("Cliente encontrado:", {
    id: cliente.id,
    razao: cliente.razao,
    cnpj_cpf: cliente.cnpj_cpf,
    hotsite_senha: (cliente as any).hotsite_senha,
    senha_legada: (cliente as any).senha,
  });

  // 2. Validar a senha
  const hotsite_senha = (cliente as any).hotsite_senha;
  const senha_legada = (cliente as any).senha;
  const senhaValida = (hotsite_senha && String(hotsite_senha).trim() !== "") 
      ? hotsite_senha 
      : senha_legada;

  if (senhaValida !== password) {
    console.error(`ERRO: Senha incorreta.`);
    console.log(`Senha esperada: ${senhaValida}, Senha recebida: ${password}`);
    return;
  }

  console.log("Senha validada com sucesso!");

  // 3. Buscar logins associados ao cliente
  const logins = await ixcService.loginsListar(cliente.id);

  if (!logins || logins.length === 0) {
    console.error("ERRO: Nenhum login (conexão) encontrado para este cliente.");
    return;
  }

  console.log(`Encontrado(s) ${logins.length} login(s):`);
  logins.forEach(login => {
    console.log(`- Login:`, login);
  });

  // 4. Buscar consumo para cada login
  for (const login of logins) {
    console.log(`\n--- Buscando consumo para o Login ID: ${login.id} (${login.usuario}) ---`);
    try {
      const consumoMensal = await ixcService.getConsumoMensal(login.id);
      
      if (consumoMensal && consumoMensal.length > 0) {
        console.log("Consumo Mensal encontrado:");
        console.table(consumoMensal.map(c => ({
          Data: c.data,
          Consumo: c.consumo,
          Consumo_Upload: c.consumo_upload,
        })));
      } else {
        console.log("Nenhum registro de consumo mensal encontrado para este login.");
      }

      const consumoDiario = await ixcService.getConsumoDiario(login.id);
      if (consumoDiario && consumoDiario.length > 0) {
        console.log("Consumo Diário encontrado:");
        console.table(consumoDiario.map(c => ({
            Data: c.data,
            Consumo: c.consumo,
            Consumo_Upload: c.consumo_upload,
        })));
      } else {
          console.log("Nenhum registro de consumo diario encontrado para este login.");
      }
      
    } catch (error) {
      console.error(`ERRO ao buscar consumo para o login ${login.id}:`, error);
    }
  }

  console.log(`
--- Debug finalizado ---`);
}

debugConsumo();
