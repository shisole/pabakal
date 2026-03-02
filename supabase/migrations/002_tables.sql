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
