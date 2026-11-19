import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Client avec la clé secrète : contourne les règles d'accès.
 * À n'utiliser qu'après avoir vérifié que l'appelant est administrateur (création de comptes).
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
