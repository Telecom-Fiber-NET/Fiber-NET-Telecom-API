#!/usr/bin/env python3
"""
Disparador do Relatório Semanal (FiberNET / Kadu)
Rodado toda SEGUNDA às 07:00 pelo cron do Hermes.
- Bate na API /api/relatorios/semanal (SEM forcar => respeita guardrails de horário).
- Baixa o XLSX multi-aba.
- Envia o arquivo + resumo no Telegram (chat 151415803).
Se o guardrails bloquear (fora do horário), avisa no Telegram em vez de falhar silenciosamente.
"""
import os, json, urllib.request, urllib.error, subprocess, sys, datetime

API = "http://172.29.0.21:3333"
CHAT = "151415803"
BOT = os.environ.get("TELEGRAM_BOT_TOKEN")
if not BOT:
    print("ERRO: TELEGRAM_BOT_TOKEN ausente"); sys.exit(1)

# JWT
os.chdir("/root/fibernet-noc/Fiber-NET-Telecom-API")
secret = subprocess.check_output("grep -E '^JWT_SECRET=' .env | head -1 | cut -d= -f2-", shell=True).decode().strip()
JWT = subprocess.check_output(
    f"node -e \"const jwt=require('jsonwebtoken'); console.log(jwt.sign({{ids:[1],email:'x'}}, '{secret}', {{expiresIn:'30m'}}))\"",
    shell=True).decode().strip()

FORCAR = os.environ.get("FORCAR") == "1"  # so p/ teste manual (o cron NUNCA usa)

SAIDA = "/root/fibernet-noc/relatorio_semanal_atual.xlsx"

def telegram(metodo, data=None, arquivo=None):
    url = f"https://api.telegram.org/bot{BOT}/{metodo}"
    if arquivo:
        import requests
        with open(arquivo, "rb") as f:
            r = requests.post(url, data={"chat_id": CHAT}, files={metodo.replace("send","document") if False else "document": f})
        return r.json()
    req = urllib.request.Request(url, data=urllib.parse.urlencode(data).encode(),
                                 headers={"Content-Type": "application/x-www-form-urlencoded"})
    return json.load(urllib.request.urlopen(req, timeout=30))

import urllib.parse

# 1) resumo JSON (p/ mensagem)
try:
    req = urllib.request.Request(API + "/api/relatorios/semanal/resumo" + ("?forcar=1" if FORCAR else ""),
        headers={"Authorization": "Bearer " + JWT})
    resumo = json.load(urllib.request.urlopen(req, timeout=90))
except urllib.error.HTTPError as e:
    msg = e.read().decode()
    if "guardrails" in msg:
        telegram("sendMessage", {"chat_id": CHAT, "text": "⚠️ Relatório semanal NÃO gerado: fora do horário permitido (só seg 07h). " + msg})
        print("Bloqueado por guardrails:", msg); sys.exit(0)
    else:
        telegram("sendMessage", {"chat_id": CHAT, "text": "❌ Erro ao gerar relatório: " + msg[:200]})
        print("Erro:", msg); sys.exit(1)

# 2) baixa XLSX
req = urllib.request.Request(API + "/api/relatorios/semanal" + ("?forcar=1" if FORCAR else ""),
    headers={"Authorization": "Bearer " + JWT})
with open(SAIDA, "wb") as f:
    f.write(urllib.request.urlopen(req, timeout=120).read())

# 3) monta mensagem resumo
b = resumo.get("entrada_bancaria", {})
p = resumo.get("periodo", {})
var = b.get("variacao_percentual")
var_txt = f"{var}%" if var is not None else "INVÁLIDO (janelas diferentes)"
msg = (
    f"📊 *Relatório Semanal* ({p.get('inicio')} a {p.get('fim')})\n\n"
    f"❌ Cancelamentos: {resumo.get('cancelamentos')}\n"
    f"✅ Ativações: {resumo.get('ativacoes')}\n"
    f"🔧 Ordens de Serviço: {resumo.get('ordens_servico')}\n"
    f"💰 Entrada Bancária: {b.get('registros')} regs | R$ {b.get('valor'):.2f}\n"
    f"   Semana ant: R$ {b.get('valor_semana_anterior'):.2f} | Variação: {var_txt}\n"
    f"🔒 Bloqueados no mês: {resumo.get('bloqueados_mes')}\n\n"
    f"Planilha completa em anexo (5 abas)."
)

# 4) envia arquivo + mensagem
import requests
with open(SAIDA, "rb") as f:
    requests.post(f"https://api.telegram.org/bot{BOT}/sendDocument",
                  data={"chat_id": CHAT, "caption": msg, "parse_mode": "Markdown"},
                  files={"document": f})
print("Relatório enviado no Telegram:", SAIDA)
