#!/usr/bin/env python3
"""
Disparador de Potência OLT via SNMP (FiberNET) — enviado todo dia 21h.
Faz snmpwalk das tabelas .21/.43/.51, parseia, gera XLSX e envia no Telegram.
LIMITE: SNMP MA5608T so expoe ONT-0 de cada PON.
"""
import os, json, subprocess, datetime
import requests

BASE = "/root/fibernet-noc"
OLT = "100.64.200.3"
COMM = "public"
BOT = os.environ.get("TELEGRAM_BOT_TOKEN")
CHAT = "151415803"

def walk(oid, out):
    subprocess.run(["snmpwalk", "-v2c", "-c", COMM, "-t60", "-r2", OLT, oid],
                   stdout=open(out, "w"), stderr=subprocess.DEVNULL, timeout=600)

def main():
    walk("1.3.6.1.4.1.2011.6.128.1.1.2.21", f"{BASE}/t21_info.txt")
    walk("1.3.6.1.4.1.2011.6.128.1.1.2.43", f"{BASE}/t43_sn.txt")
    walk("1.3.6.1.4.1.2011.6.128.1.1.2.51", f"{BASE}/t51_opt.txt")
    subprocess.run(["/usr/bin/python3", f"{BASE}/parse_olt_snmp.py"], check=True)
    subprocess.run(["/usr/bin/python3", f"{BASE}/gerar_xlsx_snmp.py"], check=True)

    onts = json.load(open(f"{BASE}/onts_snmp.json"))
    pc = {}
    for o in onts:
        rx = o["rx_dbm"]
        c = "SEM_LEITURA" if rx is None else ("OTIMO" if rx>=-22 else "BOM" if rx>=-25 else "RUIM" if rx>=-27 else "CRITICO")
        pc[c] = pc.get(c,0)+1
    xlsx = f"{BASE}/potencia_olt_snmp_{datetime.date.today().isoformat()}.xlsx"
    cap = (f"📡 Potência OLT (SNMP) — {datetime.date.today().isoformat()}\n"
           f"Total: {len(onts)} ONTs (ONT-0 por PON)\n"
           f"🔴 Crítico: {pc.get('CRITICO',0)} | 🟡 Ruim: {pc.get('RUIM',0)} | "
           f"🟢 Bom: {pc.get('BOM',0)} | ✅ Ótimo: {pc.get('OTIMO',0)} | ⚫ Sem leitura: {pc.get('SEM_LEITURA',0)}\n"
           f"Limitação: SNMP MA5608T expõe só ONT-0 de cada PON; todas as ONTs no relatório IXC.")
    r = requests.post(f"https://api.telegram.org/bot{BOT}/sendDocument",
                      data={"chat_id": CHAT, "caption": cap},
                      files={"document": open(xlsx, "rb")}, timeout=90)
    print("Enviado:", r.json().get("ok"))

if __name__ == "__main__":
    main()
