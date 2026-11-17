-- Subcategorias (até 5 níveis), administradores e suspensão de catálogos.

-- ---------------------------------------------------------------------------
-- Subcategorias
-- ---------------------------------------------------------------------------

alter table public.categories add column parent_id uuid;

-- A categoria pai precisa ser do mesmo catálogo. Excluir o pai exclui as filhas;
-- os itens delas ficam sem categoria (FK de items).
alter table public.categories
  add constraint categories_parent_fkey
  foreign key (parent_id, catalog_id)
  references public.categories (id, catalog_id) on delete cascade;

create index categories_parent_idx on public.categories (catalog_id, parent_id, position);

create function private.enforce_category_depth()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_depth int := 1;
  v_height int;
  v_cycle boolean;
begin
  if new.parent_id is not null then
    if new.parent_id = new.id then
      raise exception 'category_cycle' using errcode = 'P0001';
    end if;
    with recursive up as (
      select c.id, c.parent_id, 1 as n
        from public.categories c where c.id = new.parent_id
      union all
      select c.id, c.parent_id, up.n + 1
        from public.categories c join up on c.id = up.parent_id
       where up.n < 10
    )
    select count(*), coalesce(bool_or(up.id = new.id), false)
      into v_depth, v_cycle from up;
    if v_cycle then
      raise exception 'category_cycle' using errcode = 'P0001';
    end if;
    v_depth := v_depth + 1;
  end if;

  -- Níveis abaixo desta categoria (0 = sem subcategorias)
  with recursive down as (
    select c.id, 1 as n from public.categories c where c.parent_id = new.id
    union all
    select c.id, down.n + 1
      from public.categories c join down on c.parent_id = down.id
     where down.n < 10
  )
  select coalesce(max(down.n), 0) into v_height from down;

  if v_depth + v_height > 5 then
    raise exception 'category_depth_limit' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger categories_enforce_depth
  before insert or update of parent_id on public.categories
  for each row execute function private.enforce_category_depth();

-- ---------------------------------------------------------------------------
-- Administradores (inseridos manualmente pelo SQL Editor)
-- ---------------------------------------------------------------------------

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create policy "admins_read_own" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

create function private.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;

grant execute on function private.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Suspensão: tira o catálogo do ar sem o dono poder desfazer
-- ---------------------------------------------------------------------------

create table public.catalog_suspensions (
  catalog_id uuid primary key references public.catalogs (id) on delete cascade,
  reason text check (char_length(reason) <= 300),
  created_at timestamptz not null default now()
);

alter table public.catalog_suspensions enable row level security;

-- O dono vê que foi suspenso; ninguém escreve pela API.
create policy "catalog_suspensions_read_owner" on public.catalog_suspensions
  for select to authenticated using (private.is_catalog_owner(catalog_id));

create or replace function private.is_catalog_published(p_catalog_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.catalogs c
    where c.id = p_catalog_id
      and c.published
      and not exists (
        select 1 from public.catalog_suspensions s where s.catalog_id = c.id
      )
  );
$$;

drop policy "catalogs_read_published" on public.catalogs;
create policy "catalogs_read_published" on public.catalogs
  for select to anon, authenticated
  using (published and private.is_catalog_published(id));

-- ---------------------------------------------------------------------------
-- Funções do painel administrativo (cada uma confere se quem chama é admin)
-- ---------------------------------------------------------------------------

create function public.admin_list_catalogs()
returns table (
  id uuid,
  slug text,
  name text,
  published boolean,
  suspended boolean,
  created_at timestamptz,
  owner_id uuid,
  owner_email text,
  plan_id text,
  plan_valid_until timestamptz,
  item_count bigint
)
language plpgsql stable security definer set search_path = ''
as $$
#variable_conflict use_column
begin
  if not private.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  return query
    select c.id, c.slug, c.name, c.published,
           exists (select 1 from public.catalog_suspensions s where s.catalog_id = c.id),
           c.created_at, c.owner_id, u.email::text,
           coalesce(ap.plan_id, 'free'), ap.valid_until,
           (select count(*) from public.items i where i.catalog_id = c.id)
      from public.catalogs c
      join auth.users u on u.id = c.owner_id
      left join public.account_plans ap
        on ap.user_id = c.owner_id
       and (ap.valid_until is null or ap.valid_until > now())
     order by c.created_at desc
     limit 500;
end;
$$;

create function public.admin_set_plan(p_owner_id uuid, p_plan_id text, p_valid_until timestamptz)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if p_plan_id = 'free' then
    delete from public.account_plans where user_id = p_owner_id;
  else
    insert into public.account_plans (user_id, plan_id, valid_until, updated_at)
    values (p_owner_id, p_plan_id, p_valid_until, now())
    on conflict (user_id) do update
      set plan_id = excluded.plan_id,
          valid_until = excluded.valid_until,
          updated_at = now();
  end if;
end;
$$;

create function public.admin_set_suspended(p_catalog_id uuid, p_suspended boolean, p_reason text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if p_suspended then
    insert into public.catalog_suspensions (catalog_id, reason)
    values (p_catalog_id, p_reason)
    on conflict (catalog_id) do update set reason = excluded.reason;
  else
    delete from public.catalog_suspensions where catalog_id = p_catalog_id;
  end if;
end;
$$;

revoke execute on function public.admin_list_catalogs() from public, anon;
revoke execute on function public.admin_set_plan(uuid, text, timestamptz) from public, anon;
revoke execute on function public.admin_set_suspended(uuid, boolean, text) from public, anon;
grant execute on function public.admin_list_catalogs() to authenticated;
grant execute on function public.admin_set_plan(uuid, text, timestamptz) to authenticated;
grant execute on function public.admin_set_suspended(uuid, boolean, text) to authenticated;
