import { fetchIxc } from "services/ixcService";

export async function listarVendasPorCliente(id_cliente: string) {
  return fetchIxc("vd_saida", {
    qtype: "id_cliente",
    query: id_cliente,
    oper: "=",
    page: "1",
    rp: "20",
    sortname: "vd_saida.id",
    sortorder: "desc",
  });
}
