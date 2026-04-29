import { ixcService } from "./src/services/ixcService";

async function test() {
  const idSaida = "196283";
  console.log(`Testando impressão de NF para ID: ${idSaida}`);
  try {
    const base64 = await ixcService.imprimirNotaFiscal(Number(idSaida));
    console.log(`Tipo do resultado: ${typeof base64}`);
    console.log(`Resultado: ${base64 ? 'Sucesso' : 'Falha'}`);
    if (typeof base64 === 'string') {
      console.log(`Tamanho: ${base64.length}`);
    } else {
      console.log('Resultado não é string:', base64);
    }
  } catch (e) {
    console.log(`Erro ao imprimir: ${e instanceof Error ? e.message : String(e)}`);
  }
}

test().catch(console.error);
