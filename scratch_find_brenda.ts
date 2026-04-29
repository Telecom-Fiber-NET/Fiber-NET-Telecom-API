import "dotenv/config";
import { ixcService } from "./src/services/ixcService";

async function main() {
  // Busca clientes com o CNPJ da empresa (já tratado pelo service)
  const clientes = await ixcService.buscarClientesPorCpf("00622450000116");
  console.log(`\n=== Clientes encontrados: ${clientes.length} ===`);
  clientes.forEach(c => {
    console.log(`ID: ${c.id} | Nome: ${c.razao || c.fantasia} | Email: ${c.email || c.hotsite_email || 'N/A'} | Senha: ${c.senha || 'N/A'} | Status: ${c.status}`);
  });
  
  // Busca Brenda por nome
  console.log("\n=== Buscando BRENDA MORAES... ===");
  const res = await (ixcService as any).fetchIxc("cliente", {
    qtype: "cliente.razao",
    query: "BRENDA MORAES",
    oper: "like",
    page: "1",
    rp: "10"
  });
  console.log(`Encontrados: ${res.length}`);
  res.forEach((c: any) => {
    console.log(`ID: ${c.id} | Nome: ${c.razao} | Email: ${c.email || c.hotsite_email || 'N/A'} | Senha: ${c.senha || 'N/A'} | CPF: ${c.cnpj_cpf} | Status: ${c.status}`);
  });
}

main().catch(console.error);
