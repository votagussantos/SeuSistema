-- SeuSistema: schema inicial
-- Catálogos, categorias, itens (produtos e serviços), fotos, variações,
-- planos (freemium) e storage. Toda tabela tem RLS.

create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Planos
-- ---------------------------------------------------------------------------

create table public.plans (
  id text primary key,
  name text not null,
  max_catalogs int not null check (max_catalogs > 0),
  max_items int not null check (max_items > 0),
  max_images_per_item int not null check (max_images_per_item > 0),
  show_badge boolean not null default true
);

insert into public.plans (id, name, max_catalogs, max_items, max_images_per_item, show_badge) values
  ('free', 'Grátis', 1, 30, 3, true),
  ('pro', 'Pro', 3, 300, 8, false);

-- Plano contratado por conta. Sem linha (ou vencido) = plano grátis.
-- Só service_role escreve aqui (ativação manual por enquanto).
create table public.account_plans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan_id text not null references public.plans (id),
  valid_until timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catálogos
-- ---------------------------------------------------------------------------

create type public.catalog_layout as enum ('grade', 'lista', 'destaque');
create type public.item_type as enum ('product', 'service');

create table public.catalogs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slug text not null unique,
  name text not null check (char_length(name) between 1 and 80),
  description text check (char_length(description) <= 500),
  logo_path text check (char_length(logo_path) <= 300),
  cover_path text check (char_length(cover_path) <= 300),
  layout public.catalog_layout not null default 'grade',
  color_primary text not null default '#111827' check (color_primary ~ '^#[0-9a-fA-F]{6}$'),
  color_background text not null default '#ffffff' check (color_background ~ '^#[0-9a-fA-F]{6}$'),
  color_text text not null default '#111827' check (color_text ~ '^#[0-9a-fA-F]{6}$'),
  -- Somente dígitos, com DDI. Ex.: 5511999998888
  whatsapp text check (whatsapp ~ '^[0-9]{10,15}$'),
  -- Usuário do Instagram sem @ (o link é montado pelo sistema)
  instagram text check (instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  contact_email text check (char_length(contact_email) <= 254),
  address text check (char_length(address) <= 200),
  city text check (char_length(city) <= 80),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalogs_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  constraint catalogs_slug_not_reserved check (slug not in (
    'painel', 'entrar', 'sair', 'auth', 'api', 'admin', 'login', 'cadastro',
    'conta', 'planos', 'precos', 'ajuda', 'suporte', 'termos', 'privacidade',
    'sobre', 'contato', 'blog', 'app', 'www', 'static', 'assets', 'public',
    '_next', 'favicon', 'robots', 'sitemap', 'seusistema'
  ))
);

create index catalogs_owner_id_idx on public.catalogs (owner_id);

-- ---------------------------------------------------------------------------
-- Categorias
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (id, catalog_id)
);

create index categories_catalog_id_idx on public.categories (catalog_id, position);

-- ---------------------------------------------------------------------------
-- Itens (produtos e serviços)
-- ---------------------------------------------------------------------------

create table public.items (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.catalogs (id) on delete cascade,
  category_id uuid,
  type public.item_type not null default 'product',
  name text not null check (char_length(name) between 1 and 120),
  description text check (char_length(description) <= 2000),
  -- Valores em centavos
  price_cents int check (price_cents >= 0),
  promo_price_cents int check (promo_price_cents >= 0),
  price_is_from boolean not null default false,     -- "a partir de"
  price_on_request boolean not null default false,  -- "sob consulta"
  duration_minutes int check (duration_minutes > 0), -- só serviços
  available boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, catalog_id),
  -- A categoria precisa ser do mesmo catálogo
  foreign key (category_id, catalog_id)
    references public.categories (id, catalog_id) on delete set null (category_id),
  constraint items_price_or_on_request check (price_on_request or price_cents is not null),
  constraint items_promo_below_price check (
    promo_price_cents is null or (price_cents is not null and promo_price_cents < price_cents)
  )
);

create index items_catalog_id_idx on public.items (catalog_id, position);
create index items_category_id_idx on public.items (category_id);

create table public.item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null,
  catalog_id uuid not null,
  path text not null check (char_length(path) <= 300),
  position int not null default 0,
  created_at timestamptz not null default now(),
  foreign key (item_id, catalog_id)
    references public.items (id, catalog_id) on delete cascade
);

create index item_images_item_id_idx on public.item_images (item_id, position);
create index item_images_catalog_id_idx on public.item_images (catalog_id);

-- Variações: group_name = "Tamanho", label = "M". Preço opcional substitui o do item.
create table public.item_variations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null,
  catalog_id uuid not null,
  group_name text not null check (char_length(group_name) between 1 and 40),
  label text not null check (char_length(label) between 1 and 60),
  price_cents int check (price_cents >= 0),
  available boolean not null default true,
  position int not null default 0,
  foreign key (item_id, catalog_id)
    references public.items (id, catalog_id) on delete cascade
);

create index item_variations_item_id_idx on public.item_variations (item_id, position);
create index item_variations_catalog_id_idx on public.item_variations (catalog_id);

-- ---------------------------------------------------------------------------
-- Funções auxiliares (schema private: não expostas pela API)
-- ---------------------------------------------------------------------------

create function private.is_catalog_owner(p_catalog_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.catalogs c
    where c.id = p_catalog_id and c.owner_id = (select auth.uid())
  );
$$;

create function private.is_catalog_published(p_catalog_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.catalogs c
    where c.id = p_catalog_id and c.published
  );
