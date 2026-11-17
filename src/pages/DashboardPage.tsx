import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabase';

export function DashboardPage() {
  const { session, isAdmin } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!session?.user.id) return;
    void supabase.from('profiles').select('name').eq('id', session.user.id).single().then(({ data, error: profileError }) => {
      if (!active) return;
      if (profileError) setError(profileError.message);
      else setName(data.name);
    });
    return () => { active = false; };
  }, [session?.user.id]);

  return (
    <section>
      <div className="welcome-panel">
        <div>
          <p className="eyebrow">PAINEL DO CLIENTE</p>
          <h1>Bem-vindo, {name || session?.user.email?.split('@')[0]}!</h1>
          <p>Encontre seus favoritos e acompanhe tudo em um só lugar.</p>
        </div>
        <span className="welcome-mark" aria-hidden="true">JD</span>
      </div>
      {error && <div className="notice error" role="alert">Não foi possível carregar seu perfil: {error}</div>}
      <div className="section-heading">
        <div><p className="eyebrow">ACESSO RÁPIDO</p><h2>O que você procura?</h2></div>
      </div>
      <div className="shortcut-grid">
        <Link className="shortcut-card" to="/products"><span className="shortcut-icon">01</span><strong>Produtos</strong><span>Explore o catálogo disponível.</span><span className="card-arrow">→</span></Link>
        {isAdmin && <Link className="shortcut-card" to="/products/new"><span className="shortcut-icon">02</span><strong>Cadastro de produto</strong><span>Adicione e atualize produtos.</span><span className="card-arrow">→</span></Link>}
        <Link className="shortcut-card" to="/orders"><span className="shortcut-icon">03</span><strong>Meus pedidos</strong><span>Consulte seus pedidos recentes.</span><span className="card-arrow">→</span></Link>
        <Link className="shortcut-card" to="/profile"><span className="shortcut-icon">04</span><strong>Meu perfil</strong><span>Mantenha seus dados atualizados.</span><span className="card-arrow">→</span></Link>
      </div>
    </section>
  );
}
