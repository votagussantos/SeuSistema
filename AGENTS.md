# SeuSistema

Gerador de catálogos online whitelabel para pequenos vendedores de produtos e
prestadores de serviço que não podem pagar por um site. O dono monta o catálogo
num painel; o visitante monta uma sacola e envia o pedido pronto pelo WhatsApp.
Não há pagamento nem checkout dentro do sistema.

Princípios: simples primeiro, custo perto de zero, segurança e performance acima
de funcionalidade. Não adicione dependência, serviço ou abstração sem necessidade
real do momento.

## Decisões de produto (já tomadas)

- **Endereço**: `dominio.com/{slug}`. Subdomínio e domínio próprio ficam para depois.
- **Pedido**: sacola no navegador (sem conta do visitante) → mensagem de WhatsApp
  montada com itens, variações, quantidades e total.
- **Itens**: produtos e serviços no mesmo catálogo, organizados por categorias.
  Campos: nome, descrição, fotos, preço, preço promocional, "a partir de",
  "sob consulta", duração (serviço), disponível/esgotado, variações.
- **Layouts**: 3 pré-definidos — `grade` (vitrine), `lista` (cardápio/serviços),
  `destaque` (fotos grandes). Todos respeitam capa, logo e cores do dono.
- **Login do dono**: Google e link mágico por e-mail. Sem senha.
- **Planos**: freemium. Grátis = 1 catálogo, 30 itens, 3 fotos por item, selo
  "feito com SeuSistema". O plano pago existe no banco, mas é ativado manualmente
  (sem gateway de pagamento por enquanto).

## Stack

- Next.js (App Router, TypeScript, Tailwind) hospedado na Vercel.
- Supabase: Postgres, Auth, Storage. Sem ORM; usar `@supabase/supabase-js` e `@supabase/ssr`.
- Zod para validar toda entrada no servidor.

## Estrutura

- `src/app/` — rotas. Página pública do catálogo em `[slug]`; painel em `painel/`;
  login em `entrar/`.
- `src/lib/` — clientes Supabase, validações, regras de plano, montagem da mensagem de WhatsApp.
- `src/layouts-catalogo/` — um componente por layout, todos com as mesmas props.
- `supabase/migrations/` — schema versionado. Toda mudança de banco é uma migration nova;
  nunca edite uma migration já aplicada.

Rotas fixas novas na raiz precisam entrar na lista de slugs reservados
(constraint `catalogs_slug_not_reserved` na migration).

## Segurança (regras, não sugestões)

- Toda tabela tem RLS ligado. A autorização mora no banco, não só na aplicação.
- A chave `service_role` nunca vai para o cliente nem para variável `NEXT_PUBLIC_*`.
- Limites de plano são garantidos por triggers no banco; a interface só os reflete.
- Tabelas `plans` e `account_plans` não têm política de escrita: só `service_role` altera.
- Conteúdo do dono (nome, descrição, links) é dado não confiável: nunca usar
  `dangerouslySetInnerHTML`; cores validadas como hex; links de contato montados
  pelo sistema a partir de campos validados, nunca URL livre.
- Uploads: apenas imagem, comprimida no navegador para WebP antes do envio,
  no caminho `{catalog_id}/...` do bucket `catalog-media`.

## Performance

- Página pública do catálogo renderizada no servidor e cacheada; invalidar ao salvar no painel.
- Página pública com o mínimo de JavaScript: só a sacola é componente de cliente.
- Imagens sempre com dimensões definidas e carregamento tardio fora da primeira dobra.

## Convenções

- Interface e textos em português do Brasil. Código, tabelas e colunas em inglês.
- Valores monetários em centavos (inteiro), nunca ponto flutuante.
- Comandos: `npm run dev`, `npm run build`, `npm run lint`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
