# Runbook — Secrets & Cron da IA (produção)

Projeto Supabase: **`oaqeabqfgbeprrgqdmsk`**
Substitua os `<...>` pelos valores reais. **Não comite valores reais de segredo.**

---

## 1) Secrets das Edge Functions

> Recomendado: **Dashboard → Project Settings → Edge Functions → Secrets** (colar valores
> longos no terminal pode quebrar). O CLI funciona bem para valores curtos.

| Secret | Para quê | Necessário p/ |
|---|---|---|
| `ANTHROPIC_API_KEY` | LLM Claude (padrão) | IA responder |
| `OPENAI_API_KEY` | Transcrição de áudio (Whisper) + LLM OpenAI (opcional) | Áudio / provedor OpenAI |
| `VOYAGE_API_KEY` | Embeddings (busca na base de conhecimento) | RAG |
| `RESEND_API_KEY` | Envio de e-mail | Alertas de quota |
| `MARKETING_EMAIL_FROM` | Remetente dos e-mails: `Nome <email@dominio>` (domínio verificado no Resend) | Alertas de quota |
| `CRON_SECRET` | Autentica os crons → funções | Orquestrador + alertas |

**Ver o que já está setado:**
```bash
npx supabase secrets list --project-ref oaqeabqfgbeprrgqdmsk
```

**Setar o que faltar** (ex.: o remetente dos alertas — este estava ausente):
```bash
npx supabase secrets set MARKETING_EMAIL_FROM="WChat IA <ia@seudominio.com>" --project-ref oaqeabqfgbeprrgqdmsk
```
> `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `VOYAGE_API_KEY`, `CRON_SECRET` já devem estar
> setados (a IA está funcionando). Confirme com o `secrets list`. `RESEND_API_KEY` é usado
> pelo marketing — confirme que existe.

---

## 2) Cron de alertas de quota (SQL Editor)

Agenda a função `ai-alerts` a cada 6h. Use o **mesmo `CRON_SECRET`** do cron do orquestrador.

```sql
select cron.schedule(
  'ai-alerts-quota',
  '0 */6 * * *',
  $$
  select net.http_post(
    url := 'https://oaqeabqfgbeprrgqdmsk.supabase.co/functions/v1/ai-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', regexp_replace('<SEU_CRON_SECRET>', '\s', '', 'g')
    )
  );
  $$
);
```

> O cron do **orquestrador** (drena `ai_jobs`) e o de **retenção** (`ai-logs-retention`)
> já existem — **não recrie**. O de retenção foi agendado por migration.

**Conferir todos os crons:**
```sql
select jobid, jobname, schedule, active from cron.job order by jobname;
```

**Remover/reagendar** (se precisar ajustar):
```sql
select cron.unschedule('ai-alerts-quota');
```

---

## 3) Testes rápidos

**Disparar os alertas agora** (sem esperar 6h):
```bash
curl -X POST 'https://oaqeabqfgbeprrgqdmsk.supabase.co/functions/v1/ai-alerts' \
  -H 'x-cron-secret: <SEU_CRON_SECRET>'
```
- Esperado com tudo configurado: `{"ok":true,"sent":N}`.
- Se vier `{"ok":true,"sent":0,"note":"MARKETING_EMAIL_FROM ausente"}` → falta o secret do passo 1.
- `sent:0` sem note = ninguém cruzou 80%/100% da cota (normal).

**Smoke test ponta a ponta** (valida deny-by-default + aviso de abertura): mande uma
mensagem de WhatsApp num chat com IA ligada → deve chegar o aviso de abertura e a resposta.

---

## 4) Provisionar clientes (quando assinarem)

Pelo painel **`/admin/ia`** (após o deploy do front) ou via SQL:
```sql
-- Ativar add-on (ex.: cota 2M, sem overage = pausa ao estourar):
insert into tenant_ai_subscription (tenant_id, active, monthly_token_quota, overage_allowed)
values ('<TENANT_ID>', true, 2000000, false)
on conflict (tenant_id) do update
  set active = true, monthly_token_quota = excluded.monthly_token_quota,
      overage_allowed = excluded.overage_allowed, updated_at = now();
```
