-- ============================================================================
-- RESET DO CRM — apaga TODAS as negociações e desvincula das conversas.
-- Escopo: BANCO INTEIRO (todos os tenants). Rode no SQL Editor do Supabase.
--
-- NÃO afeta: clientes, conversas, mensagens do inbox, catálogo de produtos,
--            vendas registradas (sales/sale_items), tarefas standalone.
--
-- ⚠️  IRREVERSÍVEL. Faça um backup/snapshot antes
--     (Dashboard → Database → Backups, ou pg_dump).
-- ============================================================================

-- 1) PRÉVIA — rode isto SOZINHO primeiro para ver o tamanho do estrago.
select
  (select count(*) from public.crm_negotiations)                                   as negociacoes,
  (select count(*) from public.crm_negotiation_products)                            as produtos_negociacao,
  (select count(*) from public.crm_stage_history)                                   as historico_etapas,
  (select count(*) from public.crm_tasks where negotiation_id is not null)          as tarefas_de_negociacao,
  (select count(*) from public.crm_activities where negotiation_id is not null)     as atividades_de_negociacao,
  (select count(*) from public.whatsapp_chats where primary_negotiation_id is not null) as conversas_vinculadas,
  (select count(*) from public.entity_tags where entity_type = 'negotiation')       as tags_de_negociacao;

-- ============================================================================
-- 2) EXECUÇÃO — confira a prévia acima e, se estiver de acordo, rode o bloco abaixo.
-- ============================================================================
begin;

-- Desvincula as conversas das negociações (o FK já faz set null no delete; explícito por segurança).
update public.whatsapp_chats
set primary_negotiation_id = null
where primary_negotiation_id is not null;

-- Remove tags aplicadas a negociações (entity_tags não tem cascade para negociação).
delete from public.entity_tags
where entity_type = 'negotiation';

-- Apaga TODAS as negociações. Cascata remove automaticamente:
--   crm_negotiation_products, crm_stage_history,
--   crm_tasks (com negotiation_id), crm_activities (com negotiation_id).
delete from public.crm_negotiations;

-- Limpa funil/etapa do CRM gravados no cadastro do cliente.
update public.customers
set source_columns = source_columns - 'crm_funnel_id' - 'crm_pipeline_stage'
where source_columns ?| array['crm_funnel_id', 'crm_pipeline_stage'];

commit;

-- ============================================================================
-- 3) CONFERÊNCIA — deve retornar tudo 0.
-- ============================================================================
-- select count(*) as negociacoes_restantes from public.crm_negotiations;
-- select count(*) as conversas_ainda_vinculadas from public.whatsapp_chats where primary_negotiation_id is not null;
