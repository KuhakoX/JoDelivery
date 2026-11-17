import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuthErrorMessage } from '../lib/authError';
import { supabase } from '../lib/supabase';

type LoginLocationState = { success?: string; from?: { pathname?: string } };

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LoginLocationState | null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (loginError) {
        setError(getAuthErrorMessage(loginError));
        return;
      }
      navigate(state?.from?.pathname || '/dashboard', { replace: true });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? `Não foi possível concluir o login: ${requestError.message}`
          : 'Não foi possível concluir o login. Verifique sua conexão e tente novamente.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="brand auth-brand" to="/login">JoDelivery<span>.</span></Link>
        <p className="eyebrow">BEM-VINDO DE VOLTA</p>
        <h1>Entre na sua conta</h1>
        <p className="muted">Acesse seu painel e acompanhe seus pedidos.</p>
        {state?.success && <div className="notice success" role="status">{state.success}</div>}
        {error && <div className="notice error" role="alert">{error}</div>}
        <form className="form-stack" onSubmit={submit}>
          <label>E-mail
            <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>Senha
            <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <button className="button button-primary button-full" disabled={submitting}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="auth-switch">Ainda não tem conta? <Link to="/register">Cadastre-se</Link></p>
      </section>
    </main>
  );
}
