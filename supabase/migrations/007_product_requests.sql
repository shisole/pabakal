-- ─── Product Request (Pasabuy) ───────────────────────────────

-- Enum for request status
create type request_status as enum (
  'pending',
  'reviewing',
  'available',
  'unavailable',
  'closed'
);

-- Table
create table product_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  product_name text not null,
  product_url text,
  description text,
  budget_min_php numeric(10,2),
  budget_max_php numeric(10,2),
  status request_status not null default 'pending',
  admin_response text,
  estimated_price_php numeric(10,2),
  responded_by uuid references profiles(id),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_product_requests_customer on product_requests(customer_id);
create index idx_product_requests_status on product_requests(status);

-- Reuse existing updated_at trigger
create trigger set_updated_at before update on product_requests
  for each row execute function update_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────
alter table product_requests enable row level security;

create policy "Customers can view own requests"
  on product_requests for select using (auth.uid() = customer_id);
create policy "Admins can view all requests"
  on product_requests for select using (is_admin());
create policy "Customers can create own requests"
  on product_requests for insert with check (auth.uid() = customer_id);
create policy "Admins can update any request"
  on product_requests for update using (is_admin());

-- ─── Notification Triggers ────────────────────────────────────

-- Notify all admins when a new request is submitted
create or replace function notify_admin_new_request()
returns trigger as $$
declare
  admin_row record;
begin
  for admin_row in
    select id from profiles where role = 'admin'
  loop
    insert into notifications (user_id, title, body, type, reference_id, reference_type)
    values (
      admin_row.id,
      'New Product Request',
      'A customer requested: ' || new.product_name,
      'product_request',
      new.id,
      'product_request'
    );
  end loop;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_new_product_request
  after insert on product_requests
  for each row execute function notify_admin_new_request();

-- Notify customer when admin responds
create or replace function notify_customer_request_response()
returns trigger as $$
begin
  if old.admin_response is null and new.admin_response is not null then
    insert into notifications (user_id, title, body, type, reference_id, reference_type)
    values (
      new.customer_id,
      'Request Update',
      'Your request for "' || new.product_name || '" has been updated.',
      'product_request',
      new.id,
      'product_request'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_request_response
  after update on product_requests
  for each row execute function notify_customer_request_response();
