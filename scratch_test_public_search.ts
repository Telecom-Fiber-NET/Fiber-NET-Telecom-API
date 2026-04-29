import { ixcService } from "./src/services/ixcService";
// @ts-ignore
import { buscarBoletosPorCpf } from "./src/api/controllers/boletoController";

async function test() {
  const req = {
    body: {
      cpfCnpj: "00622450000116"
    }
  };
  const res = {
    json: (data: any) => {
      console.log(`\nResultados da Busca Pública:`);
      console.log(`Boletos encontrados: ${data.boletos?.length || 0}`);
      data.boletos?.forEach((b: any) => {
        console.log(`  ID: ${b.id} - Status: ${b.status} - Vencimento: ${b.data_vencimento} - Valor: ${b.valor}`);
      });
      return res;
    },
    status: (code: number) => {
      console.log(`Status Code: ${code}`);
      return res;
    }
  };

  // @ts-ignore
  await buscarBoletosPorCpf(req, res);
}

test().catch(console.error);
