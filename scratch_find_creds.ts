import { ixcService } from "./src/services/ixcService";

async function test() {
  const ids = [4162, 4007];
  for (const id of ids) {
    const cliente = await ixcService.buscarClientePorId(id);
    console.log(`Cliente ID: ${id} - Email: ${cliente?.email || cliente?.hotsite_email} - Senha: ${cliente?.senha}`);
  }
}

test().catch(console.error);
