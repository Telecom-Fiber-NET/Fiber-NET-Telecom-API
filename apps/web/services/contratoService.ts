// src/services/contratoService.ts
import { Contrato } from "../types/api";

export class ContratoService {
  /**
   * Mapeamento de Status do IXC para Linguagem Humana
   */
  public mapStatus(statusIxc: string) {
    const s = String(statusIxc).toUpperCase();
    const statusMap: any = {
      'A':  { label: 'Ativo', color: 'green', desc: 'Sua internet está pronta para uso.' },
      'I':  { label: 'Inativo', color: 'gray', desc: 'Este contrato não está mais vigente.' },
      'S':  { label: 'Suspenso', color: 'blue', desc: 'Contrato pausado temporariamente.' },
      'AA': { label: 'Pendente', color: 'orange', desc: 'Aguardando sua assinatura digital.' },
      'FA': { label: 'Bloqueado', color: 'red', desc: 'Acesso reduzido por pendência financeira.' },
      'B':  { label: 'Bloqueado', color: 'red', desc: 'Acesso suspenso por falta de pagamento.' }
    };
    return statusMap[s] || { label: 'Verificar', color: 'gray', desc: 'Consulte nosso suporte.' };
  }

  /**
   * Formata lista de contratos
   */
  formatarContratos(contratos: Contrato[], clienteEndereco?: string) {
    return contratos.map(c => {
      const statusInfo = this.mapStatus(c.status_internet || c.status || 'A');
      const enderecoCompleto = `${c.endereco}, ${c.numero}${c.bairro ? ` - ${c.bairro}` : ''}`;
      const isEnderecoPrincipal = clienteEndereco && enderecoCompleto.toLowerCase().includes(clienteEndereco.toLowerCase());

      return {
        ...c,
        id: c.id,
        plano: c.plano || (c as any).contrato || "Plano Connect Fiber",
        valor: parseFloat(String(c.pago_ate || "0").replace(/[^\d.-]/g, "")),
        dataAtivacao: c.data_contrato,
        enderecoCompleto,
        isEnderecoPrincipal,
        statusInfo,
        status_acesso: statusInfo.label,
        podeAssinar: c.status_internet === 'AA' || c.desbloqueio_confianca === 'S',
        cor: statusInfo.color
      };
    });
  }
}

export const contratoService = new ContratoService();
