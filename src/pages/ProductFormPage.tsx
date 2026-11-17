import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { Database } from '../lib/database.types';
import { supabase } from '../lib/supabase';

type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

export function ProductFormPage() {
  const { productId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(Boolean(productId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!productId) return;
    void supabase.from('products').select('*').eq('id', productId).single().then(({ data, error: loadError }) => {
      if (!active) return;
      if (loadError) setError(`Não foi possível carregar o produto: ${loadError.message}`);
      else {
        setName(data.name);
        setDescription(data.description || '');
        setPrice(String(data.price));
        setImageUrl(data.image_url || '');
        setIsAvailable(data.is_available);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [productId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError('Informe um preço válido, igual ou maior que zero.');
      return;
    }
    setSubmitting(true);
    const changes = {
      name: name.trim(),
      description: description.trim() || null,
      price: numericPrice,
      image_url: imageUrl.trim() || null,
      is_available: isAvailable,
    } satisfies Pick<ProductInsert, 'name' | 'description' | 'price' | 'image_url' | 'is_available'>;
    const result = productId
      ? await supabase.from('products').update(changes satisfies ProductUpdate).eq('id', productId)
      : await supabase.from('products').insert({ ...changes, created_by: session?.user.id } satisfies ProductInsert);
    setSubmitting(false);
    if (result.error) {
      setError(`Não foi possível salvar o produto: ${result.error.message}`);
      return;
    }
    navigate('/products', { replace: true });
  }

  if (loading) return <p role="status">Carregando produto...</p>;

  return (
    <section className="form-page">
      <Link className="back-link" to="/products">← Voltar aos produtos</Link>
      <div className="section-heading"><div><p className="eyebrow">CATÁLOGO</p><h1>{productId ? 'Editar produto' : 'Cadastrar produto'}</h1></div></div>
      {error && <div className="notice error" role="alert">{error}</div>}
      <form className="panel form-stack" onSubmit={submit}>
        <label>Nome do produto
          <input required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>Descrição
          <textarea rows={4} maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <div className="form-row">
          <label>Preço (R$)
            <input type="number" min="0" step="0.01" required value={price} onChange={(event) => setPrice(event.target.value)} />
          </label>
          <label>Imagem (URL)
            <input type="url" placeholder="https://" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
          </label>
        </div>
        <label className="check-label"><input type="checkbox" checked={isAvailable} onChange={(event) => setIsAvailable(event.target.checked)} /> Produto disponível no catálogo</label>
        <div className="form-actions">
          <Link className="button button-quiet" to="/products">Cancelar</Link>
          <button className="button button-primary" disabled={submitting}>{submitting ? 'Salvando...' : 'Salvar produto'}</button>
        </div>
      </form>
    </section>
  );
}
