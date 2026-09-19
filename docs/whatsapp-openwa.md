# WhatsApp OpenWA

## Variaveis

- `OPENWA_URL`: URL base do OpenWA, por exemplo `http://localhost:2785`
- `OPENWA_API_KEY`: chave enviada no header `X-API-Key`
- `OPENWA_SESSION`: ID/UUID da sessao OpenWA usada nas rotas `/api/sessions/:sessionId`
- `OPENWA_WEBHOOK_SECRET`: segredo HMAC registrado no webhook

## Endpoints

- `POST /api/whatsapp/webhook`
- `GET /api/whatsapp/status`
- `POST /api/whatsapp/send`

O webhook valida `X-OpenWA-Signature` (`sha256=<hex>`) quando `OPENWA_WEBHOOK_SECRET` estiver definido. Para compatibilidade operacional, tambem aceita `x-openwa-secret` ou `x-webhook-secret`.

Mensagens duplicadas sao ignoradas por `id` ou `messageId`. Mensagens de grupo, do proprio bot, sem telefone ou sem texto tambem sao ignoradas.

## Configuracao no OpenWA

Registre o webhook no OpenWA apontando para:

```bash
POST /api/sessions/:sessionId/webhooks
```

Com eventos:

```json
["message.received", "session.status"]
```

O envio de resposta usa:

```bash
POST /api/sessions/:sessionId/messages/send-text
```

Payload:

```json
{
  "chatId": "5524999999999@c.us",
  "text": "Mensagem"
}
```
