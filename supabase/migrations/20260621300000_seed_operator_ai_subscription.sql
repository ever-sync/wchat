-- Provisiona o add-on de IA para o tenant do operador (interno/testes/demos).
-- Necessário com deny-by-default: sem assinatura ativa, a IA não roda. Idempotente.
-- overage_allowed = true: nunca pausa (uso interno). Ajuste/relacione clientes via /admin/ia.

insert into public.tenant_ai_subscription (tenant_id, active, monthly_token_quota, overage_allowed, notes)
select tenant_id, true, 10000000, true, 'operador (provisionado no lançamento)'
from public.profiles
where lower(email) = 'app@eversync.space' and tenant_id is not null
group by tenant_id
on conflict (tenant_id) do update set active = true, updated_at = now();
