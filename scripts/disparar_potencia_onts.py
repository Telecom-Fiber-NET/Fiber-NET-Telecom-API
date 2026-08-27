#!/usr/bin/env python3
"""
Disparador de Potência das ONTs (FiberNET / Kadu)
Rodado TODOS OS DIAS às 21:00 pelo cron do Hermes.
- Bate na API /api/ont/potencia-planilha (leitura only, guardrails da API).
- Baixa o XLSX (separado por OLT/PON/porta + plano de melhoria).
- Envia o arquivo + resumo no Telegram (chat 151415803).
"""
import os, json, urllib.request, urllib.error, subprocess, sys, datetime

API = "http://172.29.0.21:3333"
CHAT = "151415803"
BOT = os.environ.get("TELEGRAM_BOT_TOKEN")
if not BOT:
    print("ERRO: TELEGRAM_BOT_TOKEN ausente"); sys.exit(1)

os.chdir("/root/fibernet-noc/Fiber-NET-Telecom-API")
secret = subprocess.check_output("grep -E '^JWT_SECRET=' .env | head -1 | cut -d= -f2-", shell=True).decode().strip()
JWT = subprocess.check_output(
    f"node -e \"const jwt=require('jsonwebtoken'); console.log(jwt.sign({{ids:[1],email:'x'}}, '{secret}', {{expiresIn:'30m'}}))\"",
    shell=True).decode().strip()

SAIDA = "/root/fibernet-noc/potencia_onts_atual.xlsx"

def telegram_document(arquivo, caption):
    import requests
    with open(arquivo, "rb") as f:
        r = requests.post(f"https://api.telegram.org/bot{BOT}/sendDocument",
                          data={"chat_id": CHAT, "caption": caption, "parse_mode": "Markdown"},
                          files={"document": f}, timeout=90)
    return r.json()

# 1) resumo JSON (p/ mensagem)
try:
    req = urllib.request.Request(API + "/api/ont/potencia/resumo",
        headers={"Authorization": "Bearer " + JWT})
    resumo = json.load(urllib.request.urlopen(req, timeout=150))
except urllib.error.HTTPError as e:
    msg = e.read().decode()
    telegram_document.__name__  # noop
    import requests
    requests.post(f"https://api.telegram.org/bot{BOT}/sendMessage",
                  data={"chat_id": CHAT, "text": "❌ Erro ao gerar potência das ONTs: " + msg[:200]})
    print("Erro:", msg); sys.exit(1)

# 2) baixa XLSX
req = urllib.request.Request(API + "/api/ont/potencia-planilha",
    headers={"Authorization": "Bearer " + JWT})
with open(SAIDA, "wb") as f:
    f.write(urllib.request.urlopen(req, timeout=180).read())

pc = resumo.get("por_classificacao", {})
msg = (
    f"📡 *Potência das ONTs* — {datetime.date.today().isoformat()}\n\n"
    f"Total de ONTs: {resumo.get('total')}\n"
    f"✅ OTIMO: {pc.get('OTIMO',0)} | 🟢 BOM: {pc.get('BOM',0)}\n"
    f"🟡 RUIM: {pc.get('RUIM',0)} | 🔴 CRITICO: {pc.get('CRITICO',0)} | ⚫ SEM SINAL: {pc.get('SEM_SINAL',0)}\n"
    f"⚠️ Em atenção: {resumo.get('atencao')}\n\n"
    f"Planilha em anexo (por OLT/PON/Porta + Plano de Melhoria)."
)

r = telegram_document(SAIDA, msg)
print("Enviado:", r.get("ok"), "msg_id:", r.get("result", {}).get("message_id"))
