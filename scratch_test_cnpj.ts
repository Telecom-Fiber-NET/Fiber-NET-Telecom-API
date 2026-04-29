import { ixcService } from "./src/services/ixcService";

async function test() {
  const cnpj = "00622450000116";
  console.log(`Buscando clientes para CNPJ: ${cnpj}`);
  const clientes = await ixcService.buscarClientesPorCpf(cnpj);
  console.log(`Clientes encontrados: ${clientes.length}`);
  
  for (const cliente of clientes) {
    console.log(`\nCliente ID: ${cliente.id} - Nome: ${cliente.razao}`);
    const faturas = await ixcService.financeiroListar(cliente.id);
    console.log(`Faturas: ${faturas.length}`);
    faturas.forEach(f => {
      console.log(`  Fatura ID: ${f.id} - Status: ${f.status} - Vencimento: ${f.data_vencimento} - Valor: ${f.valor}`);
    });

    const notas = await ixcService.listarNotasFiscais(cliente.id);
    console.log(`Notas Fiscais: ${notas.length}`);
    notas.forEach(n => {
      console.log(`  ID: ${n.id} - Numero: ${n.numero_nf || n.numero_nota} - Emissao: ${n.data_emissao} - Valor: ${n.valor_total || n.valor}`);
    });
  }
}

test().catch(console.error);
