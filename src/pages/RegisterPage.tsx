import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Sex } from '../lib/database.types';
import { getAuthErrorMessage } from '../lib/authError';
import { supabase } from '../lib/supabase';

const sexOptions: { value: Sex; label: string }[] = [
  { value: 'female', label: 'Feminino' },
  { value: 'male', label: 'Masculino' },
  { value: 'other', label: 'Outro' },
  { value: 'prefer_not_to_say', label: 'Prefiro não informar' },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState<Sex>('prefer_not_to_say');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim(), birth_date: birthDate, sex } },
    });
    setSubmitting(false);
    if (signUpError) {
      setError(getAuthErrorMessage(signUpError));
      return;
    }
    if (data.user?.identities?.length === 0) {
      setError('Este e-mail já está cadastrado. Tente entrar na sua conta.');
      return;
    }
    navigate('/login', {
      replace: true,
      state: { success: 'Cadastro realizado! Se a confirmação de e-mail estiver ativa, confirme seu endereço antes de entrar.' },
    });
  }

  return (
    <main className="auth-page">
      <section className="auth-card auth-card-wide">
        <Link className="brand auth-brand" to="/login">JoDelivery<span>.</span></Link>
        <p className="eyebrow">FAÇA PARTE</p>
        <h1>Crie sua conta</h1>
        <p className="muted">Seus dados ficam protegidos e só você pode editar seu perfil.</p>
        {error && <div className="notice error" role="alert">{error}</div>}
        <form className="form-stack" onSubmit={submit}>
          <label>Nome completo
            <input id="register-name" name="name" type="text" autoComplete="name" minLength={2} maxLength={120} required value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>E-mail
            <input id="register-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <div className="form-row">
            <label>Data de nascimento
              <input id="register-birth-date" name="birthDate" type="date" max={new Date().toISOString().slice(0, 10)} required value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
            </label>
            <label>Sexo
              <select id="register-sex" name="sex" value={sex} onChange={(event) => setSex(event.target.value as Sex)}>
                {sexOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
          <label>Senha <span className="field-hint">(mínimo de 8 caracteres)</span>
            <input id="register-password" name="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <button className="button button-primary button-full" disabled={submitting}>
            {submitting ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>
        <p className="auth-switch">Já tem conta? <Link to="/login">Entrar</Link></p>
      </section>
    </main>
  );
}
