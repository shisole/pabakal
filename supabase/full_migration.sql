-- Pabakal enum types
create type user_role as enum ('admin', 'customer');
create type cargo_status as enum ('purchased', 'packed', 'shipped', 'in_transit', 'arrived', 'distributed');
create type order_status as enum ('pending', 'confirmed', 'preparing', 'ready', 'shipped_local', 'delivered', 'cancelled');
create type fulfillment_type as enum ('in_stock', 'pre_order');
create type payment_method as enum ('gcash', 'bank_transfer', 'cash', 'dragonpay');
create type payment_status as enum ('pending', 'partial', 'paid', 'refunded');
create type product_status as enum ('draft', 'active', 'sold_out', 'archived');
create type product_condition as enum ('new', 'like_new', 'good', 'fair');
-- ─── Profiles ──────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  avatar_url text,
  role user_role not null default 'customer',
  address_line text,
  city text,
  province text,
  zip_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Categories ────────────────────────────────────────────────
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ─── Cargos (balikbayan boxes) ─────────────────────────────────
create table cargos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status cargo_status not null default 'purchased',
  shipping_provider text,
  tracking_number text,
  total_shipping_cost_php numeric(10,2) not null default 0,
  estimated_arrival date,
  actual_arrival date,
  notes text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Products ──────────────────────────────────────────────────
create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  brand text,
  condition product_condition not null default 'new',
  cost_usd numeric(10,2) not null,
  shipping_allocation_php numeric(10,2) not null default 0,
  selling_price_php numeric(10,2) not null,
  compare_at_price_php numeric(10,2),
  quantity_total int not null default 1,
  quantity_sold int not null default 0,
  quantity_reserved int not null default 0,
  status product_status not null default 'draft',
  is_featured boolean not null default false,
  cargo_id uuid references cargos(id) on delete set null,
  added_by uuid not null references profiles(id),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on products(category_id);
create index products_cargo_id_idx on products(cargo_id);
create index products_status_idx on products(status);
create index products_slug_idx on products(slug);

-- ─── Product Images ────────────────────────────────────────────
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_id_idx on product_images(product_id);

-- ─── Product Variants ──────────────────────────────────────────
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  sku text,
  price_adjustment_php numeric(10,2) not null default 0,
  quantity_total int not null default 0,
  quantity_sold int not null default 0,
  quantity_reserved int not null default 0,
  created_at timestamptz not null default now()
);

create index product_variants_product_id_idx on product_variants(product_id);

-- ─── Cargo Status History ──────────────────────────────────────
create table cargo_status_history (
  id uuid primary key default gen_random_uuid(),
  cargo_id uuid not null references cargos(id) on delete cascade,
  status cargo_status not null,
  changed_by uuid not null references profiles(id),
  notes text,
  created_at timestamptz not null default now()
);

create index cargo_status_history_cargo_id_idx on cargo_status_history(cargo_id);

-- ─── Order number sequence ─────────────────────────────────────
create sequence order_number_seq start 1;

create or replace function generate_order_number()
returns text as $$
begin
  return 'PBK-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 4, '0');
end;
$$ language plpgsql;

-- ─── Orders ────────────────────────────────────────────────────
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default generate_order_number(),
  customer_id uuid not null references profiles(id),
  status order_status not null default 'pending',
  subtotal_php numeric(10,2) not null,
  shipping_fee_php numeric(10,2) not null default 0,
  discount_php numeric(10,2) not null default 0,
  total_php numeric(10,2) not null,
  payment_status payment_status not null default 'pending',
  has_pre_order_items boolean not null default false,
  delivery_address text not null,
  delivery_city text not null,
  delivery_province text not null,
  delivery_zip text not null,
  customer_notes text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_customer_id_idx on orders(customer_id);
create index orders_status_idx on orders(status);
create index orders_payment_status_idx on orders(payment_status);

-- ─── Order Items ───────────────────────────────────────────────
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  variant_id uuid references product_variants(id),
  quantity int not null default 1,
  unit_price_php numeric(10,2) not null,
  total_price_php numeric(10,2) not null,
  fulfillment_type fulfillment_type not null default 'in_stock',
  cargo_id uuid references cargos(id),
  product_name text not null,
  product_image_url text,
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on order_items(order_id);

