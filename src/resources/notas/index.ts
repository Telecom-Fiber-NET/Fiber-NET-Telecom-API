import { fetchIxc } from "services/ixcService";

export async function imprimirNota(id: string) {
  return fetchIxc("imprimir_nota", {
    id,
    base64: "s",
  });
}
