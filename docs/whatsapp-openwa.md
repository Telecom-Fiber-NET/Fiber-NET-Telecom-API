# WhatsApp OpenWA

## Variaveis

- `OPENWA_URL`
- `OPENWA_API_KEY`
- `OPENWA_SESSION`
- `OPENWA_WEBHOOK_SECRET`

## Endpoints

- `POST /api/whatsapp/webhook`
- `GET /api/whatsapp/status`
- `POST /api/whatsapp/send`

O webhook valida `x-openwa-secret` ou `x-webhook-secret` quando `OPENWA_WEBHOOK_SECRET` estiver definido.

Mensagens duplicadas sao ignoradas por `id` ou `messageId`. Mensagens de grupo, do proprio bot, sem telefone ou sem texto tambem sao ignoradas.
