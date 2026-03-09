
import { ixcService } from "./ixcService";

export interface ContratoFormatado {
  id: number;
  plano: string;
  valor: number;
  dataAtivacao: string;
  enderecoCompleto: string;
  status: {
    label: string;
    color: string;
    desc: string;
  };
  podeAssinar: boolean;
  assinatura_digital: string;
  status_internet: string;
  pdfLink: string;
}

export class ContratoService {
  /**
   * Mapeamento de Status do IXC para Linguagem Humana
   */
  private mapStatus(statusIxc: string) {
    const statusMap: any = {
      'A':  { label: 'Ativo', color: 'green', desc: 'Sua internet está pronta para uso.' },
      'I':  { label: 'Inativo', color: 'gray', desc: 'Este contrato não está mais vigente.' },
      'S':  { label: 'Suspenso', color: 'blue', desc: 'Contrato pausado temporariamente.' },
      'AA': { label: 'Pendente', color: 'orange', desc: 'Aguardando sua assinatura digital.' },
      'FA': { label: 'Bloqueado', color: 'red', desc: 'Acesso reduzido por pendência financeira.' },
      'CA': { label: 'Bloqueado', color: 'red', desc: 'Acesso reduzido automaticamente.' },
      'CM': { label: 'Bloqueado', color: 'red', desc: 'Acesso reduzido manualmente.' }
    };
    return statusMap[statusIxc] || { label: 'Em Análise', color: 'gray', desc: 'Consulte nosso suporte.' };
  }

  /**
   * Realiza a suspensão temporária do contrato (ex: viagem)
   */
  async suspenderContrato(idContrato: number, dataRetomada: string) {
    return await ixcService.suspenderContrato(idContrato, dataRetomada);
  }

  /**
   * Assina digitalmente o contrato principal
   */
  async assinarContrato(idContrato: number, ip: string) {
    return await ixcService.assinarContratoDigital(idContrato, ip);
  }

  /**
   * Assina um termo aditivo específico
   */
  async assinarTermo(idTermo: number, ip: string) {
    return await ixcService.assinarTermo(idTermo, ip);
  }

  /**
   * Processa os contratos vindos do IXC
   */
  async listarFormatados(idCliente: number): Promise<ContratoFormatado[]> {
    const contratos = await ixcService.buscarContratosDetalhados(idCliente);
    
    return contratos.map(c => {
      // Garante que não apareça "undefined" na tela caso os campos estejam vazios
      const rua = c.endereco || "";
      const num = c.numero || "";
      const bairro = c.bairro || "";
      
      let enderecoCompleto = `${rua}, ${num}`;
      if (bairro) enderecoCompleto += ` - ${bairro}`;
      
      // Se ainda estiver vazio (ex: ", "), tenta um fallback genérico ou limpa
      if (enderecoCompleto === ", " || !rua) {
        enderecoCompleto = "Endereço não informado";
      }

      return {
        id: parseInt(String(c.id)),
        plano: c.descricao_aux_plano_venda || c.contrato || "Plano de Internet",
        valor: parseFloat(c.valor_contrato || "0"),
        dataAtivacao: c.data_ativacao || "",
        enderecoCompleto: enderecoCompleto,
        status: this.mapStatus(c.status_internet || c.status),
        podeAssinar: (c.status_internet === 'AA' || c.assinatura_digital !== 'S'),
        assinatura_digital: c.assinatura_digital || 'N',
        status_internet: c.status_internet || 'A',
        pdfLink: `/api/contratos/${c.id}/pdf`
      };
    });
  }
}

export const contratoService = new ContratoService();
