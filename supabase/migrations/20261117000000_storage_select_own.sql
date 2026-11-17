-- O Storage precisa de SELECT para o dono conseguir substituir e apagar
-- os próprios arquivos (a leitura pública continua vindo do bucket público).
create policy "catalog_media_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'catalog-media' and private.owns_media_path(name));
