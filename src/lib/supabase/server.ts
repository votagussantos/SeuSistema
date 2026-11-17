import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

// Cliente para Server Components, Server Actions e Route Handlers.
// Usa a chave publicável + cookies do usuário: quem autoriza é o RLS.
export async function createClient() {
  // A sessão depende da hora atual (validade do token): sempre em tempo de requisição.
  await connection();
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components não podem gravar cookies; o proxy renova a sessão.
        }
      },
    },
  });
}