-- ─── Payments ──────────────────────────────────────────────────
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  amount_php numeric(10,2) not null,
  method payment_method not null,
  reference_number text,
  proof_url text,
  notes text,
  verified boolean not null default false,
  verified_at timestamptz,
  verified_by uuid references profiles(id),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index payments_order_id_idx on payments(order_id);
create index payments_verified_idx on payments(verified);

-- ─── Reviews ───────────────────────────────────────────────────
create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  customer_id uuid not null references profiles(id),
  order_id uuid not null references orders(id),
  rating int not null check (rating >= 1 and rating <= 5),
  comment text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique(product_id, customer_id, order_id)
);

create index reviews_product_id_idx on reviews(product_id);

-- ─── Notifications ─────────────────────────────────────────────
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null,
  reference_id uuid,
  reference_type text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on notifications(user_id);
create index notifications_is_read_idx on notifications(user_id, is_read);

-- ─── Exchange Rates ────────────────────────────────────────────
create table exchange_rates (
  id uuid primary key default gen_random_uuid(),
  rate numeric(10,4) not null,
  effective_date date not null,
  set_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create index exchange_rates_effective_date_idx on exchange_rates(effective_date desc);
-- ─── Auto-create profile on signup ─────────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── Auto-update updated_at ────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on profiles
  for each row execute function update_updated_at();
create trigger set_updated_at before update on products
  for each row execute function update_updated_at();
create trigger set_updated_at before update on cargos
  for each row execute function update_updated_at();
create trigger set_updated_at before update on orders
  for each row execute function update_updated_at();

-- ─── Recalculate order payment_status when payments change ─────
create or replace function update_order_payment_status()
returns trigger as $$
declare
  order_total numeric;
  paid_total numeric;
begin
  select total_php into order_total
  from orders
  where id = coalesce(new.order_id, old.order_id);

  select coalesce(sum(amount_php), 0) into paid_total
  from payments
  where order_id = coalesce(new.order_id, old.order_id)
    and verified = true;

  update orders
  set payment_status = case
    when paid_total >= order_total then 'paid'
    when paid_total > 0 then 'partial'
    else 'pending'
  end
  where id = coalesce(new.order_id, old.order_id);

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger on_payment_change
  after insert or update or delete on payments
  for each row execute function update_order_payment_status();
-- Enable RLS on all tables
alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table cargos enable row level security;
alter table cargo_status_history enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table reviews enable row level security;
alter table notifications enable row level security;
alter table exchange_rates enable row level security;

-- Helper: check if current user is admin
create or replace function is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid()
      and role = 'admin'
  );
end;
$$ language plpgsql security definer stable;

-- ─── Profiles ──────────────────────────────────────────────────
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Admins can view all profiles"
  on profiles for select using (is_admin());
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
create policy "Admins can update any profile"
  on profiles for update using (is_admin());

-- ─── Categories ────────────────────────────────────────────────
create policy "Anyone can view categories"
  on categories for select using (true);
create policy "Admins can manage categories"
  on categories for all using (is_admin());

-- ─── Products ──────────────────────────────────────────────────
create policy "Anyone can view active products"
  on products for select using (status = 'active' or is_admin());
create policy "Admins can manage products"
  on products for all using (is_admin());

-- ─── Product Images ────────────────────────────────────────────
create policy "Anyone can view product images"
  on product_images for select using (true);
create policy "Admins can manage product images"
  on product_images for all using (is_admin());

-- ─── Product Variants ──────────────────────────────────────────
create policy "Anyone can view product variants"
  on product_variants for select using (true);
create policy "Admins can manage product variants"
  on product_variants for all using (is_admin());

-- ─── Cargos ────────────────────────────────────────────────────
create policy "Admins can view all cargos"
  on cargos for select using (is_admin());
create policy "Admins can manage cargos"
  on cargos for all using (is_admin());

-- ─── Cargo Status History ──────────────────────────────────────
create policy "Admins can view cargo history"
  on cargo_status_history for select using (is_admin());
