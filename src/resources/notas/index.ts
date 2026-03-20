import { ixcService } from "services/ixcService";
import { base64 } from "zod";

export async function imprimirNota(id: string) {
  return ixcService.post("imprimir_nota", {
    id,
    base64: "s",
  });
}
