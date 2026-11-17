import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { Database } from '../lib/database.types';
import { supabase } from '../lib/supabase';

type Product = Database['public']['Tables']['products']['Row'];
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const PAGE_SIZE = 24;

export function ProductsPage() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: productsError } = await supabase.from('products').select('*').order('name').range(0, PAGE_SIZE - 1);
    if (productsError) setError(productsError.message);
    else {
      setProducts(data);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  async function loadMoreProducts() {
    setLoading(true);
    setError('');
    const { data, error: productsError } = await supabase.from('products').select('*').order('name').range(products.length, products.length + PAGE_SIZE - 1);
    if (productsError) setError(productsError.message);
    else {
      setProducts((current) => [...current, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  }

  async function removeProduct(product: Product) {
    if (!window.confirm(`Excluir "${product.name}"?`)) return;
    setError('');
    const { error: deleteError } = await supabase.from('products').delete().eq('id', product.id);
    if (deleteError) setError(`Não foi possível excluir o produto: ${deleteError.message}`);
    else setProducts((current) => current.filter((item) => item.id !== product.id));
  }

  return (
    <section>
      <div className="section-heading">
        <div><p className="eyebrow">CATÁLOGO</p><h1>Produtos</h1><p className="muted">Confira as opções disponíveis para você.</p></div>
        {isAdmin && <Link className="button button-primary" to="/products/new">+ Novo produto</Link>}
      </div>
      {error && <div className="notice error" role="alert">{error}</div>}
      {loading ? <p role="status">Carregando produtos...</p> : products.length === 0 ? (
        <div className="empty-state"><span className="empty-icon">✳</span><h2>Nenhum produto por aqui</h2><p>Os produtos cadastrados aparecerão nesta página.</p></div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <article className={`product-card${product.is_available ? '' : ' product-unavailable'}`} key={product.id}>
              {product.image_url ? <img className="product-image" src={product.image_url} alt="" /> : <div className="product-image product-placeholder" aria-hidden="true">JD</div>}
              <div className="product-card-body">
                <div className="product-title-row"><h2>{product.name}</h2>{!product.is_available && <span className="badge badge-muted">Indisponível</span>}</div>
                <p className="product-description">{product.description || 'Uma ótima opção para o seu dia.'}</p>
                <div className="product-card-footer">
                  <strong className="price">{currency.format(product.price)}</strong>
                  {isAdmin && <div className="inline-actions"><Link className="text-button" to={`/products/${product.id}/edit`}>Editar</Link><button className="text-button danger-text" onClick={() => void removeProduct(product)}>Excluir</button></div>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {!loading && <div className="catalog-actions">
        <button className="button button-quiet" onClick={() => void loadProducts()}>Atualizar catálogo</button>
        {hasMore && <button className="button button-primary" onClick={() => void loadMoreProducts()}>Carregar mais</button>}
      </div>}
    </section>
  );
}
