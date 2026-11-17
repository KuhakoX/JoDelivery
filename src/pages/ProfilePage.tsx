import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { Sex } from '../lib/database.types';
import { supabase } from '../lib/supabase';

const sexOptions: { value: Sex; label: string }[] = [
  { value: 'female', label: 'Feminino' },
  { value: 'male', label: 'Masculino' },
  { value: 'other', label: 'Outro' },
  { value: 'prefer_not_to_say', label: 'Prefiro não informar' },
];

export function ProfilePage() {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState<Sex>('prefer_not_to_say');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    if (!session?.user.id) return;
    void supabase.from('profiles').select('name,birth_date,sex').eq('id', session.user.id).single().then(({ data, error: loadError }) => {
      if (!active) return;
      if (loadError) setError(`Não foi possível carregar seu perfil: ${loadError.message}`);
      else {
        setName(data.name);
        setBirthDate(data.birth_date);
        setSex(data.sex);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [session?.user.id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (password && password.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('A confirmação da senha não corresponde.');
      return;
    }
    if (!session?.user.id) return;
    setSubmitting(true);
    const { error: profileError } = await supabase.from('profiles').update({
      name: name.trim(),
      birth_date: birthDate,
      sex,
    }).eq('id', session.user.id);
    if (profileError) {
      setError(`Não foi possível atualizar o perfil: ${profileError.message}`);
      setSubmitting(false);
      return;
    }
    if (password) {
      const { error: passwordError } = await supabase.auth.updateUser({ password });
      if (passwordError) {
        setError(`Seus dados foram salvos, mas não foi possível alterar a senha: ${passwordError.message}`);
        setSubmitting(false);
        return;
      }
    }
    setPassword('');
    setPasswordConfirmation('');
    setSuccess('Perfil atualizado com sucesso.');
    setSubmitting(false);
  }

  if (loading) return <p role="status">Carregando perfil...</p>;

  return (
    <section className="form-page">
      <div className="section-heading"><div><p className="eyebrow">SUA CONTA</p><h1>Meu perfil</h1><p className="muted">Atualize seus dados pessoais e sua senha.</p></div></div>
      {error && <div className="notice error" role="alert">{error}</div>}
      {success && <div className="notice success" role="status">{success}</div>}
      <form className="panel form-stack" onSubmit={submit}>
        <label>Nome completo
          <input required minLength={2} maxLength={120} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>E-mail
          <input type="email" value={session?.user.email || ''} disabled />
          <span className="field-hint">O e-mail não pode ser alterado por esta tela.</span>
        </label>
        <div className="form-row">
          <label>Data de nascimento
            <input type="date" max={new Date().toISOString().slice(0, 10)} required value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
          </label>
          <label>Sexo
            <select value={sex} onChange={(event) => setSex(event.target.value as Sex)}>
              {sexOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
        <div className="divider" />
        <div><h2 className="form-subheading">Alterar senha</h2><p className="field-hint">Deixe em branco para manter sua senha atual.</p></div>
        <div className="form-row">
          <label>Nova senha
            <input type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <label>Confirmar nova senha
            <input type="password" autoComplete="new-password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} />
          </label>
        </div>
        <div className="form-actions"><button className="button button-primary" disabled={submitting}>{submitting ? 'Salvando...' : 'Salvar alterações'}</button></div>
      </form>
    </section>
  );
}
