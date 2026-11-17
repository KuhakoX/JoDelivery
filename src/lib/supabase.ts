import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || import.meta.env.VITE_SUPABASE_ANON_KEY;

function isSecretKey(key: string) {
  if (key.startsWith('sb_secret_')) return true;

  const payload = key.split('.')[1];
  if (!payload) return false;

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(base64)) as { role?: string };
    return claims.role === 'service_role';
  } catch {
    return false;
  }
}

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY com os valores do projeto Supabase.',
  );
}

if (isSecretKey(supabasePublishableKey)) {
  throw new Error(
    'VITE_SUPABASE_PUBLISHABLE_KEY contém uma chave secreta. Use a chave publishable (sb_publishable_...) ou anon pública do Supabase; nunca use service_role ou sb_secret_ no navegador.',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey);
