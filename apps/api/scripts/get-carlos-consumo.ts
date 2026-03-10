
import "dotenv/config";
import { ixcService } from "../src/services/ixcService";
import { DashboardService } from "../src/services/dashboardService";

async function getCarlosConsumo() {
  const email = "carlos847@gmail.com";
  const password = "123456";

  // 1. Buscar cliente pelo email
  const cliente = await ixcService.buscarClientePorEmail(email);

  if (!cliente) {
    console.log(JSON.stringify({ error: "Cliente não encontrado" }, null, 2));
    return;
  }

  // 2. Validar a senha (conforme lógica do backend)
  const hotsite_senha = (cliente as any).hotsite_senha;
  const senha_legada = (cliente as any).senha;
  const senhaValida = (hotsite_senha && String(hotsite_senha).trim() !== "") 
      ? hotsite_senha 
      : senha_legada;

  if (String(senhaValida).trim() !== password) {
    console.log(JSON.stringify({ error: "Senha incorreta", expected: senhaValida, received: password }, null, 2));
    return;
  }

  // 3. Gerar Dashboard
  const dashboardService = new DashboardService();
  const dashboard = await dashboardService.gerarDashboard([cliente.id]);

  // 4. Retornar apenas o consumo e dados relevantes de login para o front entender
  console.log(JSON.stringify({
    consumo_global: dashboard.consumo,
    logins: dashboard.logins.map(l => ({
      id: l.id,
      login: l.login,
      consumo: l.consumo
    }))
  }, null, 2));
}

getCarlosConsumo().catch(err => {
  console.error(JSON.stringify({ error: err.message }, null, 2));
});
