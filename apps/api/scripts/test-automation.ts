
import "dotenv/config";
import { ixcService } from "../src/services/ixcService";
import { contratoService } from "../src/services/contratoService";
import { suporteService } from "../src/services/suporteService";
import { DashboardService } from "../src/services/dashboardService";

async function runTests() {
  console.log("=== INICIANDO TESTES AUTOMATIZADOS ===");

  // 1. Buscando o cliente Carlos para testes de ação (Contrato #5874)
  const email = "carlos847@gmail.com";
  const clienteCarlos = await ixcService.buscarClientePorEmail(email);

  if (clienteCarlos) {
    console.log(`\n[+] Cliente Base Encontrado: ${clienteCarlos.id} - ${clienteCarlos.razao}`);
    const idContratoTeste = 5874;

    try {
      console.log(`\n--- TESTE 1: Assinatura Digital do Contrato #${idContratoTeste} ---`);
      // Simula uma assinatura (como o método retorna a resposta do IXC, vamos capturar)
      const resAssinatura = await contratoService.assinarContrato(idContratoTeste, "127.0.0.1");
      console.log("Sucesso na Assinatura:", resAssinatura ? "Sim" : "Não");
    } catch (e: any) {
      console.log("Retorno Assinatura (Esperado se já assinado):", e.message);
    }

    try {
      console.log(`\n--- TESTE 2: Criação de Ticket para Cliente ${clienteCarlos.id} (Ref: Contrato #${idContratoTeste}) ---`);
      const payloadTicket = {
        id_cliente: String(clienteCarlos.id),
        id_contrato: String(idContratoTeste),
        titulo: "TESTE AUTOMATIZADO - LENTIDÃO",
        menssagem: "Testando a abertura de ticket via API Gateway",
        origem_endereco: "M", // Endereço manual ou cliente
      };
      const resTicket = await ixcService.criarTicket(payloadTicket);
      console.log("Ticket Criado! Protocolo:", resTicket.protocolo);
    } catch (e: any) {
      console.log("Erro ao criar ticket:", e.message);
    }

    // A criação de OS no IXC requer vários IDs específicos de filial e setor, vamos tentar listar para validar a leitura e escrita
    console.log(`\n--- TESTE 3: Listagem Unificada de Suporte (OS + Tickets) ---`);
    const atendimentos = await suporteService.listarAtendimentos(clienteCarlos.id, idContratoTeste);
    console.log(`Encontrados ${atendimentos.length} atendimentos para o contrato ${idContratoTeste}.`);
    if (atendimentos.length > 0) {
        console.log(`Último atendimento: [${atendimentos[0].tipo}] ${atendimentos[0].titulo} - Status: ${atendimentos[0].status.label}`);
    }

  } else {
    console.log("Cliente base (Carlos) não encontrado.");
  }

  console.log(`\n--- TESTE 4: Teste de Carga - Dashboard para 10 Clientes ---`);
  try {
    // Buscando 10 clientes genéricos no IXC para teste de carga do DashboardService
    const clientes = await fetchIxcClients(10);
    console.log(`Encontrados ${clientes.length} clientes. Gerando dashboards...`);
    
    const dashboardService = new DashboardService();
    let sucesso = 0;
    
    for (const cli of clientes) {
      const db = await dashboardService.gerarDashboard([cli.id]);
      if (db && db.clientes.length > 0) sucesso++;
    }
    
    console.log(`\n✅ TESTE DE CARGA CONCLUÍDO: ${sucesso}/${clientes.length} Dashboards gerados com sucesso.`);
  } catch (e: any) {
     console.log("Erro no teste de carga:", e.message);
  }

  console.log("\n=== TESTES FINALIZADOS ===");
}

// Helper para buscar 10 clientes
import axios from "axios";
async function fetchIxcClients(limit: number) {
  const url = `${process.env.IXC_API_URL || process.env.IXC_BASE_URL}/cliente`;
  const token = process.env.IXC_ADMIN_TOKEN || process.env.IXC_AUTH_BASIC;
  const auth = token?.includes("Basic") ? token : `Basic ${token}`;
  
  const payload = {
    qtype: "cliente.id",
    query: "",
    oper: ">",
    page: "1",
    rp: String(limit),
    sortname: "cliente.id",
    sortorder: "desc"
  };

  try {
      const resp = await axios.post(url, payload, {
          headers: { "Content-Type": "application/json", "Authorization": auth, "ixcsoft": "listar" }
      });
      return resp.data.registros || [];
  } catch (e) {
      return [];
  }
}

runTests();
