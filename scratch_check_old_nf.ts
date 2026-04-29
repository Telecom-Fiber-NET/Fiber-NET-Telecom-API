import { ixcService } from "./src/services/ixcService";

async function test() {
  const idSaida = "193636";
  console.log(`Buscando em vd_saida por ID: ${idSaida}`);
  // @ts-ignore
  const results = await ixcService.fetchIxc("vd_saida", {
    qtype: "id",
    query: idSaida,
    oper: "=",
  });
  console.log(`Resultados: ${results.length}`);
  if (results.length > 0) {
    console.log(JSON.stringify(results[0], null, 2));
  }
}

test().catch(console.error);
