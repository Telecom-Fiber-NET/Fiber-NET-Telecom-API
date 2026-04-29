import { ixcService } from "./src/services/ixcService";

async function test() {
  const idSaida = "193638";
  const endpoints = ["vd_saida", "fn_venda", "fn_saida_21_22"];
  
  for (const endpoint of endpoints) {
    console.log(`\nBuscando em ${endpoint} por ID: ${idSaida}`);
    try {
      // @ts-ignore
      const results = await ixcService.fetchIxc(endpoint, {
        qtype: "id",
        query: idSaida,
        oper: "=",
      });
      console.log(`Resultados em ${endpoint}: ${results.length}`);
      if (results.length > 0) {
        console.log(JSON.stringify(results[0], null, 2));
      }
    } catch (e) {
      console.log(`Erro em ${endpoint}: ${e.message}`);
    }
  }
}

test().catch(console.error);
