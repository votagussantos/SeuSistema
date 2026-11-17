import { ActionForm } from "@/components/action-form";
import { getMyCatalog } from "@/lib/data";
import { ui } from "@/lib/ui";
import { createCatalog, updateCatalogInfo } from "./actions";

export default async function PainelPage() {
  const catalog = await getMyCatalog();

  if (!catalog) {
    return (
      <section className={ui.card}>
        <h1 className={ui.h1}>Vamos criar seu catálogo</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Você poderá mudar o nome depois. O endereço é o link que você vai divulgar.
        </p>
        <div className="mt-5">
          <ActionForm action={createCatalog} submitLabel="Criar catálogo">
            <div>
              <label htmlFor="name" className={ui.label}>
                Nome do negócio
              </label>
              <input id="name" name="name" required maxLength={80} className={ui.input} />
            </div>
            <div>
              <label htmlFor="slug" className={ui.label}>
                Endereço do catálogo
              </label>
              <input
                id="slug"
                name="slug"
                maxLength={40}
                placeholder="ex.: doces-da-maria"
                autoCapitalize="none"
                className={ui.input}
              />
              <p className={ui.hint}>
                Letras, números e hífens. Se deixar em branco, usamos o nome do negócio.
              </p>
            </div>
          </ActionForm>
        </div>
      </section>
    );
  }

  return (
    <>
      <div>
        <h1 className={ui.h1}>{catalog.name}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Endereço: <span className="font-mono text-zinc-900">/{catalog.slug}</span> ·{" "}
          {catalog.published ? "Publicado" : "Rascunho (ninguém vê ainda)"}
        </p>
        {catalog.published && (
          <a
            href={`/${catalog.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${ui.buttonSecondary} mt-3`}
          >
            Ver catálogo
          </a>
        )}
      </div>

      <section className={ui.card}>
        <h2 className={ui.h2}>Dados e contato</h2>
        <div className="mt-4">
          <ActionForm action={updateCatalogInfo}>
            <div>
              <label htmlFor="name" className={ui.label}>
                Nome do negócio
              </label>
              <input
                id="name"
                name="name"
                required
                maxLength={80}
                defaultValue={catalog.name}
                className={ui.input}
              />
            </div>
            <div>
              <label htmlFor="description" className={ui.label}>
                Descrição
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                maxLength={500}
                defaultValue={catalog.description ?? ""}
                className={ui.input}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="whatsapp" className={ui.label}>
                  WhatsApp
                </label>
                <input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  placeholder="(11) 99999-8888"
                  defaultValue={catalog.whatsapp ?? ""}
                  className={ui.input}
                />
                <p className={ui.hint}>Os pedidos chegam neste número.</p>
              </div>
              <div>
                <label htmlFor="instagram" className={ui.label}>
                  Instagram
                </label>
                <input
                  id="instagram"
                  name="instagram"
                  placeholder="seuusuario"
                  autoCapitalize="none"
                  defaultValue={catalog.instagram ?? ""}
                  className={ui.input}
                />
              </div>
              <div>
                <label htmlFor="contact_email" className={ui.label}>
                  E-mail de contato
                </label>
                <input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  defaultValue={catalog.contact_email ?? ""}
                  className={ui.input}
                />
              </div>
              <div>
                <label htmlFor="city" className={ui.label}>
                  Cidade
                </label>
                <input
                  id="city"
                  name="city"
                  maxLength={80}
                  defaultValue={catalog.city ?? ""}
                  className={ui.input}
                />
              </div>
            </div>
            <div>
              <label htmlFor="address" className={ui.label}>
                Endereço
              </label>
              <input
                id="address"
                name="address"
                maxLength={200}
                defaultValue={catalog.address ?? ""}
                className={ui.input}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-800">
              <input
                type="checkbox"
                name="published"
                defaultChecked={catalog.published}
                className="size-4"
              />
              Catálogo publicado (visível para qualquer pessoa com o link)
            </label>
          </ActionForm>
        </div>
      </section>
    </>
  );
}
