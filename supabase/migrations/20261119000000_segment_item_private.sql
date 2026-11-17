-- Segmento do negócio (onboarding) e dados internos do item.

alter table public.catalogs
  add column segment text check (segment ~ '^[a-z]{2,30}$');

-- Custo, estoque e curva ABC ficam fora de `items` porque `items` é legível pelo
-- público nos catálogos publicados. Aqui, só o dono lê e escreve.
create table public.item_private (
  item_id uuid primary key,
  catalog_id uuid not null,
  cost_cents int check (cost_cents >= 0),
  stock_quantity int check (stock_quantity >= 0),
  stock_min int check (stock_min >= 0),
  abc_class text check (abc_class in ('A', 'B', 'C')),
  updated_at timestamptz not null default now(),
  foreign key (item_id, catalog_id)
    references public.items (id, catalog_id) on delete cascade
);

create index item_private_catalog_id_idx on public.item_private (catalog_id);

alter table public.item_private enable row level security;

create policy "item_private_owner_all" on public.item_private
  for all to authenticated
  using (private.is_catalog_owner(catalog_id))
  with check (private.is_catalog_owner(catalog_id));

create trigger item_private_set_updated_at before update on public.item_private
  for each row execute function private.set_updated_at();
