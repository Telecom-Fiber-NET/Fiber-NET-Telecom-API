import { listarVendasPorCliente } from "resources/pedidos";

import { imprimirNota } from "resources/notas";

export async function buscarNotasPorCliente(id_cliente: string) {
  const vendas = await listarVendasPorCliente(id_cliente);

  const ids = vendas.map((v: any) => v.id);

  const notas = [];

  for (const id of ids) {
    const nota = await imprimirNota(id);
    notas.push({
      id,
      nota,
    });
  }
  return notas;
}
