# JoDelivery

Aplicação React para deploy na Vercel, com autenticação e PostgreSQL gerenciados pelo Supabase.

## Executar localmente

1. Crie um projeto no [Supabase](https://supabase.com/) e copie a URL e a chave publicável (anon) do projeto.
2. Crie `.env` com base em `.env.example`:

   ```text
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-publicavel
   ```

3. Execute a migração `supabase/migrations/202611170001_initial_schema.sql` no SQL Editor do Supabase ou via Supabase CLI.
4. Instale dependências e inicie a aplicação:

   ```sh
   npm install
   npm run dev
   ```

O comando `npm run build` valida os tipos TypeScript e cria a versão de produção em `dist/`.
No painel de autenticação do Supabase, defina a política de senha para exigir pelo menos 8 caracteres e configure os URLs de redirect permitidos.

## Primeiro administrador

Cadastre a conta que será o primeiro administrador pela tela de cadastro e confirme o e-mail, se a confirmação estiver ativada. No Supabase SQL Editor, execute a consulta abaixo substituindo o endereço:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where lower(email) = lower('admin@exemplo.com')
on conflict (user_id) do nothing;
```

A página **Administradores** permite que administradores existentes promovam ou rebaixem outras contas. O banco bloqueia auto-rebaixamento e remoção do último administrador. Papéis não podem ser alterados diretamente por clientes; as políticas RLS e a função validam autorização no banco.

## Publicar na Vercel

Importe o repositório na Vercel, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas variáveis do projeto e publique. A regra em `vercel.json` encaminha rotas do React Router para a aplicação. Configure também no Supabase os URLs de redirect/autenticação para os domínios local e de produção.

Somente a chave publicável do Supabase deve ser usada no navegador. Não adicione `service_role` ao front-end.

## Escopo

- Cadastro, login, logout e edição de perfil são atendidos pelo Supabase Auth e pela tabela `profiles`.
- O catálogo é visível a usuários autenticados; somente admins podem cadastrar, editar e excluir produtos.
- **Meus pedidos** lista pedidos associados ao usuário autenticado. A criação/checkout de pedidos não faz parte deste escopo; a lista fica vazia até que outro processo crie pedidos no banco.
- Rotas internas exigem sessão, e o banco aplica Row Level Security mesmo quando acessado diretamente pela API do Supabase.
