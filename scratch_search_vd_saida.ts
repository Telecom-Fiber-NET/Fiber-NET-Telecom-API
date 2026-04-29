import { ixcService } from "./src/services/ixcService";

async function test() {
  const idCliente = "4007";
  console.log(`Buscando em vd_saida por id_cliente: ${idCliente}`);
  // @ts-ignore
  const results = await ixcService.fetchIxc("vd_saida", {
    qtype: "id_cliente",
    query: idCliente,
    oper: "=",
    rp: "100",
    sortname: "data_saida",
    sortorder: "desc"
  });
  console.log(`Resultados: ${results.length}`);
  results.forEach(r => {
    if (r.numero_nf) {
      console.log(`  ID: ${r.id} - NF: ${r.numero_nf} - Data: ${r.data_saida} - Status: ${r.status}`);
    }
  });
}

test().catch(console.error);
