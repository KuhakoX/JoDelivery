import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabase';

export function AppLayout() {
  const { session, isAdmin, roleError } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  async function logout() {
    setError('');
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(`Não foi possível sair: ${signOutError.message}`);
      return;
    }
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/dashboard">JoDelivery<span>.</span></Link>
        <nav aria-label="Navegação principal">
          <NavLink to="/dashboard">Início</NavLink>
          <NavLink to="/products">Produtos</NavLink>
          {isAdmin && <NavLink to="/products/new">Cadastrar produto</NavLink>}
          <NavLink to="/orders">Meus pedidos</NavLink>
          <NavLink to="/profile">Meu perfil</NavLink>
          {isAdmin && <NavLink to="/admin/users">Administradores</NavLink>}
        </nav>
        <div className="account-actions">
          <span className="account-email">{session?.user.email}</span>
          <button className="button button-quiet" onClick={logout}>Sair</button>
        </div>
      </header>
      {error && <div className="notice error global-notice" role="alert">{error}</div>}
      {roleError && <div className="notice error global-notice" role="alert">Não foi possível verificar suas permissões: {roleError}</div>}
      <main className="page-content"><Outlet /></main>
      <footer className="footer">JoDelivery · Entrega simples, do seu jeito.</footer>
    </div>
  );
}
