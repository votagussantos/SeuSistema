import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

// Cliente do navegador: usado só para upload de imagens direto ao Storage.
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