$$;

create function private.plan_of(p_user_id uuid)
returns public.plans
language sql stable security definer set search_path = ''
as $$
  select p.*
  from public.plans p
  where p.id = coalesce(
    (select ap.plan_id from public.account_plans ap
      where ap.user_id = p_user_id
        and (ap.valid_until is null or ap.valid_until > now())),
    'free'
  );
$$;

grant execute on function private.is_catalog_owner(uuid) to anon, authenticated;
grant execute on function private.is_catalog_published(uuid) to anon, authenticated;
revoke execute on function private.plan_of(uuid) from public;

-- ---------------------------------------------------------------------------
-- Triggers: updated_at e limites de plano
-- ---------------------------------------------------------------------------

create function private.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger catalogs_set_updated_at before update on public.catalogs
  for each row execute function private.set_updated_at();
create trigger items_set_updated_at before update on public.items
  for each row execute function private.set_updated_at();

create function private.enforce_catalog_limit()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_max int;
  v_count int;
begin
  -- Serializa criações do mesmo dono para a contagem não sofrer corrida
  perform pg_advisory_xact_lock(hashtextextended(new.owner_id::text, 0));
  select (private.plan_of(new.owner_id)).max_catalogs into v_max;
  select count(*) into v_count from public.catalogs where owner_id = new.owner_id;
  if v_count >= v_max then
    raise exception 'plan_limit_catalogs' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger catalogs_enforce_limit before insert on public.catalogs
  for each row execute function private.enforce_catalog_limit();

create function private.enforce_item_limit()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_owner uuid;
  v_max int;
  v_count int;
begin
  select owner_id into v_owner from public.catalogs where id = new.catalog_id for update;
  select (private.plan_of(v_owner)).max_items into v_max;
  select count(*) into v_count from public.items where catalog_id = new.catalog_id;
  if v_count >= v_max then
    raise exception 'plan_limit_items' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger items_enforce_limit before insert on public.items
  for each row execute function private.enforce_item_limit();

create function private.enforce_image_limit()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_owner uuid;
  v_max int;
  v_count int;
begin
  perform 1 from public.items where id = new.item_id for update;
  select owner_id into v_owner from public.catalogs where id = new.catalog_id;
  select (private.plan_of(v_owner)).max_images_per_item into v_max;
  select count(*) into v_count from public.item_images where item_id = new.item_id;
  if v_count >= v_max then
    raise exception 'plan_limit_images' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger item_images_enforce_limit before insert on public.item_images
  for each row execute function private.enforce_image_limit();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.plans enable row level security;
alter table public.account_plans enable row level security;
alter table public.catalogs enable row level security;
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.item_images enable row level security;
alter table public.item_variations enable row level security;

-- plans: leitura pública, sem escrita
create policy "plans_read" on public.plans
  for select to anon, authenticated using (true);

-- account_plans: cada um lê o seu, sem escrita
create policy "account_plans_read_own" on public.account_plans
  for select to authenticated using (user_id = (select auth.uid()));

-- catalogs
create policy "catalogs_read_published" on public.catalogs
  for select to anon, authenticated using (published);
create policy "catalogs_read_own" on public.catalogs
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "catalogs_insert_own" on public.catalogs
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "catalogs_update_own" on public.catalogs
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "catalogs_delete_own" on public.catalogs
  for delete to authenticated using (owner_id = (select auth.uid()));

-- Tabelas filhas: público lê se o catálogo está publicado; dono faz tudo
create policy "categories_read_published" on public.categories
  for select to anon, authenticated using (private.is_catalog_published(catalog_id));
create policy "categories_owner_all" on public.categories
  for all to authenticated
  using (private.is_catalog_owner(catalog_id))
  with check (private.is_catalog_owner(catalog_id));

create policy "items_read_published" on public.items
  for select to anon, authenticated using (private.is_catalog_published(catalog_id));
create policy "items_owner_all" on public.items
  for all to authenticated
  using (private.is_catalog_owner(catalog_id))
  with check (private.is_catalog_owner(catalog_id));

create policy "item_images_read_published" on public.item_images
  for select to anon, authenticated using (private.is_catalog_published(catalog_id));
create policy "item_images_owner_all" on public.item_images
  for all to authenticated
  using (private.is_catalog_owner(catalog_id))
  with check (private.is_catalog_owner(catalog_id));

create policy "item_variations_read_published" on public.item_variations
  for select to anon, authenticated using (private.is_catalog_published(catalog_id));
create policy "item_variations_owner_all" on public.item_variations
  for all to authenticated
  using (private.is_catalog_owner(catalog_id))
  with check (private.is_catalog_owner(catalog_id));

-- ---------------------------------------------------------------------------
-- Storage: bucket público de imagens, escrita só do dono em {catalog_id}/...
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog-media', 'catalog-media', true, 1048576, array['image/webp', 'image/jpeg', 'image/png']);

create function private.owns_media_path(p_name text)
returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_folder text := split_part(p_name, '/', 1);
begin
  if v_folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return private.is_catalog_owner(v_folder::uuid);
end;
$$;

grant execute on function private.owns_media_path(text) to authenticated;

create policy "catalog_media_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'catalog-media' and private.owns_media_path(name));
create policy "catalog_media_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'catalog-media' and private.owns_media_path(name))
  with check (bucket_id = 'catalog-media' and private.owns_media_path(name));
create policy "catalog_media_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'catalog-media' and private.owns_media_path(name));
