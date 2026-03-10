
import { ixcService } from "./ixcService";

export class ConexaoService {
  /**
   * Realiza diagnóstico em tempo real do sinal e conexão
   */
  async realizarDiagnostico(idLogin: number) {
    const diagnostico = await ixcService.getDiagnosticoLogin(idLogin);
    
    // Tradução técnica para o cliente
    let mensagemSinal = "Sinal dentro do padrão.";
    const sinalDb = parseFloat(diagnostico.sinal || "0");

    if (sinalDb < -27) {
      mensagemSinal = "Sinal fraco detectado. Sugerimos verificar o cabo de fibra.";
    } else if (sinalDb === 0) {
      mensagemSinal = "Equipamento offline. Verifique se o roteador está ligado.";
    }

    return {
      ...diagnostico,
      analise: mensagemSinal,
      isOk: sinalDb !== 0 && sinalDb >= -27
    };
  }

  /**
   * Limpa o MAC Address do login para troca de roteador
   */
  async resetarVinculoMac(idLogin: number) {
    return await ixcService.limparMacLogin(idLogin);
  }

  /**
   * Altera os dados de Wi-Fi do roteador (SSID/Senha)
   */
  async atualizarWifi(idLogin: number, ssid: string, senha: string) {
    return await ixcService.alterarWifi(idLogin, ssid, senha);
  }

  /**
   * Envia comando de desconexão (Derrubar sinal para reiniciar)
   */
  async reiniciarConexao(idLogin: number) {
    return await ixcService.desconectarLogin(idLogin);
  }
}

export const conexaoService = new ConexaoService();
