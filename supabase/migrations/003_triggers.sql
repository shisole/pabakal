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
