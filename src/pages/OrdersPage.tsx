import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { Database } from '../lib/database.types';
import { supabase } from '../lib/supabase';

type Order = Database['public']['Tables']['orders']['Row'];
const PAGE_SIZE = 50;
const statusNames: Record<Order['status'], string> = {
  pending: 'Aguardando confirmação',
  preparing: 'Em preparo',
  out_for_delivery: 'Saiu para entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });

export function OrdersPage() {
  const { session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!session?.user.id) return;
    void supabase.from('orders').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).range(0, PAGE_SIZE - 1).then(({ data, error: ordersError }) => {
      if (!active) return;
      if (ordersError) setError(ordersError.message);
      else {
        setOrders(data);
        setHasMore(data.length === PAGE_SIZE);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [session?.user.id]);

  async function loadMoreOrders() {
    if (!session?.user.id) return;
    setLoading(true);
    setError('');
    const { data, error: ordersError } = await supabase.from('orders').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).range(orders.length, orders.length + PAGE_SIZE - 1);
    if (ordersError) setError(`Não foi possível carregar mais pedidos: ${ordersError.message}`);
    else {
      setOrders((current) => [...current, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  }

  return (
    <section>
      <div className="section-heading"><div><p className="eyebrow">HISTÓRICO</p><h1>Meus pedidos</h1><p className="muted">Acompanhe o status dos seus pedidos.</p></div></div>
      {error && <div className="notice error" role="alert">Não foi possível carregar os pedidos: {error}</div>}
      {loading ? <p role="status">Carregando pedidos...</p> : orders.length === 0 ? (
        <div className="empty-state"><span className="empty-icon">↗</span><h2>Você ainda não tem pedidos</h2><p>Quando houver pedidos associados à sua conta, eles aparecerão aqui.</p></div>
      ) : (
        <div className="panel table-wrap">
          <table>
            <thead><tr><th>Pedido</th><th>Data</th><th>Status</th><th className="numeric">Total</th></tr></thead>
            <tbody>{orders.map((order) => <tr key={order.id}>
              <td className="order-id">#{order.id.slice(0, 8).toUpperCase()}</td>
              <td>{dateTime.format(new Date(order.created_at))}</td>
              <td><span className={`badge status-${order.status}`}>{statusNames[order.status]}</span></td>
              <td className="numeric">{currency.format(order.total)}</td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
      {!loading && hasMore && <div className="catalog-actions"><button className="button button-quiet" onClick={() => void loadMoreOrders()}>Carregar pedidos anteriores</button></div>}
    </section>
  );
}
