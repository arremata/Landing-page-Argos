-- Origem de cada inscrição na lista de espera (de qual anúncio, grupo ou
-- artigo a pessoa veio). Rodar UMA vez no SQL Editor do Supabase, no mesmo
-- projeto de supabase/waitlist.sql, antes ou logo depois do deploy.
-- Sem estas colunas o /api/waitlist continua gravando, só que sem a origem.

alter table public.waitlist
  add column if not exists utm_source   text check (char_length(utm_source)   <= 200),
  add column if not exists utm_medium   text check (char_length(utm_medium)   <= 200),
  add column if not exists utm_campaign text check (char_length(utm_campaign) <= 200),
  add column if not exists utm_content  text check (char_length(utm_content)  <= 200),
  add column if not exists landing_page text check (char_length(landing_page) <= 300),
  add column if not exists referrer     text check (char_length(referrer)     <= 200);

-- Inscrições por origem, para o relatório semanal:
-- select coalesce(utm_source, '(sem origem)') as origem,
--        coalesce(utm_content, '') as peca,
--        count(*) as inscricoes
--   from public.waitlist
--  where created_at >= now() - interval '7 days'
--  group by 1, 2
--  order by 3 desc;
