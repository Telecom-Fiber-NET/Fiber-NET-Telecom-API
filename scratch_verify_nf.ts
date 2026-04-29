import { ixcService } from "./src/services/ixcService";

async function test() {
  const idSaida = "193638";
  console.log(`Buscando nota fiscal por ID: ${idSaida}`);
  // @ts-ignore
  const notas = await ixcService.fetchIxc("fn_saida", {
    qtype: "id",
    query: idSaida,
    oper: "=",
  });
  console.log(`Notas encontradas: ${notas.length}`);
  if (notas.length > 0) {
    console.log(JSON.stringify(notas[0], null, 2));
  }
}

test().catch(console.error);
