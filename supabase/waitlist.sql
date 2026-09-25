-- Lista de espera da landing page. Rodar uma vez no SQL Editor do Supabase
-- (o mesmo projeto usado pela plataforma, repositório arremata/leilao-br).
--
-- Quem escreve é só a função /api/waitlist da Vercel, com a secret key
-- (service_role), que ignora RLS. O RLS fica ligado e sem nenhuma policy
-- para a chave pública (anon) não conseguir ler nem gravar cadastros.

create table if not exists public.waitlist (
  id          bigint generated always as identity primary key,
  full_name   text        not null check (char_length(full_name) between 3 and 200),
  phone       text        not null check (char_length(phone) <= 20),
  email       text        not null check (email = lower(email) and char_length(email) <= 320),
  source      text        not null check (source in ('morar', 'investir')),
  created_at  timestamptz not null default now(),
  constraint waitlist_email_key unique (email)
);

alter table public.waitlist enable row level security;

revoke all on public.waitlist from anon, authenticated;