create policy "Admins can insert cargo history"
  on cargo_status_history for insert with check (is_admin());

-- ─── Orders ────────────────────────────────────────────────────
create policy "Customers can view own orders"
  on orders for select using (auth.uid() = customer_id);
create policy "Admins can view all orders"
  on orders for select using (is_admin());
create policy "Authenticated users can create orders"
  on orders for insert with check (auth.uid() = customer_id);
create policy "Admins can update orders"
  on orders for update using (is_admin());

-- ─── Order Items ───────────────────────────────────────────────
create policy "Customers can view own order items"
  on order_items for select using (
    exists (select 1 from orders where orders.id = order_items.order_id and orders.customer_id = auth.uid())
  );
create policy "Admins can view all order items"
  on order_items for select using (is_admin());
create policy "Authenticated users can create order items"
  on order_items for insert with check (
    exists (select 1 from orders where orders.id = order_items.order_id and orders.customer_id = auth.uid())
  );

-- ─── Payments ──────────────────────────────────────────────────
create policy "Customers can view own payments"
  on payments for select using (
    exists (select 1 from orders where orders.id = payments.order_id and orders.customer_id = auth.uid())
  );
create policy "Admins can view all payments"
  on payments for select using (is_admin());
create policy "Customers can submit payments"
  on payments for insert with check (
    exists (select 1 from orders where orders.id = payments.order_id and orders.customer_id = auth.uid())
  );
create policy "Admins can update payments"
  on payments for update using (is_admin());

-- ─── Reviews ───────────────────────────────────────────────────
create policy "Anyone can view visible reviews"
  on reviews for select using (is_visible = true or auth.uid() = customer_id or is_admin());
create policy "Customers can create reviews"
  on reviews for insert with check (auth.uid() = customer_id);
create policy "Customers can update own reviews"
  on reviews for update using (auth.uid() = customer_id);
create policy "Admins can manage reviews"
  on reviews for all using (is_admin());

-- ─── Notifications ─────────────────────────────────────────────
create policy "Users can view own notifications"
  on notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications"
  on notifications for update using (auth.uid() = user_id);
create policy "System can create notifications"
  on notifications for insert with check (is_admin());

-- ─── Exchange Rates ────────────────────────────────────────────
create policy "Anyone can view exchange rates"
  on exchange_rates for select using (true);
create policy "Admins can manage exchange rates"
  on exchange_rates for all using (is_admin());
-- ─── Storage Buckets ───────────────────────────────────────────

-- Product images: public read, admin write
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true);

create policy "Anyone can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Admins can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and (select is_admin()));

create policy "Admins can update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and (select is_admin()));

create policy "Admins can delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and (select is_admin()));

-- Payment proofs: private, customer write own, admin read all
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false);

create policy "Admins can view all payment proofs"
  on storage.objects for select
  using (bucket_id = 'payment-proofs' and (select is_admin()));

create policy "Users can view own payment proofs"
  on storage.objects for select
  using (bucket_id = 'payment-proofs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload payment proofs"
  on storage.objects for insert
  with check (bucket_id = 'payment-proofs' and auth.uid()::text = (storage.foldername(name))[1]);

-- Avatars: public read, user write own
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
-- Seed initial product categories
insert into categories (name, slug, description, sort_order) values
  ('Electronics', 'electronics', 'Gadgets, accessories, and tech products', 1),
  ('Beauty & Skincare', 'beauty-skincare', 'Makeup, skincare, and personal care products', 2),
  ('Fashion', 'fashion', 'Clothing, shoes, bags, and accessories', 3),
  ('Health & Supplements', 'health-supplements', 'Vitamins, supplements, and health products', 4),
  ('Food & Snacks', 'food-snacks', 'Chocolates, snacks, and specialty food items', 5),
  ('Home & Kitchen', 'home-kitchen', 'Home essentials, kitchen tools, and decor', 6),
  ('Baby & Kids', 'baby-kids', 'Baby products, toys, and kids essentials', 7),
  ('Sports & Outdoors', 'sports-outdoors', 'Athletic gear, outdoor equipment, and accessories', 8);
