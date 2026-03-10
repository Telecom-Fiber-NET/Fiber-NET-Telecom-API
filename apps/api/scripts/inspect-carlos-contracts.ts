
import "dotenv/config";
import { ixcService } from "../src/services/ixcService";
import { contratoService } from "../src/services/contratoService";

async function inspectContracts() {
  const email = "carlos847@gmail.com";
  const cliente = await ixcService.buscarClientePorEmail(email);

  if (!cliente) {
    console.log("Cliente não encontrado");
    return;
  }

  console.log("--- DADOS BRUTOS DO IXC ---");
  const contratosBrutos = await ixcService.buscarContratosDetalhados(cliente.id);
  contratosBrutos.forEach(c => {
    console.log(`ID: ${c.id}`);
    console.log(`- descrição plano (aux): ${c.descricao_aux_plano_venda}`);
    console.log(`- descrição (contrato): ${c.contrato}`);
    console.log(`- status: ${c.status}`);
    console.log(`- status_internet: ${c.status_internet}`);
    console.log(`- assinatura_digital: ${c.assinatura_digital}`);
    console.log('---------------------------');
  });

  console.log("\n--- DADOS FORMATADOS PELO SERVICE ---");
  const contratosFormatados = await contratoService.listarFormatados(cliente.id);
  console.log(JSON.stringify(contratosFormatados, null, 2));
}

inspectContracts();
