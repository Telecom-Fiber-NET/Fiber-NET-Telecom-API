# Reativacao

## Endpoints

- `GET /api/reativacao/bloqueados`
- `GET /api/reativacao/:customerId`
- `POST /api/reativacao/registrar`

## Regras

- Menos de 7 dias: priorizar regularizacao rapida.
- De 7 a 15 dias: abordagem neutra de regularizacao.
- Mais de 15 dias: encaminhar possibilidade de negociacao quando disponivel.

Estados de funil: `BLOCKED`, `CONTACT_PENDING`, `CONTACTED`, `WAITING_CUSTOMER`, `PAYMENT_PENDING`, `PAYMENT_CONFIRMED`, `REACTIVATION_PENDING`, `REACTIVATED`, `HUMAN_ATTENDANCE`, `NO_RESPONSE`, `CANCELLED`.
