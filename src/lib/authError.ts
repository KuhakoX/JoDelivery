import type { AuthError } from '@supabase/supabase-js';

export function getAuthErrorMessage(error: AuthError) {
  const message = error.message.toLowerCase();

  if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
    return 'Confirme seu e-mail antes de entrar. Verifique também a pasta de spam.';
  }

  if (message.includes('invalid login credentials') || message.includes('invalid_credentials')) {
    return 'E-mail ou senha inválidos. Confira os dados e tente novamente.';
  }

  if (error.status === 429 || message.includes('too many requests')) {
    return 'Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.';
  }

  if (error.status === 401) {
    return 'O Supabase rejeitou a chave da API (HTTP 401). Confira se VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY são do mesmo projeto e se a chave é publishable (sb_publishable_...) ou anon pública. Depois de alterar as variáveis na Vercel, faça um novo deploy.';
  }

  return error.message;
}
