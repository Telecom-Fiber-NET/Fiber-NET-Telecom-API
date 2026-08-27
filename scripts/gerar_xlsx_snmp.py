#!/usr/bin/env python3
"""Gera XLSX de potência OLT via SNMP (ONT-0 de cada PON) + plano de melhoria."""
import json, os
from datetime import date
from openpyxl import Workbook

BASE = "/root/fibernet-noc"
onts = json.load(open(f"{BASE}/onts_snmp.json"))

def classificar(rx):
    if rx is None:
        return "SEM_LEITURA", "ONT sem leitura (offline/nao exposta). Verificar no IXC/OLT."
    if rx >= -22: return "OTIMO", "Sinal ideal. Nenhuma acao."
    if rx >= -25: return "BOM", "Aceitavel. Monitorar."
    if rx >= -27: return "RUIM", "Limite inferior. Visita tecnica: limpar conector, ver emenda."
    return "CRITICO", "Critico (< -27 dBm). Realocar PON, trocar jumper, ver splitter."

wb = Workbook()
ws = wb.active
ws.title = "OLT_Potencia_SNMP"
ws.append(["OLT", "PON (slot/port)", "Porta_PON", "ONT", "Serial", "RX (dBm)", "TX (dBm)", "Temp (C)", "Classificacao", "Plano de Melhoria"])

por_classe = {}
for o in sorted(onts, key=lambda x: (x["slot"], x["pon_num"])):
    cl, plan = classificar(o["rx_dbm"])
    por_classe[cl] = por_classe.get(cl, 0) + 1
    ws.append([
        "100.64.200.3", str(o["pon"]), o["pon_num"], o["ont"], str(o["serial"]),
        o["rx_dbm"], o["tx_dbm"], o["temp_c"], cl, plan,
    ])

ws2 = wb.create_sheet("Resumo")
ws2.append(["Total ONTs (ONT-0 por PON via SNMP)", len(onts)])
ws2.append(["Nota", "SNMP MA5608T expoe so a ONT 0 de cada PON (32 de 32 PONs). Todas as ONTs: usar IXC."])
for c, q in sorted(por_classe.items()):
    ws2.append([c, q])

out = f"{BASE}/potencia_olt_snmp_{date.today().isoformat()}.xlsx"
wb.save(out)
print(f"Planilha: {out}")
print("Por classe:", por_classe)
