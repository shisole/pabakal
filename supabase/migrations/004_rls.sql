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
