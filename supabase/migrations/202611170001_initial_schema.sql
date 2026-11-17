create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null check (char_length(trim(name)) between 2 and 120),
  birth_date date not null,
  sex text not null check (sex in ('female', 'male', 'other', 'prefer_not_to_say')),
  created_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role = 'admin'),
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  description text check (description is null or char_length(description) <= 1000),
  price numeric(12, 2) not null check (price >= 0),
  image_url text,
  is_available boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  total numeric(12, 2) not null check (total >= 0),
  created_at timestamptz not null default now()
);

create or replace function public.validate_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.birth_date > current_date then
    raise exception 'A data de nascimento não pode estar no futuro.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger validate_profile_before_write
  before insert or update of birth_date on public.profiles
  for each row execute function public.validate_profile();

create index products_available_name_idx on public.products (is_available, name);
create index products_name_idx on public.products (name);
create index profiles_name_idx on public.profiles (name);
create index orders_user_created_idx on public.orders (user_id, created_at desc);

create or replace function public.handle_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.profiles (id, email, name, birth_date, sex)
    values (
      new.id,
      new.email,
      trim(coalesce(new.raw_user_meta_data ->> 'name', '')),
      (new.raw_user_meta_data ->> 'birth_date')::date,
      coalesce(new.raw_user_meta_data ->> 'sex', 'prefer_not_to_say')
    );
    return new;
  end if;

  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_auth_user();

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_auth_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.set_user_admin(target_user_id uuid, make_admin boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_count integer;
begin
  if (select auth.uid()) is null or not public.is_admin() then
    raise exception 'Apenas administradores podem alterar papéis.'
      using errcode = '42501';
  end if;

  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'Usuário não encontrado.' using errcode = 'P0002';
  end if;

  perform pg_advisory_xact_lock(hashtext('jodelivery-admin-roles'));

  if not public.is_admin() then
    raise exception 'Apenas administradores podem alterar papéis.'
      using errcode = '42501';
  end if;

  if make_admin then
    insert into public.user_roles (user_id, role)
    values (target_user_id, 'admin')
    on conflict (user_id) do nothing;
    return;
  end if;

  if target_user_id = (select auth.uid()) then
    raise exception 'Você não pode remover seu próprio acesso de administrador.'
      using errcode = '42501';
  end if;

  select count(*) into admin_count from public.user_roles where role = 'admin';
  if admin_count <= 1 then
    raise exception 'O último administrador não pode ser removido.'
      using errcode = '23514';
  end if;

  delete from public.user_roles where user_id = target_user_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

create policy "Profiles are visible to their owner or admins"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "Users update only their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke update on public.profiles from authenticated;
grant update (name, birth_date, sex) on public.profiles to authenticated;

create policy "Users and admins can read applicable roles"
  on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Authenticated users see available products and admins see all"
  on public.products for select to authenticated
  using (is_available or (select public.is_admin()));

create policy "Admins insert products"
  on public.products for insert to authenticated
  with check ((select public.is_admin()));

create policy "Admins update products"
  on public.products for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins delete products"
  on public.products for delete to authenticated
  using ((select public.is_admin()));

create policy "Users read only their own orders"
  on public.orders for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.profiles, public.user_roles, public.products, public.orders from anon, authenticated;
grant select on public.profiles, public.user_roles to authenticated;
grant update (name, birth_date, sex) on public.profiles to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select on public.orders to authenticated;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
revoke all on function public.set_user_admin(uuid, boolean) from public, anon;
grant execute on function public.set_user_admin(uuid, boolean) to authenticated;
