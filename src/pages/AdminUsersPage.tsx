import { useCallback, useEffect, useState } from 'react';
import type { Database } from '../lib/database.types';
import { supabase } from '../lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
const PAGE_SIZE = 50;

export function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [busyUserId, setBusyUserId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadUsers = useCallback(async (offset = 0) => {
    setLoading(true);
    setError('');
    const [{ data: profileData, error: profileError }, { data: roleData, error: roleError }] = await Promise.all([
      supabase.from('profiles').select('*').order('name').range(offset, offset + PAGE_SIZE - 1),
      supabase.from('user_roles').select('user_id'),
    ]);
    if (profileError || roleError) {
      setError(`Não foi possível carregar os usuários: ${profileError?.message || roleError?.message}`);
    } else {
      setProfiles((current) => offset === 0 ? profileData : [...current, ...profileData]);
      setAdminIds(new Set(roleData.map((role) => role.user_id)));
      setHasMore(profileData.length === PAGE_SIZE);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  async function changeRole(userId: string, makeAdmin: boolean) {
    setBusyUserId(userId);
    setError('');
    setSuccess('');
    const { error: roleChangeError } = await supabase.rpc('set_user_admin', {
      target_user_id: userId,
      make_admin: makeAdmin,
    });
    setBusyUserId('');
    if (roleChangeError) {
      setError(`Não foi possível atualizar o papel: ${roleChangeError.message}`);
      return;
    }
    setSuccess(makeAdmin ? 'Administrador adicionado.' : 'Administrador removido.');
    await loadUsers();
  }

  return (
    <section>
      <div className="section-heading"><div><p className="eyebrow">CONTROLE DE ACESSO</p><h1>Administradores</h1><p className="muted">Gerencie quem pode cadastrar e editar produtos.</p></div></div>
      <div className="notice info">Apenas administradores existentes podem alterar papéis. A remoção do último administrador é bloqueada.</div>
      {error && <div className="notice error" role="alert">{error}</div>}
      {success && <div className="notice success" role="status">{success}</div>}
      {loading ? <p role="status">Carregando usuários...</p> : (
        <>
          <div className="panel table-wrap">
            <table>
              <thead><tr><th>Usuário</th><th>E-mail</th><th>Papel</th><th className="numeric">Ação</th></tr></thead>
              <tbody>{profiles.map((profile) => {
                const isAdmin = adminIds.has(profile.id);
                return <tr key={profile.id}>
                  <td>{profile.name}</td>
                  <td>{profile.email}</td>
                  <td><span className={`badge ${isAdmin ? 'badge-admin' : 'badge-muted'}`}>{isAdmin ? 'Administrador' : 'Usuário'}</span></td>
                  <td className="numeric">
                    {isAdmin
                      ? <button className="text-button danger-text" disabled={busyUserId === profile.id || adminIds.size <= 1} title={adminIds.size <= 1 ? 'O último administrador não pode ser removido.' : undefined} onClick={() => void changeRole(profile.id, false)}>{busyUserId === profile.id ? 'Salvando...' : 'Remover admin'}</button>
                      : <button className="text-button" disabled={busyUserId === profile.id} onClick={() => void changeRole(profile.id, true)}>{busyUserId === profile.id ? 'Salvando...' : 'Tornar admin'}</button>}
                  </td>
                </tr>;
              })}</tbody>
            </table>
          </div>
          {hasMore && <div className="catalog-actions"><button className="button button-quiet" onClick={() => void loadUsers(profiles.length)}>Carregar mais usuários</button></div>}
        </>
      )}
    </section>
  );
}
